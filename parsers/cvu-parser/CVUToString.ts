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
            } else if (p instanceof CVUParsedDefinition) {//TODO:
                return p.toCVUString(depth + 1, tab)
            } else if (p instanceof Color) {
                return String(p.toLowerCase().substr(0, 7));
            } else if (typeof p == "number") {//TODO: Double;
                if (p % 1 == 0) {
                    return `${p}`
                }
            } else if (p instanceof CGFloat) {
                if (p % 1 == 0) {
                    return `${p}`
                }
            } /*else if (p instanceof VerticalAlignment) {
                return VerticalAlignment.hasOwnProperty(p) ? p : "center";//TODO: just test
            } else if (p instanceof HorizontalAlignment) {
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
            } else if (p instanceof Alignment) {
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
            } else if (p instanceof TextAlignment) {
                switch (p) {
                    case TextAlignment.leading:
                        return "left"
                    case TextAlignment.center:
                        return "center"
                    case TextAlignment.trailing:
                        return "right"
                }
            } else if (p instanceof Font.Weight) {
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
            }*/ else if (typeof p == "object") {
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
                 sortFunc): string {
        var keys: [string];
        try {
            keys = dict/*(sortFunc)
                ? dict.keys.sort(sortFunc)
                : dict.keys.sort((a, b) =>  a > b);*///TODO: some sort methods of objects
        } catch (e) {
            keys = dict.keys.sort((a, b) => a - b);
        }

        let tabs = tab.repeat(depth);
        let tabsEnd = depth > 0 ? tab.repeat(depth - 1) : "";

        var str = [];
        for (let key in keys) {
            if (key == "children" || key == "renderDefinitions" || key == "datasourceDefinition"
                || key == "sessionDefinitions" || key == "viewDefinitions") {
                continue;
            } else if (key == "cornerborder") {
                var value = dict[key];
                if (Array.isArray(value)) {
                    let radius = value.pop();
                    //str.push(`cornerradius: ${this.valueToString(radius, depth, tab)}`);
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
                if (typeof p == "object") {
                    str.push((extraNewLine ? "\n" + (withDef ? tabs : tabsEnd) : "")
                        + `${key}: ${this.valueToString(p, depth, tab)}`)
                } else if (dict[key]) {
                    str.push(`${key}: ${this.valueToString(dict[key], depth, tab)}`)
                }
            }
        }

        var children: string = "";
        var definitions: string = "";
        let p = dict["children"];
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof UIElement) {
            let body = this.arrayToString(p, depth, tab, false, true);
            children = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["datasourceDefinition"];
        if (p instanceof CVUParsedDatasourceDefinition) {
            let body = p.toCVUString(depth - 1, tab);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["sessionDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedSessionDefinition) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["viewDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedViewDefinition) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["renderDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedRendererDefinition) {
            let body = this.arrayToString(p, depth - 1, tab, false, true);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }

        return withDef
            ? `{\n${tabs}${str.join(`\n${tabs}`)}${children}${definitions}\n${tabsEnd}}`
            : `${str.join(`\n${tabs}`)}${children}${definitions}`
    }

}