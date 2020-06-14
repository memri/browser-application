//
//  Parser.swift
//
//  Based on work by Matthew Cheok on 15/11/15.
//  Copyright © 2015 Matthew Cheok. All rights reserved.
//  Copyright © 2020 memri. All rights reserved.
//
import {CVUToken, CVUOperator} from "./CVULexer";
import {CVUParseErrors} from "./CVUParseErrors"
import {
    CVUParsedStyleDefinition,
    CVUParsedColorDefinition,
    CVUParsedRendererDefinition,
    CVUParsedLanguageDefinition,
    CVUParsedViewDefinition,
    
} from "./CVUParsedDefinition"

class ActionFamily {
    static allCases = "back, addDataItem, openView, openDynamicView, openViewByName, toggleEditMode, toggleFilterPanel, star, showStarred, showContextPane, showOverlay, share, showNavigation, addToPanel, duplicate, schedule, addToList, duplicateNote, noteTimeline, starredNotes, allNotes, exampleUnpack, delete, setRenderer, select, selectAll, unselectAll, showAddLabel, openLabelView, showSessionSwitcher, forward, forwardToFront, backAsSession, openSession, openSessionByName, addSelectionToList, closePopup, noop".split(/,\s*/)
}
class UIElementFamily {
    static allCases = "VStack, HStack, ZStack, EditorSection, EditorRow, EditorLabel, Title, Button, FlowStack, Text, Textfield, ItemCell, SubView, Map, Picker, SecureField, Action, MemriButton, Image, Circle, HorizontalLine, Rectangle, RoundedRectangle, Spacer, Divider, Empty".split(/,\s*/)
}

class Color {
    constructor(value) {
        this.value = value;
    }
}


function CGFloat(num) {
    return num;
}

enum VerticalAlignment{
    center,
    
}
enum HorizontalAlignment{
    center,
    
}
enum Alignment{
    center,
}
enum TextAlignment{
    center,
}

export class CVUParser {

    index = 0;
    lastToken;

    /*lookup: (ExprLookupNode, ViewArguments)
        let execFunc: (ExprLookupNode, [Any], ViewArguments)*/

    constructor(tokens, main, lookup, execFunc) {
        this.main = main;
        this.tokens = tokens;
        this.lookup = lookup;
        this.execFunc = execFunc;
    }

    peekCurrentToken() {
        return this.index >= this.tokens.length
            ? new CVUToken.EOF()
            : this.tokens[this.index]
    }

    popCurrentToken() {
        if (this.index >= this.tokens.length) {
            this.lastToken = CVUToken.EOF;
            return CVUToken.EOF
        }

        this.lastToken = this.tokens[this.index];
        ++this.index;
        return this.lastToken // Check for out of bound?
    }

    parse() {
        this.index = 0;
        var result = [];

        while (true) {
            let token = this.peekCurrentToken();
            if (CVUToken.EOF == token.constructor) {
                return result
            }
            token = this.peekCurrentToken();
            if (CVUToken.Newline == token.constructor) {
                this.popCurrentToken();
                continue
            }

            var dsl = this.parseViewDSL();
            let dslSelector = dsl.selector;
            if (dsl["sessions"]) {//TODO:
                dsl = new CVUParsedSessionsDefinition(dslSelector ? dslSelector : "", dsl.name,
                    dsl.domain, dsl.parsed)
            } else if (dsl["views"]) {
                dsl = new CVUParsedSessionDefinition(dslSelector ? dslSelector : "", dsl.name,
                    dsl.domain, dsl.parsed)
            }

            result.push(dsl);
        }
    }

    parseViewDSL() {
        let node = this.parsePrimary();
        let token = this.peekCurrentToken();
        if (CVUToken.Colon == token.constructor) {
            this.popCurrentToken();
        }

        return this.parseDefinition(node);
    }

    parsePrimary(skipOperator = false) {
        switch (this.peekCurrentToken().constructor) {
            case CVUToken.Identifier:
                return this.parseIdentifierSelector();
            case CVUToken.NamedIdentifier:
                return this.parseNamedIdentifierSelector();
            case CVUToken.BracketOpen:
                return this.parseBracketsSelector();
            case CVUToken.String:
                return this.parseStringSelector();
            default:
                throw new CVUParseErrors.ExpectedDefinition(this.popCurrentToken())
        }
    }

