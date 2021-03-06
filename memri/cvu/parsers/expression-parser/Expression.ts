//
//  Expression.swift
//  memri-parser
//
//  Created by Ruben Daniels on 5/16/20.
//  Copyright © 2020 Memri. All rights reserved.
//
import {ExprLookupNode, ExprVariableNode, Item, UserState} from "../../../../router";
const {ExprLexer} = require("./ExprLexer");
const {ExprParser} = require("./ExprParser");
import {ExprInterpreter} from "./ExprInterpreter";
import {MemriDictionary} from "../../../../router";
import {DatabaseController, ItemReference} from "../../../../router";

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
            var sequence = Object.assign([], node.sequence)
            let lastProperty = sequence.pop()
            if (lastProperty instanceof ExprVariableNode) {
                let lookupNode = new ExprLookupNode(sequence);
                let lookupValue = this.lookup(lookupNode, null)

                let obj = lookupValue;
                if (obj instanceof UserState) {
                    obj.set(lastProperty.name, !(obj.get(lastProperty.name) ?? false))
                    return
                } else if (obj?.objectSchema) { // TODO - instead of (let obj = lookupValue as? Object) @anijanyan
                    let name = lastProperty.name

                    if (obj.objectSchema.properties[name] != "bool") {
                        throw `'${name}' is not a boolean property`
                    }

                    DatabaseController.write(undefined,function () {
                        obj[name] = !(obj[name] ?? false)
                    })
                    return
                } else if (typeof obj.subscript == "function") {
                    obj.set(lastProperty.name, !(obj.get(lastProperty.name) ?? false))
                    return
                }

            }
        }

        throw "Exception: Unable to toggle expression. Perhaps expression is not a pure lookup?"
    }

    getTypeOfItem(viewArguments) {
        if (!this.parsed) this.parse()

        let node = this.ast
        if (node instanceof ExprLookupNode) {
            var sequence = Object.assign([], node.sequence)
            let lastProperty = sequence.pop()
            if (lastProperty instanceof ExprVariableNode) {
                let lookupNode = new ExprLookupNode(sequence)
                let dataItem = this.lookup(lookupNode, viewArguments)
                if (dataItem) {//TODO: this is completely different in js
                    let propType = dataItem.objectSchema.properties[lastProperty.name]
                    if (propType) {
                        return [propType, dataItem, lastProperty.name]
                    }
                    else {
                        // let propType = PropertyType(rawValue: 7)//TODO
                        if (propType) {
                            // TODO: This requires a local version a browsable schema that describes the types of edges
                            return [propType, dataItem, lastProperty.name]
                        }
                    }

                    return [undefined, dataItem, lastProperty.name]//TODO
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

    execForReturnType(args = null, type?) { //TODO: we will use string type for some cases @mkslanc
        if (!this.parsed) this.parse()
        let value = this.interpreter?.execute(args)

        if (typeof value == "boolean" || type == "Bool") { return ExprInterpreter.evaluateBoolean(value, false) }
        if (Array.isArray(value) && value[0] && typeof value[0] == "number") { return ExprInterpreter.evaluateNumberArray(value) }
        if (typeof value == "number") { return ExprInterpreter.evaluateNumber(value) }
        if (typeof value == "string") { return ExprInterpreter.evaluateString(value) }
        if (value instanceof Date) { return ExprInterpreter.evaluateDateTime(value) }
        if (typeof value == "object") { return value }
    }

    execute(args = null) {
        if (!this.parsed) this.parse()

        return this.interpreter.execute(args)
    }

    static resolve(object?, viewArguments?: ViewArguments, dontResolveItems: boolean = false) { //TODO:
        var dict = object;
        if (dict?.constructor.name === "MemriDictionary") {
            for (let [key, value] of Object.entries(dict)) {
                dict[key] = this.resolve(value, viewArguments, dontResolveItems)
            }
            return dict;
        } else if (Array.isArray(object)) {
            let list = object;
            for (let i = 0; i < list.length; i++) {
                list[i] = this.resolve(list[i], viewArguments, dontResolveItems)
            }
            return list
        } else if (object instanceof Expression) {
            let expr = object;
            let value = expr.execute(viewArguments);
            let item = value;
            if (dontResolveItems && item instanceof Item) {
                return new ItemReference(item);
            } else {
                return value
            }
        } else {
            return object
        }
    }
}