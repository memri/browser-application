//
//  Cascadable.swift
//  memri
//
//  Created by Ruben Daniels on 5/24/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {Action} from "ts-loader/dist/interfaces";
import {Expression} from "../../parsers/expression-parser/Expression";

class Cascadable {
    viewArguments;
    cascadeStack;
    localCache = [];
    
    execExpression(expr) {
        try {
            let x = expr.execForReturnType(this.viewArguments)
            let value = this.transformActionArray(x)
            if (value == null) { return null }
            else { return value }
        }
        catch (error) {
            // debugHistory.error(`${error}`)//TODO
            return null
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
    
    cascadePropertyAsCGFloat(name) { //Renamed to avoid mistaken calls when comparing to nil
        // (this.cascadeProperty(name) as Double?).map { CGFloat($0) }//TODO
    }
    
    cascadeProperty(name, type?) {
        // if (DEBUG//TODO
        //These are temporary checks put in place to catch programmer errors. We should find a safer way that won't lose CVU properties. It is wrapped in DEBUG flag so will not crash in testflight.
        // if T.self == CGFloat.self) { fatalError("You need to use the `cascadePropertyAsCGFloat` function instead") }
        // if (T.self == Int.self) { fatalError("You need to request a Double and then case to integer instead") }
        // #endif
        let local = this.localCache[name]
        if (local instanceof Expression) {
            return this.execExpression(local)
        }
        if (local) {
            return this.transformActionArray(local)
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
    cascadeList(name, merge = true) {
        let x = this.localCache[name]
        if (Array.isArray(x)) { return x }
        
        var result = []
        
        for (var def of this.cascadeStack) {
            let x = def[name]
            if (Array.isArray(x)) {
                if (!merge) {
                    this.localCache[name] = x
                    return x
                }
                else {
                    result.push(x)
                }
            }
            else if (x) {//TODO as T?
                if (!merge) {
                    this.localCache[name] = [x]
                    return [x]
                }
                else {
                    result.push(x)
                }
            }
        }

        this.localCache[name] = result
        return result
    }
    
    
    cascadeDict(name, defaultDict = [],
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
    
    init(cascadeStack, viewArguments) {
        this.viewArguments = viewArguments
        this.cascadeStack = cascadeStack
    }
}
