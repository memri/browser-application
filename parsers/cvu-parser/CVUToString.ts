//
//  CVUToString.swift
//
//  Copyright © 2020 memri. All rights reserved.
//
import {HorizontalAlignment, Alignment, Color, VerticalAlignment, TextAlignment, Font, CGFloat} from "./CVUParser";
import {
    CVUParsedDatasourceDefinition, CVUParsedDefinition,
    CVUParsedRendererDefinition,
    CVUParsedSessionDefinition, CVUParsedViewDefinition
} from "./CVUParsedDefinition";
import {UIElement} from "../../cvu/views/UIElement";
import {Expression} from "../expression-parser/Expression";

//function UIElement() {}

export class CVUSerializer {

    valueToString(value, depth = 0, tab: string = "    "): string {
        if (value == null || value === "nil") {
            return "null"
        } else {
            let p = value;
            if (typeof p == "string") { //}, (p.contains(" ") || p.contains("\t") || p.contains("\"") || p == "") {
                return `"${p.replace("\"", "\\\"")}"`;
            } else if (Array.isArray(p)) {
                return this.arrayToString(p, depth + 1, tab)
            } else if (typeof p.isCVUObject === "function") {//TODO:
                return this.dictToString(p, depth + 1, tab)
            } else if (typeof p.toCVUString === "function") {//TODO:
                return p.toCVUString(depth + 1, tab)
            } else if (p instanceof Color) {
                return String(p.toLowerCase().substr(0, 7));
            } else if (typeof p == "number") {//TODO: Double;
                if (p % 1 == 0) {
                    return `${Number(p)}`
                }
            } else if (p instanceof CGFloat) {
                if (p % 1 == 0) {
                    return `${Number(p)}`
                }
            } else if (VerticalAlignment.hasOwnProperty(p)) {
                return  p;//TODO:
            } else if (HorizontalAlignment.hasOwnProperty(p)) {
                switch (p) {
                    case HorizontalAlignment.leading:
                        return "left";
                    case HorizontalAlignment.center:
                        return "center";
                    case HorizontalAlignment.trailing:
                        return "right";
                    default:
                        return "center"
                }
            } else if (Alignment.hasOwnProperty(p)) {
                switch (p) {
                    case Alignment.top:
                        return "top"
                    case Alignment.center:
                        return "center"
                    case Alignment.bottom:
                        return "bottom"
                    case Alignment.leading:
                        return "left"
                    case Alignment.trailing:
                        return "right"
                    default:
                        return "center"
                }
            } else if (TextAlignment.hasOwnProperty(p)) {
                switch (p) {
                    case TextAlignment.leading:
                        return "left"
                    case TextAlignment.center:
                        return "center"
                    case TextAlignment.trailing:
                        return "right"
                }
            } else if (Font.Weight.hasOwnProperty(p)) {
                switch (p) {
                    case Font.Weight.regular:
                        return "regular"
                    case Font.Weight.bold:
                        return "bold"
                    case Font.Weight.semibold:
                        return "semibold"
                    case Font.Weight.heavy:
                        return "heavy"
                    case Font.Weight.light:
                        return "light"
                    case Font.Weight.ultraLight:
                        return "ultralight"
                    case Font.Weight.black:
                        return "black"
                    default:
                        return "regular"
                }
            } else if (typeof p == "object") {
                return this.dictToString(p, depth + 1, tab)
            }

            return `${p}`
        }

        return ""
    }

    arrayToString(list:any[], depth:number = 0, tab:string = "    ", withDef:boolean = true, extraNewLine: boolean = false): string {
        let tabs = tab.repeat(depth);
        let tabsEnd = depth > 0 ? tab.repeat(depth - 1) : "";

        var str = [];
        var isMultiline = false;
        for (let value of list) {
            let strValue = this.valueToString(value, depth, tab);
            str.push(strValue);
            if (!isMultiline) {
                isMultiline = (strValue.indexOf("\n") > -1)
            }
        }

        return withDef
            ? isMultiline
                ? `[\n${tabs}${str.join(`\n${tabs}`)}\n${tabsEnd}]`
                : str.join(" ")
            : str.join((extraNewLine ? "\n" : "") + `\n${tabs}`)
    }

    dictToString(dict, depth: number = 0, tab: string = "    ",
                 withDef: boolean = true, extraNewLine: boolean = false,
                 sortFunc?): string {
        var keys: string[];
        try {
            keys = orderKeys(dict, sortFunc);
        } catch (e) {
            keys = orderKeys(dict, sortFunc);
        }

        let tabs = tab.repeat(depth);
        let tabsEnd = depth > 0 ? tab.repeat(depth - 1) : "";

        var str = [];
        for (let key in keys) {
            if (key == "children" || key == "renderDefinitions" || key == "datasourceDefinition"
                || key == "sessionDefinitions" || key == "viewDefinitions" || key == "isCVUObject") {
                continue;
            } else if (key == "cornerborder") {
                var value = dict[key];
                if (Array.isArray(value)) {
                    value.pop();
                    str.push(`border: ${this.valueToString(value, depth, tab)}`);
                } else {
                    // ???
                }
            } else if (key == "frame") {
                let names = ["minWidth", "maxWidth", "minHeight", "maxHeight", "align"];
                let list = dict[key];
                if (Array.isArray(list)) {
                    for (let i = 0; i < list.length; i++) {
                        if (list[i]) {
                            str.push(`${names[i]}: ${this.valueToString(list[i], depth, tab)}`);
                        }
                    }
                }
            } else {
                let p = dict[key];
                if (p && typeof p.isCVUObject === "function") {
                    str.push((extraNewLine ? "\n" + (withDef ? tabs : tabsEnd) : "")
                        + `${key}: ${this.valueToString(p, depth, tab)}`);
                } else {
                    str.push(`${key}: ${this.valueToString(dict[key], depth, tab)}`);
                }
            }
        }

        var children: string = "";
        var definitions: string[] = [];
        let p = dict["children"];
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof UIElement) {
            let body = this.arrayToString(p, depth, tab, false, true);
            children = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["datasourceDefinition"];
        if (p instanceof CVUParsedDatasourceDefinition) {
            let body = p.toCVUString(depth - 1, tab);
            definitions.push(`${str.length > 0 ? `\n\n${tabs}` : ``}${body}`);
        }
        p = dict["sessionDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedSessionDefinition) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions.push(`${str.length > 0 ? `\n\n${tabs}` : ``}${body}`);
        }
        p = dict["viewDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedViewDefinition) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions.push(`${str.length > 0 ? `\n\n${tabs}` : ``}${body}`);
        }
        p = dict["renderDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedRendererDefinition) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions.push(`${str.length > 0 ? `\n\n${tabs}` : ``}${body}`);
        }

        return withDef
            ? `{\n${tabs}${str.join(`\n${tabs}`)}${children}${definitions.join('')}\n${tabsEnd}}`
            : `${str.join(`\n${tabs}`)}${children}${definitions.join('')}`
    }

}

export function orderKeys(obj, sortFunc) {
    if (!sortFunc)
        sortFunc = function keyOrder(k1, k2) {
            if (k1 < k2)
                return 1;
            else if (k1 > k2)
                return -1;
            else
                return 0;
        };
    var keys = Object.keys(obj).sort(sortFunc);
    var i, after = {};
    for (i = 0; i < keys.length; i++) {
        after[keys[i]] = obj[keys[i]];
        delete obj[keys[i]];
    }
    for (i = 0; i < keys.length; i++) {
        obj[keys[i]] = after[keys[i]];
    }
    return obj;
}