//
//  CVUValidator.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

import {
    Action,
    ActionFamily,
    ActionProperties, Alignment, Font,
    HorizontalAlignment, TextAlignment,
    validateActionType,
    VerticalAlignment
} from "../../../../router";
import {UIElementFamily} from "../../../../router";

export enum UIElementProperties {
    resizable = "resizable",
    show = "show",
    alignment = "alignment",
    align = "align",
    textAlign = "textAlign",
    spacing = "spacing",
    title = "title",
    text = "text",
    image = "image",
    nopadding = "nopadding",

    press = "press",
    bold = "bold",
    italic = "italic",
    underline = "underline",
    strikethrough = "strikethrough",
    list = "list",
    viewName = "viewName",
    view = "view",
    arguments = "arguments",
    location = "location",

    address = "address",
    systemName = "systemName",
    cornerRadius = "cornerRadius",
    hint = "hint",
    value = "value",
    datasource = "datasource",
    defaultValue = "defaultValue",
    empty = "empty",
    style = "style",

    frame = "frame",
    color = "color",
    font = "font",
    padding = "padding",
    background = "background",
    rowbackground = "rowbackground",
    cornerborder = "cornerborder",
    border = "border",
    margin = "margin",

    shadow = "shadow",
    offset = "offset",
    blur = "blur",
    opacity = "opacity",
    zindex = "zindex",
    minWidth = "minWidth",
    maxWidth = "maxWidth",
    minHeight = "minHeight",
    maxHeight = "maxHeight"
}

export var validateUIElementProperties = function (key, value) {
    if (value?.constructor?.name == "Expression") {
        return true
    }

    let prop = UIElementProperties[key];
    switch (prop) {
        case UIElementProperties.resizable:
        case UIElementProperties.title:
        case UIElementProperties.text:
        case UIElementProperties.viewName:
        case UIElementProperties.systemName:
        case UIElementProperties.hint:
        case UIElementProperties.empty:
        case UIElementProperties.style:
        case UIElementProperties.defaultValue:
            return typeof value == "string";
        case UIElementProperties.show:
        case UIElementProperties.nopadding:
        case UIElementProperties.bold:
        case UIElementProperties.italic:
        case UIElementProperties.underline:
        case UIElementProperties.strikethrough:
            return typeof value == "boolean";
        case UIElementProperties.alignment:
            return Object.values(VerticalAlignment).includes(value) || Object.values(HorizontalAlignment).includes(value)
        case UIElementProperties.align:
            return Object.values(Alignment).includes(value)
        case UIElementProperties.textAlign:
            return Object.values(TextAlignment).includes(value)
        case UIElementProperties.spacing:
        case UIElementProperties.cornerRadius:
        case UIElementProperties.minWidth:
        case UIElementProperties.maxWidth:
        case UIElementProperties.minHeight:
        case UIElementProperties.maxHeight:
        case UIElementProperties.blur:
        case UIElementProperties.opacity:
        case UIElementProperties.zindex:
            return value?.constructor?.name == "CGFloat" || typeof value == "number";
        case UIElementProperties.image: return value?.constructor?.name == "File" || typeof value == "string";
        case UIElementProperties.press: return value?.constructor?.name == "Action" || Array.isArray(value) && value[0]?.constructor?.name == "Action"
        case UIElementProperties.list: return Array.isArray(value) && value[0]?.constructor?.name == "Item"
        case UIElementProperties.view: return value?.constructor?.name == "CVUParsedDefinition" || value.constructor.name === "MemriDictionary"
        case UIElementProperties.arguments: return value.constructor.name === "MemriDictionary"
        case UIElementProperties.location: return value?.constructor?.name == "Location"
        case UIElementProperties.address: return value?.constructor?.name == "Address"
        case UIElementProperties.value: return true
        case UIElementProperties.datasource: return value?.constructor?.name == "Datasource"
        case UIElementProperties.color:
        case UIElementProperties.background:
        case UIElementProperties.rowbackground:
            return value?.constructor?.name == "CVUColor" || typeof value == "string"
        case UIElementProperties.font:
            if (Array.isArray(value)) {
                return value[0]?.constructor?.name == "CGFloat" || typeof value[0] == "number" || (value[0]?.constructor?.name == "CGFloat" || typeof value[0] == "number") && (Object.values(Font.Weight).includes(value[1]))
            } else { return value?.constructor?.name == "CGFloat" || typeof value == "number"}
        case UIElementProperties.padding:
        case UIElementProperties.margin:
            if (Array.isArray(value)) {
                return (value[0]?.constructor?.name == "CGFloat" || typeof value[0] == "number") && (value[1]?.constructor?.name == "CGFloat" || typeof value[1] == "number")
                    && (value[2]?.constructor?.name == "CGFloat" || typeof value[2] == "number") && (value[3]?.constructor?.name == "CGFloat" || typeof value[3] == "number")
            } else {
                return value?.constructor?.name == "CGFloat" || typeof value == "number"
            }
        case UIElementProperties.border:
            if (Array.isArray(value)) {
                return (value[0]?.constructor?.name == "CVUColor" || typeof value[0] == "string") && (value[1]?.constructor?.name == "CGFloat" || typeof value[1] == "number")
            } else { return false }
        case UIElementProperties.shadow:
            if (Array.isArray(value)) {
                return (value[0]?.constructor?.name == "CVUColor" || typeof value[0] == "string") && (value[1]?.constructor?.name == "CGFloat" || typeof value[1] == "number")
                    && (value[2]?.constructor?.name == "CGFloat" || typeof value[2] == "number") && (value[3]?.constructor?.name == "CGFloat" || typeof value[3] == "number")
            } else {
                return false
            }
        case UIElementProperties.offset:
            if (Array.isArray(value)) {
                return (value[0]?.constructor?.name == "CGFloat" || typeof value[0] == "number") && (value[1]?.constructor?.name == "CGFloat" || typeof value[1] == "number")
            } else {
                return false
            }
        default:
            return false
    }
}

