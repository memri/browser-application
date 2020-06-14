//
//  CVUToString.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

export function toCVUString(depth, tab) {
    
    function valueToString(value, depth =  0, tab =  "    ") {
        if (value == undefined || `${value}` == "nil") {
            return "null"
        }
        else {`.{name}`
            let p = value;
            if (typeof p == "string") { //}, (p.contains(" ") || p.contains("\t") || p.contains("\"") || p == "") {
                //return "\`{p.replace(`\"", "\\\\\""))\""//TODO
            }
            else if (Array.isArray(value)) {
                return arrayToString(p, depth+1, tab)
            }
            else if (p /*as? [String:Any?]*/) {//TODO
                return dictToString(p, depth+1, tab)
            }
            else if (p instanceof CVUToString) {
                return p.toCVUString(depth + 1, tab)
            }
            else if (p instanceof Color) {
                return p.toLowerCase().substr(0,7);
            }
            else if (p instanceof Double) {
                if (p.truncatingRemainder(1) == 0) {//TODO
                    return `${p}`
                }
            }
            else if (p instanceof CGFloat) {
                if (p.truncatingRemainder(1) == 0) {//TODO
                    return `${p}`
                }
            }
            else if (p instanceof VerticalAlignment) {
                switch (p) {
                case VerticalAlignment.top: return "top";
                case VerticalAlignment.center: return "center";
                case VerticalAlignment.bottom: return "bottom";
                default: return "center";
                }
            }
            else if (p instanceof HorizontalAlignment) {
                switch (p) {
                case HorizontalAlignment.leading: return "left";
                case HorizontalAlignment.center: return "center";
                case HorizontalAlignment.trailing: return "right";
                default: return "center"
                }
            }
            else if (p instanceof Alignment) {
                switch (p) {
                case Alignment.top: return "top"
                case Alignment.center: return "center"
                case Alignment.bottom: return "bottom"
                case Alignment.leading: return "left"
                case Alignment.trailing: return "right"
                default: return "center"
                }
            }
            else if (p instanceof TextAlignment) {
                switch (p) {
                case TextAlignment.leading: return "left"
                case TextAlignment.center: return "center"
                case TextAlignment.trailing: return "right"
                }
            }
            else if (p instanceof Font.Weight) {
                switch (p) {
                case Font.Weight.regular: return "regular"
                case Font.Weight.bold: return "bold"
                case Font.Weight.semibold: return "semibold"
                case Font.Weight.heavy: return "heavy"
                case Font.Weight.light: return "light"
                case Font.Weight.ultraLight: return "ultralight"
                case Font.Weight.black: return "black"
                default: return "regular"
                }
            }

            return `${p}`
        }
        
        return ""
    }
    
    function arrayToString(list, depth =  0, tab =  "    ", withDef =  true, extraNewLine =  false) {
        //TODO
        /*let tabs = Array(0..<depth).map{_ in tab}.joined()
        let tabsEnd = depth > 0 ? Array(0..<depth - 1).map{_ in tab}.joined() : ""*/
        
        var str = [];
        var isMultiline = false;
        for (value of list) {
            let strValue = valueToString(value, depth, tab);
            str.push(strValue);
            if (!isMultiline) { isMultiline = (strValue.indexOf("\n") > -1) }
        }
        
        return withDef
            ? isMultiline
                ? `[\n${tabs + str.join(`\n${tabs}`)}\n${tabsEnd}]`
                : str.join(" ")
            : str.join((extraNewLine ? "\n" : "") + `\n${tabs}`)
    }

    function dictToString(dict, depth = 0, tab = "    ",
                          withDef = true, extraNewLine = false,
                          sortFunc) {
        var keys:[String];
        try {
            keys = (sortFunc)
                ? dict.keys.sort(sortFunc)
                : dict.keys.sort((a, b) =>  a > b);
        }
        catch (e) {
            keys = dict.keys.sort((a,b) => a - b);
        }
        //TODO: ?
        //let tabs = Array(0..<depth).map{_ in tab}.joined()
        //let tabsEnd = depth > 0 ? Array(0..<depth - 1).map{_ in tab}.joined() : ""
        
        var str = [];
        for (let key in keys) {
            if (key == "children" || key == "renderDefinitions" || key == "datasourceDefinition"
              || key == "sessionDefinitions" || key == "viewDefinitions") {
                continue
            }
            else if (key == "cornerradius") {
                var value = dict[key];
                if (value) {
                    let radius = value.pop();
                    str.push(`cornerradius: ${valueToString(radius, depth, tab)}`);
                    str.push(`border: ${valueToString(value, depth, tab)}`);
                }
                else {
                    // ???
                }
            }
            else if (key == "frame") {
                let names = ["minWidth", "maxWidth", "minHeight", "maxHeight", "align"];
                let list = dict[key];
                if (list) {
                    for (let i = 0; i < list.length; i++) {
                        if (list[i]) {
                            str.push(`${names[i]}: ${valueToString(list[i], depth, tab)}`);
                        }
                    }
                }
            }
            else {
                let p = dict[key] /*as? [String:Any?]*///TODO:
                if (p) {
                    str.push((extraNewLine ? "\n" + (withDef ? tabs : tabsEnd) : "")
                        + `${key}: ${valueToString(p, depth, tab)}`)
                }
                else if (dict[key]){
                    str.push(`${key}: ${valueToString(dict[key], depth, tab})`)
                }
            }
        }
        
        var children:String = "";
        var definitions:String = "";
        let p = dict["children"];
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof UIElement) {
            let body = arrayToString(p, depth, tab, withDef, extraNewLine);//TODO
            children = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["datasourceDefinition"];
        if (p instanceof CVUParsedDatasourceDefinition) {
            let body = p.toCVUString(depth - 1, tab);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["sessionDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedSessionDefinition) {
            let body = arrayToString(p, depth - 1, tab, withDef, extraNewLine);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["viewDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedViewDefinition) {
            let body = arrayToString(p, depth - 1, tab, withDef, extraNewLine);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        p = dict["renderDefinitions"];//TODO normal check
        if (Array.isArray(p) && p.length > 0 && p[0] instanceof CVUParsedRendererDefinition) {
            let body = arrayToString(p, depth - 1, tab, withDef, extraNewLine);
            definitions = `${str.length > 0 ? `\n\n${tabs}` : ``}${body}`;
        }
        
        return withDef
            ? `{\n${tabs + str.join(`\n${tabs}`) + children + definitions}\n${tabsEnd}}`
            : `${str.join(`\n${tabs}`) + children + definitions}`
    }}
