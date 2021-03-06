//
//  Parser.swift
//
//  Based on work by Matthew Cheok on 15/11/15.
//  Copyright © 2015 Matthew Cheok. All rights reserved.
//  Copyright © 2020 memri. All rights reserved.
//
import {Expression} from "../expression-parser/Expression";
import {CVUToken, CVUOperator} from "./CVULexer";
import {CVUParseErrors} from "./CVUParseErrors";
import {
    CVUParsedStyleDefinition,
    CVUParsedColorDefinition,
    CVUParsedRendererDefinition,
    CVUParsedLanguageDefinition,
    CVUParsedViewDefinition,
    CVUParsedSessionsDefinition,
    CVUParsedDatasourceDefinition,
    CVUParsedSessionDefinition, CVUParsedObjectDefinition

} from "./CVUParsedDefinition"
import {ActionFamily, CVUColor, getActionType} from "../../../../router";
import {UINode, UIElementFamily} from "../../../../router";
import {MemriDictionary} from "../../../../router";

export class CVUParser {
    context: MemriContext;
    tokens;
    index = 0;
    lastToken;

    lookup;
    execFunc;

    constructor(tokens, context?, lookup?, execFunc?) {
        this.context = context;
        this.tokens = tokens;
        this.lookup = lookup;
        this.execFunc = execFunc;
    }

    peekCurrentToken() {
        return this.index >= this.tokens.length
            ? new CVUToken.EOF()//TODO:?
            : this.tokens[this.index]
    }

