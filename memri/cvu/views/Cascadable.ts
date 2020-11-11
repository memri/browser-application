//
//  Cascadable.swift
//  Copyright © 2020 memri. All rights reserved.

import {ActionMultiAction} from "../../../router";
import {debugHistory} from "../../../router";
import {CVUParsedDefinition} from "../../../router";
import {CVUSerializer} from "../../../router";
import {MemriDictionary} from "../../../router";

export enum SelectorType {
    singleItem,
    list
}

export class Cascadable/* extends CustomStringConvertible*/{
    host?: Cascadable
    cascadeStack: CVUParsedDefinition[]
    tail: CVUParsedDefinition[]
    head: CVUParsedDefinition
    localCache = new MemriDictionary()

    get viewArguments() { return this.host?.viewArguments }
    set viewArguments(value) { if (this.host) this.host.viewArguments = value }

    get toString() {
        var merged = new MemriDictionary()

        function recur(dict: MemriDictionary) {
            if (!dict) { return }

            for (let [key, value] of Object.entries(dict)) {
                merged[key] = value
            }
        }
        recur(this.head.parsed)
        for (var item of this.tail) { recur(item.parsed) }

        return CVUSerializer.dictToString(merged, 0, "    ")
    }

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
                if (v?.constructor?.name == "Expression") {
                    let x = this.execExpression(v)
                    result.push(x)
                }
                else {
                    result.push(v)
                }
            }
        }

        if (result.length > 0) {
            if (result[0]?.constructor?.name == "Action"/*, T.self == Action.self*/) {//TODO
                return (new ActionMultiAction(value[0].context, {actions: value}))
            }

            return result
        }
        else { return value }
    }

    setState(propName: string, value?) {
        this.head.set(propName, value);
        delete this.localCache[propName]
    }

    isSet() {
        return (Object.keys(this.head.parsed).length ?? 0) > 0 || this.tail.length > 0
    }

    cascadePropertyAsCGFloat(name) { //Renamed to avoid mistaken calls when comparing to nil
        return (this.cascadeProperty(name)).map((item)=>{ return Number(item) });
    }

    cascadeProperty(name, type?) {
        // if (DEBUG//TODO
        //These are temporary checks put in place to catch programmer errors. We should find a safer way that won't lose CVU properties. It is wrapped in DEBUG flag so will not crash in testflight.
        // if T.self == CGFloat.self) { fatalError("You need to use the `cascadePropertyAsCGFloat` function instead") }
        // if (T.self == Int.self) { fatalError("You need to request a Double and then case to integer instead") }
        // #endif
        let expr = this.localCache[name]
        if (expr?.constructor?.name == "Expression") {
            if (type == "Expression") {
                return expr// We're requesting the Expression (not just the resolved value)
            } else {
                return this.execExpression(expr)
            }
        } else
        if (expr) {
            return this.transformActionArray(expr)
        }

        for (var def of this.cascadeStack) {
            let expr = def.get(name);
            if (expr?.constructor?.name == "Expression") {
                this.localCache[name] = expr
                if (type == "Expression") {
                    return expr// We're requesting the Expression (not just the resolved value)
                }
                return this.cascadeProperty(name)
            }
            if (Array.isArray(expr) && expr.length == 1 && Array.isArray(expr[0]) && expr[0].length == 0) {
                return null;
            } //TODO: we need to check def.get result for selection, cause it returns array with empty array
            if (expr != undefined) {
                this.localCache[name] = expr
                return this.transformActionArray(expr)
            }
        }

        return null
    }


    // TODO support deleting items
    cascadeList(name, uniqueKey?, merging?) {
        if (typeof uniqueKey == "function") {
            let x = this.localCache[name]
            if (Array.isArray(x)) {
                return x
            }

            var result = []
            var lut = {};
            for (let def of this.cascadeStack) {
                let list: CVUParsedDefinition = def.get(name); //TODO:
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
            let selectorType = uniqueKey;
            let merge = merging ?? true;

            let x = this.localCache[name];
            if (Array.isArray(x)) {
                return x
            }

            var result = [];
            for (let def of this.cascadeStack) {
                if (selectorType) {
                    // Check if this matches the selector type, otherwise continue to next definition
                    switch (selectorType) {
                        case SelectorType.list:
                            // Only include definitions for list selectors
                            if (!def.selectorIsForList)
                                continue;
                            break;
                        case SelectorType.singleItem:
                            // Only include definitions for single item selectors
                            if (def.selectorIsForList)
                                continue;
                            break;
                    }
                }
                let x: CVUParsedDefinition = def.get(name);
                if (x) {
                    if (Array.isArray(x)) {
                        if (!merge) {
                            this.localCache[name] = x
                            return x
                        } else {
                            result.push(...x)
                        }
                    } else {
                        if (!merge) {
                            this.localCache[name] = [x]
                            return [x]
                        } else {
                            result.push(x)
                        }
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
                if (x.constructor.name === "MemriDictionary") {
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
        if (x?.constructor?.name == type.name) { return x }

        let head = (this.head.get(lookupName)?.constructor.name == parsedType.name)? this.head.get(lookupName) : new parsedType();
        this.head.set(lookupName, head);

        let tail = this.tail.map((item) => { return (item.get(lookupName)?.constructor?.name == parsedType.name)? item.get(lookupName): undefined }).filter((item) => item != undefined)

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
        this.cascadeStack.push(...this.tail)
    }
}