    parseIdentifierSelector() {
        // Example: Person {
        let token = this.popCurrentToken();
        if (token.constructor != CVUToken.Identifier) {
            throw new CVUParseErrors.ExpectedIdentifier(this.lastToken);
        }
        let type = token.value;

        // Example: Person[name = 'john']
        token = this.peekCurrentToken();
        if (token.constructor == CVUToken.BracketOpen) {
            this.popCurrentToken();
            token = this.peekCurrentToken();
            if (token.constructor == CVUToken.BracketClose) {
                this.popCurrentToken();
                type += "[]"
            } else {
                // TODO
            }
        }

        return new CVUParsedViewDefinition(type, type)//TODO:????
    }

    parseNamedIdentifierSelector() {
        // Example: "Some Name" {
        let token = this.popCurrentToken();
        if (token.constructor != CVUToken.NamedIdentifier) {
            throw new CVUParseErrors.UnexpectedToken(this.lastToken);
        }
        let name = token.value;
        return new CVUParsedViewDefinition(`.{name}`, name)
    }

// For JSON support
    parseStringSelector() {
        let token = this.popCurrentToken();
        if (token.constructor != CVUToken.String) {
            throw new CVUParseErrors.UnexpectedToken(this.lastToken);
        }
        let value = token.value;

        if (value[0] == ".") {
                return new CVUParsedViewDefinition(value, value.substr(0,1)) //TODO:String??
        } else if (value[0] == "[") {
            throw "Not supported yet" // TODO
        } else {
            return new CVUParsedViewDefinition(value, value)
        }
    }

    parseBracketsSelector(token) {
        let tokenT = (token) ? token : this.popCurrentToken();
        if (tokenT.constructor != CVUToken.BracketOpen) {
            throw new CVUParseErrors.ExpectedCharacter("[", this.lastToken);
        }
        let typeToken = (token) ? token : this.lastToken;

        tokenT = this.popCurrentToken();
        if (tokenT.constructor != CVUToken.Identifier) {
            throw new CVUParseErrors.ExpectedIdentifier(this.lastToken);
        }
        let type = tokenT.value;
        // TODO Only allow inside other definition
        tokenT = this.peekCurrentToken();
        if (["session", "view"].includes(type) && CVUToken.BracketClose == tokenT.constructor) {
            this.popCurrentToken();
            switch (type) {
                case "session":
                    return new CVUParsedSessionDefinition("[session]");
                case "view":
                    return new CVUParsedViewDefinition("[view]");
                /*default: _ = 1 */// Can never get here
            }
        }
        tokenT = this.popCurrentToken();
        if (tokenT.constructor != CVUToken.Operator) {
            throw CVUParseErrors.ExpectedCharacter("=", this.lastToken);
        }
        let op = tokenT.value;

        if (CVUOperator.ConditionEquals == op) {
            var name;
            tokenT = this.popCurrentToken();
            if (CVUToken.String == tokenT.constructor) {
                name = tokenT.value
            } else if (CVUToken.Identifier == this.lastToken.constructor) {
                name = this.lastToken.value
            } else {
                throw new CVUParseErrors.ExpectedString(this.lastToken)
            }

            tokenT = this.popCurrentToken();
            if (tokenT.constructor != CVUToken.BracketClose) {
                throw CVUParseErrors.ExpectedCharacter("]", this.lastToken);
            }

            switch (type) {
                case "sessions":
                    return new CVUParsedSessionsDefinition(`[sessions = ${name}]`, name);
                case "session":
                    return new CVUParsedSessionDefinition(`[session = ${name}]`, name);
                case "view":
                    return new CVUParsedViewDefinition(`[view = ${name}]`, name);
                case "style":
                    return new CVUParsedStyleDefinition(`[style = ${name}]`, name);
                case "datasource":
                    return new CVUParsedDatasourceDefinition(`[datasource = ${name}]`, name);
                case "color":
                    return new CVUParsedColorDefinition(`[color = ${name}]`, name);
                case "renderer":
                    return new CVUParsedRendererDefinition(`[renderer = ${name}]`, name);
                case "language":
                    return new CVUParsedLanguageDefinition(`[language = ${name}]`, name);
                default:
                    throw new CVUParseErrors.UnknownDefinition(typeToken)
            }
        } else {
            throw new CVUParseErrors.ExpectedCharacter("=", this.lastToken)
        }
    }