export class CVUValidator {
    // Based on keyword when its added to the dict
    knownActions = function () {
        var result = {};
        for (let name in ActionFamily) {
            result[name.toLowerCase()] = name
        }//TODO
        return result
    }();
    // Only when key is this should it parse the properties
    knownUIElements = function () {
        var result = {};
        for (let name in UIElementFamily) {//TODO
            result[name.toLowerCase()] = name
        }
        return result
    }();

    warnings = []
    errors = []

    valueToTruncatedString(value) {
        let str = `${value}`
        if (str.length < 20) { return str }
        return str.substring(0, 17) + "..."
    }

    // Check syntax errors in colors
    validateColor(color) {
        // Note this is only possible inside the parser...
    }

    /// Forces parsing of expression
    validateExpression(expr: Expression) {
        try {expr.validate()}
        catch (error) {
            this.errors.push(error.localizedDescription)//TODO
        }
    }

    // Check that there are no fields that are not known UIElement properties (warn)
    // Check that they have the right type (error)
    // Error if (required fields are missing (e.g. text for Text, image for Image)
    validateUIElement(element: UINode) {
        var validate = (prop, key, value) => {
            if (!validateUIElementProperties(key, value)) {
                this.errors.push(`Invalid property value '${this.valueToTruncatedString(value)}' for '${key}' at element ${element.type}.`)
            }
        }

        for (let [key, value] of Object.entries(element.properties)) {
            let prop = UIElementProperties[key]
            if (prop) {
                validate(prop, key, value)
            } else {
                this.warnings.push(`Unknown property '${key}' for element ${element.type}.`)
            }
        }

        for (let child in element.children) {
            this.validateUIElement(element.children[child])
        }
    }

    // Check that there are no fields that are not known Action properties (warn)
    // Check that they have the right type (error)
    validateAction(action) {
        for (let [key, value] of Object.entries(action.values)) {
            let prop = ActionProperties[key];
            if (prop) {
                if (!validateActionType(key, value)) {
                    this.errors.push(`Invalid property value '${this.valueToTruncatedString(value != null ? value : "null")}' for '${key}' at action ${action.name}.`)//TODO ask Harut
                }
            }
            else {
                this.warnings.push(`Unknown property '${key}' for action ${action.name}.`)
            }
        }
    }

