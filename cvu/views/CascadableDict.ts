//
//  UserState.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";
import {DataItem, UUID} from "../../model/DataItem";
import {
	setInMemoryObjectCache,
	getInMemoryObjectCache
} from "../../model/InMemoryObjectCache";
import {realmWriteIfAvailable} from "../../gui/util";
import {debugHistory} from "./ViewDebugger";
import {SchemaItem} from "../../model/schema";
import {Item} from "../../model/items/Item";
import {Expression} from "../../parsers/expression-parser/Expression";
import {Cascadable} from "./Cascadable";
import {ItemReference} from "../../model/DatabaseController";

export class CascadableDict extends Cascadable/*extends Cascadable, Subscriptable*/ {
	get(name: string, type?) {
		let value = this.cascadeProperty(name)
		if (!value) {
			return null
		}

		let itemRef = value
		if (value instanceof ItemReference) {
			return value.resolve()
		}
		else if (Array.isArray(value) && value[0] instanceof ItemReference) {
			return value.map((ref) => {
				if (!ref) { return null }
				return ref.resolve()
			} )
		}
		// Dicts are not support atm

		return value
	}

	set(name: string, value?) {
		if (value instanceof Item) {
			this.setState(name, new ItemReference(value))
		}
		else if (Array.isArray(value) && value[0] instanceof Item) {
			this.setState(name, value.map((item) => { item
				if (!item) { return null }
				return new ItemReference(item)
			}))
		}
		else {
			this.setState(name, value)
		}
	}

	getSubscript(name) { return this.get(name) }//TODO get with param
	setSubscript(name, value) { this.set(name, value) }

	constructor(dict?, tail?, host?:Cascadable) {//TODO
		var result = {}

		if (dict) {
			for (let [key, value] of Object.entries(dict)) {
				if (value instanceof Item) {
					result[key] = new ItemReference(value)
				}
				else if (Array.isArray(value) && value[0] instanceof Item) {
					result[key] = value.map((item) => {
						if (!item) { return null }
						return new ItemReference(item)
					} )
				}
				else {
					result[key] = value
				}
			}
		}

		super(new CVUParsedObjectDefinition(Object.keys(result).length == 0 ? null : result), tail, host)
	}

	/*constructor(other?: CascadableDict, item?: Item) {
		super(CVUParsedObjectDefinition(), other?.cascadeStack)
		if (item) { this.set(".", item) }
	}*/

	merge(other?: CascadableDict) {
		if (!other) {return this}

		let parsed = other.head.parsed
		if (parsed) {
			for (let [key, value] of Object.entries(parsed)) {
				this.head[key] = value
			}
		}

		if (!other.tail.length) {
			this.tail.push(other.tail)
			this.cascadeStack.push(other.tail)
		}

		return this
	}

	deepMerge(other?: CascadableDict) {
		if (!other) { return this }

		function merge(parsed?) {
			if (!parsed) { return }
			for (let [key, value] of Object.entries(parsed)) {
				this.head[key] = value
			}
		}

		merge(other.head.parsed)
		for (let item of other.tail) {
			merge(item.parsed)
		}

		return this
	}

	resolve(item?: Item) {
		// TODO: Only doing this for head, let's see if that is enough
		//       Currently the assumption is that tails never change.
		//       If they do, a copy is required

		// #warning("This will resolve items which is not good")
		for (let [key, value] of Object.entries(this.head.parsed ?? {})) {
			let expr = value
			if (expr instanceof Expression) {
				let value = expr.execute(this.viewArguments)
				if (value instanceof Item) { /* ignore */ }
				else { this.head.parsed[key] = value }
			}
		}

		this.set(".", item)

		return this
	}

	copy(item?: Item) {
		let dict = new CascadableDict(CVUParsedObjectDefinition(), this.cascadeStack)
		if (item) { dict.set(".", item) }
		return dict
	}

}

export var UserState = CascadableDict
export var ViewArguments = CascadableDict