    createExpression(code, startInStringMode = false) {
        return {code, startInStringMode}
        return Expression(code, startInStringMode,
            this.lookup, this.execFunc)
    }

    parseDict(uiElementName) {
        var dict = {};
        var stack = [];
        let uiElementNameKey = (uiElementName) ? uiElementName.toLowerCase() : "";
        let forUIElement = this.knownUIElements[uiElementNameKey] != undefined;//TODO:
        var lastKey;
        var isArrayMode = false;

        var setPropertyValue = () => {
            if (stack.length > 0) {
                let convert = this.specialTypedProperties[lastKey];
                if (forUIElement && convert) {
                    if (!isArrayMode && stack.length == 1) {
                        dict[lastKey] = convert(stack[0], uiElementName);
                    } else if (isArrayMode || stack.length > 0) {
                        dict[lastKey] = convert(stack, uiElementName);
                    }
                } else {
                    if (!isArrayMode && stack.length == 1) {
                        dict[lastKey] = stack[0]
                    } else if (isArrayMode || stack.length > 0) {
                        dict[lastKey] = stack
                    }
                }

                stack = []
            }
        }

        function addUIElement(type, properties) {//TODO:
            var children = (Array.isArray(dict["children"]) && dict["children"].length > 0) ? dict["children"] : [];//TODO
            // let subChildren = properties.removeValue("children");//TODO
            // children.push(UIElement(type,
                // (subChildren instanceof [UIElement]) ? subChildren: [],
                // properties));
                children.push(properties)
            dict["children"] = children
        }

        while (true) {
//            print(peekCurrentToken())
            let token = this.popCurrentToken();
            let v = token.value;
            switch (token.constructor) {
                case CVUToken.Bool:
                    stack.push(v);
                    break;
                case CVUToken.BracketOpen:
                    if (stack.length == 0 && lastKey) {
                        isArrayMode = true
                    } else {
                        setPropertyValue();

                        // SELECTOR - currently not yet implemented: style, color, language
                        // TODO remove code duplication
                        let selector = this.parseBracketsSelector(this.lastToken);
                        if (selector instanceof CVUParsedRendererDefinition) {
                            var value = (dict["renderDefinitions"] && dict["renderDefinitions"] instanceof [CVUParsedRendererDefinition]) ? dict["renderDefinitions"] : [];
                            value.push(selector);
                            dict["renderDefinitions"] = value;
                            this.parseDefinition(selector);
                            lastKey = undefined;
                        } else if (selector instanceof CVUParsedSessionDefinition) {
                            var value = (dict["sessionDefinitions"] && dict["sessionDefinitions"] instanceof [CVUParsedSessionDefinition]) ? dict["sessionDefinitions"] : [];
                            value.push(selector);
                            dict["sessionDefinitions"] = value;
                            this.parseDefinition(selector);
                            lastKey = undefined;
                        } else if (selector instanceof CVUParsedViewDefinition) {
                            var value = (dict["viewDefinitions"] && dict["viewDefinitions"] instanceof [CVUParsedViewDefinition]) ? dict["viewDefinitions"] : [];
                            value.push(selector);
                            dict["viewDefinitions"] = value;
                            this.parseDefinition(selector);
                            lastKey = undefined;
                        } else if (selector instanceof CVUParsedDatasourceDefinition) {
                            dict["datasourceDefinition"] = selector;
                            this.parseDefinition(selector);
                            lastKey = undefined;
                        } else {
                            // TODO other defininitions
                            console.log("this inline definition is not yet supported");
                        }
                    }
                    break;
                case CVUToken.BracketClose:
                    if (isArrayMode) {
                        setPropertyValue();
                        isArrayMode = false;
                        lastKey = undefined;
                    } else {
                        throw new CVUParseErrors.UnexpectedToken(this.lastToken) // We should never get here
                    }
                    break;
                case CVUToken.CurlyBracketOpen:
                    stack.push(this.parseDict(lastKey));
                    break;
                case CVUToken.CurlyBracketClose:
                    setPropertyValue();
                    if (forUIElement) {
                        this.processCompoundProperties(dict)
                    }//TODO: &?
                    return dict; // DONE
                case CVUToken.Colon:
                    throw new CVUParseErrors.ExpectedKey(this.lastToken);
                case CVUToken.Expression:
                    stack.push(this.createExpression(v));
                    break;
                case CVUToken.Color :
                    stack.push(new Color(v));
                    break;
                case CVUToken.Identifier:
                    if (!lastKey) {
                        let nextToken = this.peekCurrentToken();
                        if (CVUToken.Colon == nextToken.constructor) {
                            this.popCurrentToken();
                            lastKey = v;
                        } else {
                            let type = this.knownUIElements[v.toLowerCase()];
                            if (type) {
                                var properties = {};
                                if (CVUToken.CurlyBracketOpen == this.peekCurrentToken().constructor) {
                                    this.popCurrentToken();
                                    properties = this.parseDict(v);
                                }

                                addUIElement(type, properties);//TODO
                                continue;
                            } else if (v.toLowerCase() == "datasource") {

                            } else if (CVUToken.CurlyBracketOpen = nextToken.constructor) {
                            } else {
                                throw new CVUParseErrors.ExpectedKey(this.lastToken);
                            }
                        }

                        lastKey = v;
                    } else {
                        let name = this.knownActions[v.toLowerCase()];
                        if (name) {
                            var options = {};
                            outerLoop: while (true) {
                                switch (this.peekCurrentToken().constructor) {
                                    case CVUToken.Comma:
                                        if (isArrayMode) {
                                            this.popCurrentToken()
                                        }
                                        break;
                                    case CVUToken.CurlyBracketOpen:
                                        this.popCurrentToken();
                                        options = this.parseDict();
                                        break;
                                    default:
                                        break outerLoop;
                                }
                            }

                            //let arguments = options.removeValue("arguments") instanceOf [String:Any] ?? [:]//TODO:
                            let actionFamily = new ActionFamily(name);
                            if (actionFamily) {
                                //TODO:
                                // let ActionType = ActionFamily.getType(actionFamily)();//TODO:
                                // stack.push(ActionType.init(main, arguments, options));
                                stack.push([main, arguments, options])
                            } else {
                                // TODO ERROR REPORTING
                            }
                        } else {
                            stack.push(v)
                        }
                    }
                    break;
                case CVUToken.Newline:
                    if (stack.length == 0) {
                        continue
                    }
                case CVUToken.Comma:
                    if (isArrayMode) {
                        continue
                    } // IGNORE
                case CVUToken.SemiColon:
                    setPropertyValue();
                    lastKey = undefined;
                    break;
                case CVUToken.Nil://TODO
                    let x;
                    stack.push(x);
                    break;
                case CVUToken.Number:
                    stack.push(forUIElement ? CGFloat(v) : v);//TODO????
                    break;
                case CVUToken.String:
                    if (!isArrayMode && CVUToken.Colon == this.peekCurrentToken().constructor) {

                        setPropertyValue(); // TODO: Is this every necessary?
                        this.popCurrentToken();
                        lastKey = v;
                    } else if (!lastKey) {
                        lastKey = v
                    } else {
                        stack.push(v)
                    }
                    break;
                case CVUToken.StringExpression:
                    stack.push(this.createExpression(v, true));
                    break;
                default:
                    throw CVUParseErrors.UnexpectedToken(this.lastToken)
            }
        }
    }