    validateDefinition(definition) {
        var check = (definition, validate) => {
            for (let [key, value] of Object.entries(definition.parsed ?? {})) {
                if (value?.constructor?.name == "Expression") { continue }

                try {
                    /*if (Array.isArray(value)) {
                        value.map(function (el) {
                            if (validate(key, el) == false) {
                                this.errors.push(`Invalid property value '${this.valueToTruncatedString(el)}' for '${key}' at definition ${definition.selector != null ? definition.selector : ""}.`)
                            }
                        }.bind(this))
                    } else {*/
                        if (validate(key, value) == false) {
                            this.errors.push(`Invalid property value '${this.valueToTruncatedString(value)}' for '${key}' at definition ${definition.selector != null ? definition.selector : ""}.`)
                        }
                    //}
                    //TODO
                }
                catch {
                    this.warnings.push(`Unknown property '${key}' for definition ${definition.selector ?? ""}.`)
                }
            }
        }

        if (definition?.constructor?.name == "CVUParsedSessionsDefinition") {
            check(definition, function(key, value) {
                switch (key) {
                    case "currentSessionIndex": return typeof value == "number"
                    case "sessionDefinitions": return  Array.isArray(value) && value[0]?.constructor?.name == "CVUParsedSessionDefinition"
                    default: throw "Unknown"
                }
            })
        }
        else if (definition?.constructor?.name == "CVUParsedSessionDefinition") {
            check(definition, function (key, value) {
                switch (key) {
                    case "name": return typeof value == "string"
                    case "currentViewIndex": return typeof value == "number"
                    case "viewDefinitions": return Array.isArray(value) && value[0]?.constructor?.name == "CVUParsedViewDefinition"
                    case "editMode": case "showFilterPanel": case "showContextPane": return typeof value == "boolean"
                    case "screenshot": return value?.constructor?.name == "File" //TODO ask Harut
                    default: throw "Unknown"
                }
            })
        }
        else if (definition?.constructor?.name == "CVUParsedViewDefinition") {
            check(definition, (key, value) => {
                switch (key) {
                    case "name": case "emptyResultText": case "title": case "subTitle": case "filterText": case
                "activeRenderer": case "defaultRenderer": case "backTitle": case "searchHint": case "searchMatchText":
                    return typeof value == "string"
                    case "userState": return value?.constructor?.name == "CVUParsedObjectDefinition"
                    case "viewArguments": return value?.constructor?.name == "CVUParsedObjectDefinition"
                    case "contextPane":
                        // TODO: Add validation for contextPane
                        return value?.constructor?.name == "CVUParsedObjectDefinition"
                    case "datasourceDefinition":
                        return value?.constructor?.name == "CVUParsedDatasourceDefinition"
                    case "showLabels": return typeof value == "boolean"
                    case "actionButton": case "editActionButton":
                    if (value instanceof Action) { this.validateAction(value) }
                    else { return false }
                    break;
                    case "sortFields":
                        if (Array.isArray(value)) { return typeof value[0] == "string" }
                        else { return typeof value == "string" }
                    case "editButtons": case "filterButtons": case "actionItems": case
                "navigateItems": case "contextButtons":
                    if (Array.isArray(value)) {
                        for (let action of value) {
                            if (action instanceof Action) { this.validateAction(action) }
                            else {
                                this.errors.push(`Expected action definition but found '${this.valueToTruncatedString(action)}' at property '${key}' of ${definition.selector != null ? definition.selector : ""}`)
                            }
                        }
                    }
                    else if (value instanceof Action) { this.validateAction(value) }
                    else { return false }
                    break;
                    case "include":
                        if (Array.isArray(value)) {
                            return typeof value[0] == "string" && typeof value[1].isCVUObject === "function"
                        }
                        else { return typeof value == "string" || typeof value.isCVUObject === "function" }//TODO: in original file there is no such check, but i think this is correct to pass tests
                    case "rendererDefinitions": return Array.isArray(value) && value[0]?.constructor?.name == "CVUParsedRendererDefinition"
                    default: throw "Unknown"
                }
            })
        }
        else if (definition?.constructor?.name == "CVUParsedRendererDefinition") {
            // TODO support all the renderer properties
            // check(definition, (key, value) => {
            //     if (definition.parsed[key] as? [String:Any?])?["children"] != nil
            //         && !definition.parsed["groups"]?.contains(key) .. also need to check the schema of the thing it renders too complex for now {
            //         return false
            //     }
            //     return true
            // })

            let children = definition.parsed && definition.parsed["children"]
            if (Array.isArray(children)) {
                for (let child in children) {
                    if (children[child]?.constructor?.name == "UINode") { this.validateUIElement(children[child]) }
                    else {
                        this.errors.push(`Expected element definition but found '${this.valueToTruncatedString(children[child])}' in ${definition.selector != null ? definition.selector : ""}`)
                    }
                }
            }
        }
        // TODO Color, Style, Language
    }

    debug() {
        if (this.errors.length > 0) {
            console.log("ERRORS:\n" + this.errors.join("\n"))
        }
        if (this.warnings.length > 0) {
            console.log("WARNINGS:\n" + this.warnings.join("\n"))
        }
        else if (this.errors.length == 0) {
            console.log("Nothing to report")
        }
    }

    validate(definitions) {
        this.warnings = []
        this.errors = []

        for (let def in definitions) {
            this.validateDefinition(definitions[def])
        }

        return this.errors.length == 0
    }
}
