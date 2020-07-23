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
import {Item} from "../../model/items/Item";
import {ItemReference} from "../../model/DatabaseController";

//function UIElement() {}

export class CVUSerializer {

    valueToString(value, depth = 0, tab: string = "    "): string {
        if (value == null || value === "nil") {
            return "null"
        } else {
            let p = value;
            if (Object.values(VerticalAlignment).includes(p)) {
                return  p.replace(/^"|"$/g, '');//TODO:
            } else if (Object.values(HorizontalAlignment).includes(p)) {
                return p.replace(/^"|"$/g, '');
            } else if (Object.values(Alignment).includes(p)) {
                return p.replace(/^"|"$/g, '');
            } else if (Object.values(TextAlignment).includes(p)) {
                return p.replace(/^"|"$/g, '');
            } else if (Object.values(Font.Weight).includes(p)) {
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
            } else
            if (typeof p == "string") { //}, (p.contains(" ") || p.contains("\t") || p.contains("\"") || p == "") {
                return `"${p.replace("\"", "\\\"")}"`;
            } else if (Array.isArray(p)) {
                return this.arrayToString(p, depth + 1, tab)
            } else if (typeof p.isCVUObject === "function") {//TODO:
                return this.dictToString(p, depth + 1, tab)
            } else if (typeof p.toCVUString === "function") {//TODO:
                return p.toCVUString(depth + 1, tab)
            } else if (p instanceof Item && p.uid.value) {
                return `{{ item(${p.genericType}, ${p.uid.value}) }}`
            } else if (p instanceof ItemReference) {
                let p1 = p?.resolve();
                if (p1 && p1.uid.value)
                    return `{{ item(${p1.genericType}, ${p1.uid.value}) }}`
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
            } /*else if (typeof p == "object") {
                return this.dictToString(p, depth + 1, tab)
            }*/

            return `${p}`
        }

        return ""
    }

    arrayToString(list:any[], depth:number = 0, tab:string = "    ", withDef:boolean = true, extraNewLine: boolean = false): string {
        let tabs = tab.repeat(depth);
        let tabsEnd = depth > 0 ? tab.repeat(depth - 1) : "";

        var str = [];
        var isMultiline = false;
        for (let value in list) {
            let strValue = this.valueToString(list[value], depth, tab);
            str.push(strValue);
            if (!isMultiline) {
                isMultiline = (strValue.indexOf("\n") > -1)
            }
        }

        return str.length == 0 ? "[]": withDef
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
            if (key == "children" || key == "rendererDefinitions" || key == "datasourceDefinition"
                || key == "sessionDefinitions" || key == "viewDefinitions" || key == "isCVUObject" || key == ".") {
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
                let value = dict[key];
                let isDef = value instanceof CVUParsedDefinition
                let dict1 = (value)?.parsed

                if (!isDef || dict1 != undefined && dict1?.length > 0) {
                    let p = value;
                    if (p && typeof p.isCVUObject === "function") {
                        str.push((extraNewLine ? "\n" + (withDef ? tabs : tabsEnd) : "")
                            + `${key}: ${this.valueToString(p, depth, tab)}`);
                    } else if (value) {
                        str.push(`${key}: ${this.valueToString(value, depth, tab)}`);
                    }
                }
            }
        }

        var children: string = "";
        var definitions: string[] = [];
        let p = dict["children"];
        var hasPriorContent = str.length > 0;
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof UIElement) {
            let body = this.arrayToString(p, depth, tab, false, true);
            children = `${hasPriorContent ? `\n\n${tabs}` : ``}${body}`;
            hasPriorContent = true
        }
        p = dict["datasourceDefinition"];
        if (p instanceof CVUParsedDatasourceDefinition && p.parsed != undefined) {
            let body = p.toCVUString(depth, tab);
            definitions.push(`${hasPriorContent ? `\n\n${tabs}` : ``}${body}`);
            hasPriorContent = true
        }
        p = dict["sessionDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedSessionDefinition && p[0].parsed != undefined) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions.push(`${hasPriorContent ? `\n\n${tabs}` : ``}${body}`);
            hasPriorContent = true
        }
        p = dict["viewDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedViewDefinition && p[0].parsed != undefined) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions.push(`${hasPriorContent ? `\n\n${tabs}` : ``}${body}`);
            hasPriorContent = true
        }
        p = dict["renderDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedRendererDefinition && p[0].parsed != undefined) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions.push(`${hasPriorContent ? `\n\n${tabs}` : ``}${body}`);
            hasPriorContent = true
        }

        return withDef
            ? `{\n${tabs}${str.join(`\n${tabs}`)}${children}${definitions.join('')}\n${tabsEnd}}`
            : `${str.join(`\n${tabs}`)}${children}${definitions.join('')}`
    }

}

export function orderKeys(obj, sortFunc?) {
    if (!sortFunc)
        sortFunc = function keyOrder(k1, k2) {
            return k1 - k2;
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