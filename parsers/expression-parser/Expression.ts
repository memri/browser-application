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
import {UserState, ViewArguments} from "../../cvu/views/CascadableDict";
import {ExprInterpreter} from "./ExprInterpreter";
import {DatabaseController} from "../../model/DatabaseController";

export class Expression {
    code: string;
    startInStringMode: boolean;
    lookup;
    execFunc;
    context;

    interpreter?: ExprInterpreter
    parsed = false;
    ast?: ExprNode

    constructor(code, startInStringMode = false, lookup?, execFunc?) {
        this.code = code;
        this.startInStringMode = startInStringMode;
        this.lookup = lookup ?? (() => true); //TODO: hmm?
        this.execFunc = execFunc ?? (() => true);
    }

    toCVUString(depth, tab) {
        let code = this.ast?.toExprString() ?? this.code
        return this.startInStringMode ? `"${code}"` : `{{${code}}}`
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
                    if (obj instanceof UserState) {
                        obj.set(lastProperty.name, !(obj.get(lastProperty.name) ?? false))
                        return
                    } else if (obj instanceof Object) { //TODO: RealmObject maybe? Or another check
                        let name = lastProperty.name

                        if (obj.objectSchema[name]?.type != "boolean") {
                            throw `'${name}' is not a boolean property`
                        }

                        DatabaseController.writeSync (function() {
                            obj[name] = !(typeof obj[name] === "boolean" ?? false)
                        })
                        return
                    }
                    else if (typeof obj.subscript == "function") {
                        obj[lastProperty.name] = !(obj[lastProperty.name] ?? false)
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

    compile(viewArguments) {
        let copy = new Expression(this.code, this.startInStringMode, this.lookup, this.execFunc)

        if (this.parsed && this.ast) {
            copy.interpreter = new ExprInterpreter(this.ast, this.lookup, this.execFunc)
            copy.parsed = true
        }
        else {
            copy.parse()
        }

        copy.ast = copy.interpreter.compile(viewArguments)

        return copy
    }

    parse() {
        let lexer = new ExprLexer(this.code, this.startInStringMode)
        let parser = new ExprParser(lexer.tokenize())

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
        if (typeof value == "boolean") { return ExprInterpreter.evaluateBoolean(value) }
        if (typeof value == "number") { return ExprInterpreter.evaluateNumber(value) }
        if (typeof value == "string") { return ExprInterpreter.evaluateString(value) }
        //TODO: dateTime
        //TODO: this should be quite the same
        return null;
    }

    execute(args = null) {
        if (!this.parsed) this.parse()

        return this.interpreter.execute(args)
    }
}