    parseDefinition(selector) {
        while (true) {
            if (CVUToken.Newline == this.peekCurrentToken().constructor) {
                this.popCurrentToken()
            } else {
                if (CVUToken.CurlyBracketOpen != this.popCurrentToken().constructor) {
                    throw CVUParseErrors.ExpectedCharacter("{", this.lastToken);
                }
                break;
            }
        }

        selector.parsed = this.parseDict();
        return selector;
    }

//    function parseConditionOp(conditionNode) {
//        let trueExp =  parseViewession()
//
//        guard case let ViewToken.Operator(op, _) = popCurrentToken() else {
//            throw ViewParseErrors.ExpectedConditionElse
//        }
//
//        if (op != .ConditionElse) {
//            throw ViewParseErrors.ExpectedConditionElse
//        }
//
//        let falseExp =  parseViewession()
//
//        return ViewConditionNode(condition: conditionNode, trueExp: trueExp, falseExp: falseExp)
//    }

// Based on keyword when its added to the dict
    knownActions = function () {
        var result = {};
        for (let name of ActionFamily.allCases) {
            result[name.toLowerCase()] = name
        }//TODO
        return result
    }();
// Only when key is this should it parse the properties
    knownUIElements = function () {
        var result = {};
        for (let name of UIElementFamily.allCases) {//TODO
            result[name.toLowerCase()] = name
        }
        return result
    }();

// Same as above to be converted once per dict
    frameProperties = {"minWidth": 1, "maxWidth": 1, "minHeight": 1, "maxHeight": 1, "align": 1};
// Based on key when its added to the dict (only needed within rendererDefinition / UIElement)
    specialTypedProperties = {
        "alignment":
            function (value, type) {
                switch (value) {
                    case "left":
                        return HorizontalAlignment.leading;
                    case "top":
                        return VerticalAlignment.top;
                    case "right":
                        return HorizontalAlignment.trailing;
                    case "bottom":
                        return VerticalAlignment.bottom;
                    case "center":
                        if (type == "zstack") {
                            return Alignment.center;
                        }
                        return type == "vstack"
                            ? HorizontalAlignment.center
                            : VerticalAlignment.center;
                    default:
                        return value // TODO Test if (this crashes the view renderer
                }
            },
        "align": function (value, type) {
            switch (value) {
                case "left":
                    return Alignment.leading;
                case "top":
                    return Alignment.top;
                case "right":
                    return Alignment.trailing;
                case "bottom":
                    return Alignment.bottom;
                case "center":
                    return Alignment.center;
                case "lefttop":
                case "topleft":
                    return Alignment.topLeading;
                case "righttop":
                case "topright":
                    return Alignment.topTrailing;
                case "leftbottom":
                case "bottomleft":
                    return Alignment.bottomLeading;
                case "rightbottom":
                case "bottomright":
                    return Alignment.bottomTrailing;
                default:
                    return value // TODO Test if (this crashes the view renderer
            }
        },
        "textalign": function (value, type) {
            switch (value) {
                case "left":
                    return TextAlignment.leading;
                case "center":
                    return TextAlignment.center;
                case "right":
                    return TextAlignment.trailing;
                default:
                    return value // TODO Test if (this crashes the view renderer
            }
        },
        "font": function (input, type) {
            var value = input;
            if (value instanceof Array) {
                if (value[0] instanceof CGFloat) {
                    if (value.length == 1) {
                        value.push(Font.Weight.regular)
                    } else {
                        switch (value[1]) {
                            case "regular":
                                value[1] = Font.Weight.regular;
                                break;
                            case "bold":
                                value[1] = Font.Weight.bold;
                                break;
                            case "semibold":
                                value[1] = Font.Weight.semibold;
                                break;
                            case "heavy":
                                value[1] = Font.Weight.heavy;
                                break;
                            case "light":
                                value[1] = Font.Weight.light;
                                break;
                            case "ultralight":
                                value[1] = Font.Weight.ultraLight;
                                break;
                            case "black":
                                value[1] = Font.Weight.black;
                                break;
                            default:
                                // TODO Warn user
                                value[1] = Font.Weight.regular
                        }
                    }
                }
                return value
            }
            // TODO Warn user
            return input
        }
    };

    processCompoundProperties(dict) {
        for (let name in this.frameProperties) {
            if (dict[name]) {

                let values = [
                    dict["minWidth"],
                    dict["maxWidth"],
                    dict["minHeight"],
                    dict["maxHeight"],
                    dict["align"]
                ];

                dict["minWidth"] = undefined;
                dict["maxWidth"] = undefined;
                dict["minHeight"] = undefined;
                dict["maxHeight"] = undefined;
                dict["align"] = undefined;

                dict["frame"] = values;
                break;
            }
        }

        if (dict["cornerRadius"] && dict["border"]) {
            var value = (dict["border"] instanceof Array) ? dict["border"] : [];
            value.push(dict["cornerRadius"] ? dict["cornerRadius"] : 0);

            dict["cornerborder"] = value;
            dict["border"] = undefined;
        }
    }
}
