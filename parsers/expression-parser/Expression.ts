//
//  Expression.swift
//  memri-parser
//
//  Created by Ruben Daniels on 5/16/20.
//  Copyright © 2020 Memri. All rights reserved.
//
const {ExprLookupNode, ExprVariableNode} = require("./ExprNodes");
const {ExprLexer} = require("./ExprLexer");
const {ExprParser} = require("./ExprParser");


class Expression extends CVUToString {
    main;

    interpreter;
    parsed = false;
    ast;

    constructor(code, startInStringMode) {
        this.code = code;
        this.startInStringMode = startInStringMode;
    }

    lookup() {//TODO

    }

    execFunc() {//TODO

    }

    toCVUString(depth, tab) {
        this.startInStringMode ? `\"${this.code}\"` : `{{${this.code}}}`//TODO
    }

    toString() {
        this.toCVUString(0, "    ")
    }

    isTrue() {
        let x =  this.execForReturnType()
        return x != null ? x : false;
    }

    toggleBool() {
        if (!this.parsed) this.parse()
        let node = this.ast
        if (node instanceof ExprLookupNode) {
            var sequence = node.sequence
            let lastProperty = sequence.pop()
            if (lastProperty instanceof ExprVariableNode) {
                let lookupNode = ExprLookupNode(sequence);
                let lookupValue =  this.lookup(lookupNode, ViewArguments())//TODO

                let obj = lookupValue;
                let main = this.main;
                if (obj instanceof Object && main) {
                    // realmWriteIfAvailable(main.realm) {//TODO
                    //     obj[lastProperty.name] =
                    //         !ExprInterpreter.evaluateBoolean(obj[lastProperty.name])
                    // }
                    return
                }
                // TODO FIX: Implement LookUpAble
                else if (obj instanceof Main && main){
                    // realmWriteIfAvailable(main.realm) {//TODO
                    //     obj[lastProperty.name] =
                    //         !ExprInterpreter.evaluateBoolean(obj[lastProperty.name])
                    // }
                    return
                }
                else if (obj instanceof UserState && main){
                    // realmWriteIfAvailable(main.realm) {//TODO
                    //     obj.set(lastProperty.name,
                    //         !ExprInterpreter.evaluateBoolean(obj.get(lastProperty.name)))
                    // }
                    return
                }

            }
        }

        throw "Exception: Unable to toggle expression. Perhaps expression is not a pure lookup?"
    }

    getTypeOfDataItem() {
        if (!this.parsed) this.parse()

        let node = this.ast
        if (node instanceof ExprLookupNode) {
            var sequence = node.sequence
            let lastProperty = sequence.pop()
            if (lastProperty instanceof ExprVariableNode) {
                let lookupNode = ExprLookupNode(sequence)
                let dataItem = this.lookup(lookupNode, ViewArguments())//TODO
                if (dataItem instanceof DataItem) {
                    let property = dataItem.objectSchema[lastProperty.name];
                    if (property) {
                        let propType = property.type
                        return (propType, dataItem, lastProperty.name)//TODO
                    }
                }
            }
        }

        throw "Exception: Unable to fetch type of property referenced in expression. Perhaps expression is not a pure lookup?"
    }

    parse() {
        let lexer = ExprLexer(this.code, this.startInStringMode)
        let parser = ExprParser(lexer.tokenize());
        this.ast = parser.parse()

        // TODO: Error handlign
        if (this.ast) {
            this.interpreter = ExprInterpreter(this.ast, this.lookup, this.execFunc)
            this.parsed = true
        }
        else {
            throw "Exception: unexpected error occurred."
        }
    }

    validate() {
        this.parse()
    }

    execForReturnType(args) {
        if (!this.parsed) this.parse()
        if (args == undefined) args = ViewArguments()//TODO
        let value = this.interpreter && this.interpreter.execute(args)

        // if (value == undefined) { return }//TODO
        // if (value instanceof T) { return value }
        // if (T.self == Bool.self) { return ExprInterpreter.evaluateBoolean(value) as? T }
        // if (T.self == Double.self) { return ExprInterpreter.evaluateNumber(value) as? T }
        // if (T.self == Int.self) { return ExprInterpreter.evaluateNumber(value) as? T }
        // if (T.self == String.self) { return ExprInterpreter.evaluateString(value) as? T }

        return;
    }

    execute(args) {
        if (!this.parsed) this.parse()

        return this.interpreter.execute(args)
    }
}