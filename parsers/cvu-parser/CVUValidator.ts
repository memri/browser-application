//
//  CVUValidator.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

/*
 TODO:
    - datasource (cascading, etc)
    - case insensitive fields for definition
    - include
    - when looking for an array but there is only one element, wrap it in an array (while cascading)
        - or when a known field do this during parsing
    - support for array of actions in a single trigger (e.g. press)
*/


// TODO REFACTOR: Move to parser
//    function validate() {
//        if self.rendererName == "" { throw("Property 'rendererName' is not defined in this view") }
//
//        let renderProps = self.renderConfigs.objectSchema.properties
//        if (renderProps.filter(){ (property) in property.name == self.rendererName }).count == 0 {
////            throw("Missing renderConfig for \(self.rendererName) in this view")
//            print("Warn: Missing renderConfig for \(self.rendererName) in this view")
//        }
//
//        if self.datasource.query == "" { throw("No query is defined for this view") }
//        if (self.actionButton == nil && self.editActionButton == nil) {
//            print("Warn: Missing action button in this view")
//        }
//    }

import {Action, ActionFamily, ActionProperties, validateActionType} from "../../cvu/views/Action";
import {UIElement, UIElementFamily, UIElementProperties, validateUIElementProperties} from "../../cvu/views/UIElement";
import {Expression} from "../expression-parser/Expression";
import {
    CVUParsedDatasourceDefinition, CVUParsedRendererDefinition,
    CVUParsedSessionDefinition,
    CVUParsedSessionsDefinition,
    CVUParsedViewDefinition
} from "./CVUParsedDefinition";
import {UserState, ViewArguments} from "../../cvu/views/UserState";

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
    validateUIElement(element: UIElement) {
        var validate = (prop, key, value) => {
            if (!validateUIElementProperties(key, value)) {
                this.errors.push(`Invalid property value '${this.valueToTruncatedString(value)}' for '${key}' at element ${element.type}.`)
            }
        }

        for (let [key, value] of Object.entries(element.properties)) {
            let prop = UIElementProperties[key]
            if (prop) {
                if (key == "frame") {
                    let list = value
                    if (Array.isArray(list)) {
                        if (list[0]) { validate(prop, "minWidth", list[0]) }
                        if (list[1]) { validate(prop, "maxWidth", list[1]) }
                        if (list[2]) { validate(prop, "minHeight", list[2]) }
                        if (list[3]) { validate(prop, "maxHeight", list[3]) }
                        if (list[4]) { validate(prop, "align", list[4]) }
                        continue
                    }
                }
                else if (key == "cornerborder") {
                    let list = value
                    if (Array.isArray(list)) {
                        validate(prop, "border", [list[0], list[1]])
                        validate(prop, "cornerRadius", list[2])
                        continue
                    }
                }
                else {
                    /*if (Array.isArray(value)) {
                        value.map(function(el) {
                            validate(prop, key, el)
                        });
                    } else {*/ //TODO:
                        validate(prop, key, value)
                    //}

                    continue
                }
            }

            this.warnings.push(`Unknown property '${key}' for element ${element.type}.`)
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
            for (let [key, value] of Object.entries(definition.parsed)) {
                if (value instanceof Expression) { continue }

                try {
                    if (Array.isArray(value)) {
                        value.map(function (el) {
                            if (validate(key, el) == false) {
                                this.errors.push(`Invalid property value '${this.valueToTruncatedString(el)}' for '${key}' at definition ${definition.selector != null ? definition.selector : ""}.`)
                            }
                        }.bind(this))
                    } else {
                        if (validate(key, value) == false) {
                            this.errors.push(`Invalid property value '${this.valueToTruncatedString(value)}' for '${key}' at definition ${definition.selector != null ? definition.selector : ""}.`)
                        }
                    }
                    //TODO
                }
                catch {
                    this.warnings.push(`Unknown property '${key}' for definition ${definition.selector ?? ""}.`)
                }
            }
        }

        if (definition instanceof CVUParsedSessionsDefinition) {
            check(definition, function(key, value) {
                switch (key) {
                    case "currentSessionIndex": return typeof value == "number"
                    case "sessionDefinitions": return  Array.isArray(value) && value[0] instanceof CVUParsedSessionDefinition
                    default: throw "Unknown"
                }
            })
        }
        else if (definition instanceof CVUParsedSessionDefinition) {
            check(definition, function (key, value) {
                switch (key) {
                    case "name": return typeof value == "string"
                    case "currentViewIndex": return typeof value == "number"
                    case "viewDefinitions": return Array.isArray(value) && value[0] instanceof CVUParsedViewDefinition
                    case "editMode": case "showFilterPanel": case "showContextPane": return typeof value == "boolean"
                    case "screenshot": return value instanceof File //TODO ask Harut
                    default: throw "Unknown"
                }
            })
        }
        else if (definition instanceof CVUParsedViewDefinition) {
            check(definition, (key, value) => {
                switch (key) {
                    case "name": case "emptyResultText": case "title": case "subTitle": case "filterText": case
                "activeRenderer": case "defaultRenderer": case "backTitle": case "searchHint":
                    return typeof value == "string"
                    case "userState": return value instanceof UserState
                    case "datasourceDefinition":
                    case "datasource": //TODO: in original file there is no such key, but i think this is correct
                        return value instanceof CVUParsedDatasourceDefinition
                    case "viewArguments": return value instanceof ViewArguments
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
                        for (let action in value) {
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
                            return typeof value[0] == "string" && Array.isArray(value[1]) && typeof value[1][0].isCVUObject === "function"
                        }
                        else { return typeof value == "string" || typeof value.isCVUObject === "function" }//TODO: in original file there is no such check, but i think this is correct to pass tests
                    case "renderDefinitions": return Array.isArray(value) && value[0] instanceof CVUParsedRendererDefinition
                    default: throw "Unknown"
                }
            })
        }
        else if (definition instanceof CVUParsedRendererDefinition) {
            // TODO support all the renderer properties
            // check(definition, (key, value) => {
            //     if (definition.parsed[key] as? [String:Any?])?["children"] != nil
            //         && !definition.parsed["groups"]?.contains(key) .. also need to check the schema of the thing it renders too complex for now {
            //         return false
            //     }
            //     return true
            // })

            let children = definition.parsed["children"]
            if (Array.isArray(children)) {
                for (let child in children) {
                    if (children[child] instanceof UIElement) { this.validateUIElement(children[child]) }
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
