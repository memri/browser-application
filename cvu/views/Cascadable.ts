//
//  Cascadable.swift
//  memri
//
//  Created by Ruben Daniels on 5/24/20.
//  Copyright © 2020 memri. All rights reserved.
//

/*
import {ActionMultiAction} from "./Action";
import {debugHistory} from "./ViewDebugger";
import {CVUParsedDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";*/
import {Expression} from "../../parsers/expression-parser/Expression";
import {CVUParsedDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";

export class Cascadable {
    host?: Cascadable
    cascadeStack: []
    tail: CVUParsedDefinition[]
    head: CVUParsedDefinition
    localCache = {}

    get viewArguments() { return this.host?.viewArguments }
    set viewArguments(value) { this.host?.viewArguments = value }

    /*get description() {
        var merged = {}

        function recur(dict: {}) {
            if (!dict) { return }

            for (let [key, value] of Object.entries(dict)) {
                merged[key] = value
            }
        }
        recur(this.head.parsed)
        for (var item of this.tail) { recur(item.parsed) }

        return CVUSerializer.dictToString(merged, 0, "    ")
    }*/
    
    execExpression(expr) {
        try {
            let x = expr.execute(this.viewArguments)
            let value = this.transformActionArray(x)
            if (value == null) { return undefined }
            else { return value }
        }
        catch (error) {
            debugHistory.error(`${error}`)
            return undefined
        }
    }
    
    transformActionArray(value) {
        var result = []
        if (Array.isArray(value)) {
            for (var v of value) {
                if (v instanceof Expression) {
                    let x = this.execExpression(v)
                    result.push(x)
                }
                else {
                    result.push(v)
                }
            }
        }
        
        if (result.length > 0) {
            if (result[0] instanceof Action/*, T.self == Action.self*/) {//TODO
                return (new ActionMultiAction(value[0].context, {actions: value}))
            }
            
            return result
        }
        else { return value }
    }

    setState(propName: string, value?) {
        this.head[propName] = value
        delete this.localCache[propName]
    }
    
    cascadePropertyAsCGFloat(name) { //Renamed to avoid mistaken calls when comparing to nil
        return (this.cascadeProperty(name)).map((item)=>{ return Number(item) });
    }
    
    cascadeProperty(name) {
        // if (DEBUG//TODO
        //These are temporary checks put in place to catch programmer errors. We should find a safer way that won't lose CVU properties. It is wrapped in DEBUG flag so will not crash in testflight.
        // if T.self == CGFloat.self) { fatalError("You need to use the `cascadePropertyAsCGFloat` function instead") }
        // if (T.self == Int.self) { fatalError("You need to request a Double and then case to integer instead") }
        // #endif
        let expr = this.localCache[name]
        if (expr instanceof Expression) {
            return this.execExpression(expr)
        } else
            if (expr) {
            return this.transformActionArray(expr)
        }

        for (var def of this.cascadeStack) {
            let expr = def[name]
            if (expr instanceof Expression) {
                this.localCache[name] = expr
                return this.cascadeProperty(name)
            }
            if (def[name] != null) {
                this.localCache[name] = def[name]
                return this.transformActionArray(def[name])
            }
        }

        return null
    }

    
    // TODO support deleting items
    cascadeList(name, uniqueKey?, merging?) {
        if (arguments.length === 3) {
            let x = this.localCache[name]
            if (Array.isArray(x)) {
                return x
            }

            var result = []
            var lut = [];
            for (let def of this.cascadeStack) {
                let list = def[name];
                if (Array.isArray(list)) {
                    for (let item of list) {
                        let key = uniqueKey(item);
                        if (key) {
                            let y = lut[key];
                            if (y) {
                                lut[key] = merging(y, item)
                            } else {
                                lut[key] = item
                                result.push(key)
                            }
                        } else {
                            result.push(item)
                        }
                    }
                }
            }

            var list = result.map((el) => {
                let key = el;
                let item = lut[key];
                if (typeof key == "string" && item) {
                    return item
                } else if (el) { //isCVUObject?
                    return item
                }
                return {}
            });
        } else {
            if (!uniqueKey)
                uniqueKey = true;
            let x = this.localCache[name];
            if (Array.isArray(x)) {
                return x
            }

            var result = [];
            for (let def of this.cascadeStack) {
                let x = def[name];
                if (Array.isArray(x)) {
                    if (!uniqueKey) {
                        this.localCache[name] = x
                        return x
                    } else {
                        result.push(x)
                    }
                } else if (def[name]) {
                    if (!uniqueKey) {
                        this.localCache[name] = [x]
                        return [x]
                    } else {
                        result.push(x)
                    }
                }
            }
        }


        this.localCache[name] = list ?? result

        return list ?? result
    }
    
    
    cascadeDict(name, defaultDict = {}, //TODO:
                        forceArray = false) {
        let x = this.localCache[name]
        if (typeof x === "object") { return x }
        
        var result = defaultDict
        
        if (forceArray) {
            for (var def of this.cascadeStack) {
                let x = def[name]
                if (typeof x === "object") {
                    for (let [key, value] of Object.entries(x)) {
                        if (value) {
                            result[key] = value
                        }
                        else {
                            // TODO WARN
                        }
                    }
                }
                else {
                    // TODO WARN
                }
            }
        }
        else {
            for (var def of this.cascadeStack) {
                let x = def[name]
                if (typeof x === "object") {
                    Object.assign(result, x)//TODO
                }
                else {
                    // TODO WARN
                }
            }
        }
        
        this.localCache[name] = result
        return result
    }

    cascadeContext(
        propName: string,
        lookupName: string,
        parsedType,
        type = Cascadable
    ) {
        let x = this.localCache[propName]
        //if (x instanceof type) { return x }

        let head = this.head[lookupName] ?? new parsedType()
        this.head[lookupName] = head

        let tail = this.tail.map((item) => { return (item[lookupName] instanceof parsedType)? item[lookupName]: undefined })

        let cascadable = new type(head, tail, this);
        this.localCache[propName] = cascadable
        return cascadable
    }
    
    constructor(
        head?: CVUParsedDefinition,
        tail?: CVUParsedDefinition[],
        host?: Cascadable
    ) {
        this.host = host
        this.tail = tail ?? []
        this.head = head ?? new CVUParsedDefinition();

        this.cascadeStack = [this.head]
        this.cascadeStack.push(this.tail)
    }
}
