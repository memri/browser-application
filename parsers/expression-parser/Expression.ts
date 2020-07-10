//
//  Expression.swift
//  memri-parser
//
//  Created by Ruben Daniels on 5/16/20.
//  Copyright © 2020 Memri. All rights reserved.
//
import {ExprLookupNode, ExprVariableNode} from "./ExprNodes";
const {ExprLexer} = require("./ExprLexer");
const {ExprParser} = require("./ExprParser");
import {UserState, ViewArguments} from "../../cvu/views/UserState";
import {ExprInterpreter} from "./ExprInterpreter";

export class Expression {
    code: string;
    startInStringMode: boolean;
    lookup;
    execFunc;
    context;

    interpreter;
    parsed = false;
    ast;

    constructor(code, startInStringMode = false, lookup?, execFunc?) {
        this.code = code;
        this.startInStringMode = startInStringMode;
        this.lookup = lookup;
        this.execFunc = execFunc
    }

    toCVUString(depth, tab) {
        return this.startInStringMode ? `"${this.code}"` : `{{${this.code}}}`
    }

    toString() {
        return this.toCVUString(0, "    ")
    }

    isTrue() {
        let x =  this.execForReturnType()
        return x ?? false;
    }

    toggleBool() {
        if (!this.parsed) this.parse()
        let node = this.ast
        if (node instanceof ExprLookupNode) {
            var sequence = node.sequence
            let lastProperty = sequence.pop()
            if (lastProperty instanceof ExprVariableNode) {
                let lookupNode = new ExprLookupNode(sequence);
                let lookupValue =  this.lookup(lookupNode, null)


                let context = this.context;
                if (context) {
                    let obj = lookupValue;
                    if (obj instanceof UserState && context) {
                        // realmWriteIfAvailable(context.realm) {//TODO
                        //     obj[lastProperty.name] =
                        //         !ExprInterpreter.evaluateBoolean(obj[lastProperty.name])
                        // }
                        return
                    } else if (obj instanceof Object && context) {
                        /* realmWriteIfAvailable(context.realm) {
                         obj[lastProperty.name] =
                             !ExprInterpreter.evaluateBoolean(obj[lastProperty.name])
                     }*/
                        return
                    }
                    // TODO FIX: Implement LookUpAble
                    else if (obj instanceof MemriContext && context) {
                        // realmWriteIfAvailable(context.realm) {//TODO
                        //     obj[lastProperty.name] =
                        //         !ExprInterpreter.evaluateBoolean(obj[lastProperty.name])
                        // }
                        return
                    } else if (obj instanceof UserState && context) {
                        // realmWriteIfAvailable(context.realm) {//TODO
                        //     obj.set(lastProperty.name,
                        //         !ExprInterpreter.evaluateBoolean(obj.get(lastProperty.name)))
                        // }
                        return
                    }

                }
            }
        }

        throw "Exception: Unable to toggle expression. Perhaps expression is not a pure lookup?"
    }

    getTypeOfItem(viewArguments) {
        if (!this.parsed) this.parse()

        let node = this.ast
        if (node instanceof ExprLookupNode) {
            var sequence = node.sequence
            let lastProperty = sequence.pop()
            if (lastProperty instanceof ExprVariableNode) {
                let lookupNode = new ExprLookupNode(sequence)
                let dataItem = this.lookup(lookupNode, viewArguments)//TODO
                if (dataItem instanceof DataItem) {
                    let propType = dataItem.objectSchema[lastProperty.name]?.type;
                    if (propType) {
                        let propType = property.type
                        return (propType, dataItem, lastProperty.name)//TODO
                    } else  {
                        let propType = PropertyType(7)
                        if (propType) {
                            //warning("This requires a local version a browsable schema that describes the types of edges")
                            //                        if let item = dataItem.edge(lastProperty.name)?.item() {
                            return (propType, dataItem, lastProperty.name)
                            //
                        }
                    }
                }
            }
        }

        throw "Exception: Unable to fetch type of property referenced in expression. Perhaps expression is not a pure lookup?"
    }

    parse() {
        let lexer = new ExprLexer(this.code, this.startInStringMode)
        let parser = new ExprParser(lexer.tokenize());
        this.ast = parser.parse()

        // TODO: Error handlign
        if (this.ast) {
            this.interpreter = new ExprInterpreter(this.ast, this.lookup, this.execFunc)
            this.parsed = true
        }
        else {
            throw "Exception: unexpected error occurred."
        }
    }

    validate() {
        this.parse()
    }

    execForReturnType(args = null) {
        if (!this.parsed) this.parse()
        let value = this.interpreter?.execute(args)

        if (value == null) { return null}
        if (typeof value == "object") { return value }
        if (typeof value == "boolean") { return new ExprInterpreter(undefined, undefined, undefined).evaluateBoolean(value) }
        if (typeof value == "number") { return new ExprInterpreter(undefined, undefined, undefined).evaluateNumber(value) }
        if (typeof value == "string") { return new ExprInterpreter(undefined, undefined, undefined).evaluateString(value) }
        //TODO: this should be quite the same
        return null;
    }

    execute(args = null) {
        if (!this.parsed) this.parse()

        return this.interpreter.execute(args)
    }
}