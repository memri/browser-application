//
//  CVUToString.swift
//
//  Copyright © 2020 memri. All rights reserved.
//
import {HorizontalAlignment, Alignment, Color, VerticalAlignment, TextAlignment, Font, CGFloat} from "./CVUParser";
import {MemriDictionary} from "../../model/MemriDictionary";

//function UIElement() {}

export class CVUSerializer {

    static valueToString(value, depth = 0, tab: string = "    "): string {
        if (value == null /*|| value === "nil"*/) {
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
            } else if (p.constructor.name === "MemriDictionary") {//TODO:
                return this.dictToString(p, depth + 1, tab)
            } else if (typeof p.toCVUString === "function") {//TODO:
                return p.toCVUString(depth, tab)
            } else if (p?.constructor?.name == "Item" && p.uid) {
                return `{{ item('${p.genericType}', ${p.uid}) }}`
            } else if (p?.constructor?.name == "ItemReference") {
                let p1 = p?.resolve();
                if (p1 && p1.uid)
                    return `{{ item('${p1.genericType}', ${p1.uid}) }}`
            } else if (p?.constructor?.name == "Color") {
                return String(p.toLowerCase().substr(0, 7));
                /* TODO:
                else if case let ColorDefinition.hex(hex) = p {
				return "#\(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")))"
            }
            else if case let ColorDefinition.system(uiColor) = p {
                return uiColor.hexString()
            }
                 */
            } else if (typeof p == "number") {//TODO: Double;
                if (p % 1 == 0) {
                    return `${Number(p)}`
                }
            } else if (p?.constructor?.name == "CGFloat") {
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

    static arrayToString(list:any[], depth:number = 0, tab:string = "    ", withDef:boolean = true, extraNewLine: boolean = false): string {
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

    static dictToString(dict: MemriDictionary, depth: number = 0, tab: string = "    ",
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
                let isDef = value?.constructor?.name == "CVUParsedDefinition"
                let dict1 = (value)?.parsed

                if (!isDef || dict1 != undefined && Object.entries(dict1)?.length > 0) {
                    let p = value;
                    if (p && p.constructor.name === "MemriDictionary") {
                        str.push((extraNewLine ? "\n" + (withDef ? tabs : tabsEnd) : "")
                            + `${key}: ${this.valueToString(p, depth, tab)}`);
                    } else if (value !== undefined) {
                        //console.log(`****** ${key}`);
                        str.push(`${key}: ${this.valueToString(value, depth, tab)}`);
                    }
                }
            }
        }

        var children: string = "";
        var definitions: string[] = [];
        let p = dict["children"];
        var hasPriorContent = str.length > 0;
        if (Array.isArray(p) && p.length > 0 && p[0]?.constructor?.name == "UIElement") {
            let body = this.arrayToString(p, depth, tab, false, true);
            children = `${hasPriorContent ? `\n\n${tabs}` : ``}${body}`;
            hasPriorContent = true
        }
        p = dict["datasourceDefinition"];
        if (p && p?.constructor?.name == "CVUParsedDatasourceDefinition" && p.parsed != undefined) {
            let body = p.toCVUString(depth, tab);
            definitions.push(`${hasPriorContent ? `\n\n${tabs}` : ``}${body}`);
            hasPriorContent = true
        }
        p = dict["sessionDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0]?.constructor?.name == "CVUParsedSessionDefinition" && p[0].parsed != undefined) {
            let body = this.arrayToString(p, depth, tab, false, true);
            definitions.push(`${hasPriorContent ? `\n\n${tabs}` : ``}${body}`);
            hasPriorContent = true
        }
        p = dict["viewDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0]?.constructor?.name == "CVUParsedViewDefinition" && p[0].parsed != undefined) {
            let body = this.arrayToString(p, depth, tab, false, true);
            definitions.push(`${hasPriorContent ? `\n\n${tabs}` : ``}${body}`);
            hasPriorContent = true
        }
        p = dict["rendererDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0]?.constructor?.name == "CVUParsedRendererDefinition" && p[0].parsed != undefined) {
            let body = this.arrayToString(p, depth, tab, false, true);
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