    popCurrentToken() {
        if (this.index >= this.tokens.length) {
            this.lastToken = new CVUToken.EOF();//TODO:?
            return this.lastToken
        }

        this.lastToken = this.tokens[this.index];
        ++this.index;
        return this.lastToken! // Check for out of bound?
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
            if (dsl.get("sessions") != undefined) {
                dsl = new CVUParsedSessionsDefinition(dsl.selector ?? "", dsl.name,
                    dsl.domain, dsl.parsed)
            } else if (dsl.get("views") != undefined) {
                dsl = new CVUParsedSessionDefinition(dsl.selector ?? "", dsl.name,
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
            throw new CVUParseErrors.ExpectedIdentifier(this.lastToken!);
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

        return new CVUParsedViewDefinition(type, undefined, type, undefined)//TODO:????
    }

    parseNamedIdentifierSelector() {
        // Example: "Some Name" {
        let token = this.popCurrentToken();
        if (token.constructor != CVUToken.NamedIdentifier) {
            throw new CVUParseErrors.UnexpectedToken(this.lastToken);
        }
        let name = token.value;
        return new CVUParsedViewDefinition(`.${name}`, name)
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
            return new CVUParsedViewDefinition(value, undefined, value, undefined)
        }
    }

    parseBracketsSelector(token) {
        let tokenT = token ?? this.popCurrentToken();
        if (tokenT.constructor != CVUToken.BracketOpen) {
            throw new CVUParseErrors.ExpectedCharacter("[", this.lastToken!);
        }
        let typeToken = token ?? this.lastToken!;

        tokenT = this.popCurrentToken();
        if (tokenT.constructor != CVUToken.Identifier) {
            throw new CVUParseErrors.ExpectedIdentifier(this.lastToken!);
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
            throw new CVUParseErrors.ExpectedCharacter("=", this.lastToken!);
        }
        let op = tokenT.value;

        if (CVUOperator.ConditionEquals == op) {
            var name: string;
            tokenT = this.popCurrentToken();
            if (CVUToken.String == tokenT.constructor) {
                name = tokenT.value
            } else if (CVUToken.Identifier == this.lastToken.constructor) {
                name = this.lastToken.value
            } else {
                throw new CVUParseErrors.ExpectedString(this.lastToken!)
            }

            tokenT = this.popCurrentToken();
            if (tokenT.constructor != CVUToken.BracketClose) {
                throw new CVUParseErrors.ExpectedCharacter("]", this.lastToken!);
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
            throw new CVUParseErrors.ExpectedCharacter("=", this.lastToken!)
        }
    }

    createExpression(code, startInStringMode = false) {
        return new Expression(code, startInStringMode,
            this.lookup, this.execFunc)
    }

    parseDict(uiElementName?) {
        var dict = new MemriDictionary();
        var stack = [];

        var lastKey;
        var isArrayMode = false;

        var setPropertyValue = () => {
            if (stack.length > 0) {
                if (!isArrayMode && stack.length == 1) {
                    dict[lastKey!] = stack[0]
                } else if (isArrayMode || stack.length > 0) {
                    dict[lastKey!] = stack
                }

                stack = []
            }
        }

        function addUIElement(type, properties: MemriDictionary) {//TODO:
            var children = dict["children"] || [];
            let subChildren = Object.assign([], properties.children) || [];
            delete properties.children;
            children.push(new UINode(type,
                subChildren,
                properties));
            dict["children"]= children;
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
                    if (stack.length == 0 && lastKey != undefined) {
                        isArrayMode = true
                    } else {
                        setPropertyValue();

                        // SELECTOR - currently not yet implemented: style, color, language
                        // TODO remove code duplication
                        let selector = this.parseBracketsSelector(this.lastToken);
                        if (selector instanceof CVUParsedRendererDefinition) {
                            var value = (Array.isArray(dict["rendererDefinitions"]) && dict["rendererDefinitions"].length > 0 && dict["rendererDefinitions"][0] instanceof CVUParsedRendererDefinition) ? dict["rendererDefinitions"]: [];
                            value.push(selector);
                            dict["rendererDefinitions"] = value;
                            this.parseDefinition(selector);
                            lastKey = null;
                        } else if (selector instanceof CVUParsedSessionDefinition) {
                            var value = (Array.isArray(dict["sessionDefinitions"]) && dict["sessionDefinitions"].length > 0 && dict["sessionDefinitions"][0] instanceof CVUParsedSessionDefinition) ? dict["sessionDefinitions"]: [];
                            value.push(selector);
                            dict["sessionDefinitions"] = value;
                            this.parseDefinition(selector);
                            lastKey = null;
                        } else if (selector instanceof CVUParsedViewDefinition) {
                            var value = (Array.isArray(dict["viewDefinitions"]) && dict["viewDefinitions"].length > 0 && dict["viewDefinitions"][0] instanceof CVUParsedViewDefinition) ? dict["viewDefinitions"]: [];
                            value.push(selector);
                            dict["viewDefinitions"] = value;
                            this.parseDefinition(selector);
                            lastKey = null;
                        } else if (selector instanceof CVUParsedDatasourceDefinition) {
                            dict["datasourceDefinition"] = selector;
                            this.parseDefinition(selector);
                            lastKey = null;
                        } else {
                            // TODO other defininitions
                            console.log("this inline definition is not yet supported");
                        }
                    }
                    break;
                case CVUToken.BracketClose:
                    if (isArrayMode) {
                        if (stack.length == 0) {
                            stack.push([])
                        }

                        setPropertyValue();
                        isArrayMode = false;
                        lastKey = null;
                    } else {
                        throw new CVUParseErrors.UnexpectedToken(this.lastToken!) // We should never get here
                    }
                    break;
                case CVUToken.CurlyBracketOpen:
                    if (!lastKey) {
                        throw new CVUParseErrors.ExpectedIdentifier(this.lastToken!)
                    }
                    let obj = this.parseDict(lastKey);
                    obj.isCVUObject = () => {
                        return true;
                    };
                    stack.push(obj);
                    break;
                case CVUToken.CurlyBracketClose:
                    setPropertyValue();
                    return dict; // DONE
                case CVUToken.Colon:
                    throw new CVUParseErrors.ExpectedKey(this.lastToken!);
                case CVUToken.Expression:
                    stack.push(this.createExpression(v));
                    break;
                case CVUToken.Color:
                    stack.push(CVUColor.hex(v));
                    break;
                case CVUToken.Identifier:
                    if (lastKey == undefined) {
                        let nextToken = this.peekCurrentToken();
                        if (CVUToken.Colon == nextToken.constructor) {
                            this.popCurrentToken();
                            lastKey = v;
                            nextToken = this.peekCurrentToken()
                        }

                        let lvalue = v.toLowerCase();
                        let type = this.knownUIElements[lvalue];
                        if (lastKey == null && type) {
                            var properties = new MemriDictionary();
                            if (CVUToken.CurlyBracketOpen == this.peekCurrentToken().constructor) {
                                this.popCurrentToken();
                                properties = this.parseDict(v);
                            }

                            addUIElement(type, properties);//TODO
                            continue;
                        } else if (lvalue == "userstate" || lvalue == "viewarguments" || lvalue == "contextpane") {
                            var properties = new MemriDictionary();
                            if (CVUToken.CurlyBracketOpen == this.peekCurrentToken().constructor) {
                                this.popCurrentToken();
                                properties = this.parseDict();
                            }
                            stack.push(new CVUParsedObjectDefinition(properties));//TODO:
                        } else if (CVUToken.CurlyBracketOpen == nextToken.constructor) {
                            // Do nothing
                        } else if (lastKey == undefined) {
                            throw new CVUParseErrors.ExpectedKey(this.lastToken!)
                        }

                        lastKey = v;
                    } else {
                        let name = this.knownActions[v.toLowerCase()];
                        if (name) {
                            var options = new MemriDictionary();
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

                            //let argumentsJs = options["arguments"] ? Object.assign({}, options["arguments"]) : {} //TODO:
                            //delete options["arguments"];
                            let actionFamily = ActionFamily[name];
                            if (actionFamily) {
                                //TODO:
                                 let ActionType = getActionType(actionFamily);//TODO:
                                 stack.push(new ActionType(this.context, options));//[this.context, arguments, options]
                                //stack.push(actionFamily)
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
                    lastKey = null;
                    break;
                case CVUToken.Nil:
                    let x = null;
                    stack.push(x);
                    break;
                case CVUToken.Number:
                    stack.push(Number(v));
                    break;
                case CVUToken.String:
                    if (!isArrayMode && CVUToken.Colon == this.peekCurrentToken().constructor) {

                        setPropertyValue(); // TODO: Is this every necessary?
                        this.popCurrentToken();
                        lastKey = v;
                    } else if (lastKey == undefined) {
                        lastKey = v
                    } else {
                        stack.push(v)
                    }
                    break;
                case CVUToken.StringExpression:
                    stack.push(this.createExpression(v, true));
                    break;
                default:
                    throw new CVUParseErrors.UnexpectedToken(this.lastToken!)
            }
        }
    }

    parseDefinition(selector) {
        while (true) {
            if (CVUToken.Newline == this.peekCurrentToken().constructor) {
                this.popCurrentToken()
            } else {
                if (CVUToken.CurlyBracketOpen != this.popCurrentToken().constructor) {
                    throw new CVUParseErrors.ExpectedCharacter("{", this.lastToken!);
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

}
