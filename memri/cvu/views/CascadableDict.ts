//
//  CascadableDict.swift
//  Copyright © 2020 memri. All rights reserved.

import {Expression} from "../../parsers/expression-parser/Expression";
import {Cascadable} from "./Cascadable";
import {ItemReference} from "../../storage/DatabaseController";
import {CVUParsedDefinition, CVUParsedObjectDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {Item} from "../../model/items/Item";
import {MemriDictionary} from "../../model/MemriDictionary";

export class CascadableDict extends Cascadable/*extends Cascadable, Subscriptable*/ {
	subscript() {
		//mock function;
	}

	get(name: string, type = CascadableDict) {
		let value = this.cascadeProperty(name)
		if (!value) {
			return null
		}

		let itemRef = value
		if (value?.constructor?.name == "ItemReference") {
			return value.resolve()
		}
		else if (Array.isArray(value) && value[0]?.constructor?.name == "ItemReference") {
			return value.map((ref) => {
				if (!ref) { return null }
				return ref.resolve()
			} )
		}
		// Dicts are not support atm

		return value
	}

	set(name: string, value?) {
		if (value?.constructor?.name == "Item") {
			this.setState(name, new ItemReference(value))
		}
		else if (Array.isArray(value) && value[0]?.constructor?.name == "Item") {
			this.setState(name, value.map((item) => {
				if (!item) { return null }
				return new ItemReference(item)
			}))
		}
		else {
			this.setState(name, value)
		}
	}

	constructor(head?, tail?: CVUParsedDefinition[]|Item, host?:Cascadable) {//TODO
		if (head instanceof CascadableDict || tail instanceof Item) {
			super(new CVUParsedObjectDefinition(), head?.cascadeStack)
			if (tail) { this.set(".", tail) }
		} else if (head instanceof CVUParsedDefinition) {
			super(head, tail, host)
		} else {
			var result = new MemriDictionary()

			if (head && head.constructor.name === "MemriDictionary") {
				for (let [key, value] of Object.entries(head)) {
					if (value instanceof Item) {
						result[key] = new ItemReference(value)
					}
					else if (Array.isArray(value) && value[0] instanceof Item) {
						result[key] = value.map ((item) => {
							if (!item) { return undefined }
							return new ItemReference(item)
						})
					}
					else {
						result[key] = value
					}
				}
			}

			super(new CVUParsedObjectDefinition(Object.keys(result).length === 0 ? undefined : result), tail, host)
		}
	}

	merge(other?: CascadableDict) {
		if (!other) { return this }

		let parsed = other.head.parsed
		if (parsed) {
			for (let [key, value] of Object.entries(parsed)) {
				this.head.set(key, value);
			}
		}

		if (Object.keys(other.tail).length > 0) {
			this.tail.push(...other.tail)
			this.cascadeStack.push(...other.tail)
		}

		return this
	}

	deepMerge(other?: CascadableDict) {
		if (!other) { return this }

		let merge = (parsed?: MemriDictionary) => {
			if (!parsed) { return }
			for (let [key, value] of Object.entries(parsed)) {
				this.head.set(key, value)
			}
		}

		merge(other.head.parsed)
		for (let item of other.tail) {
			merge(item.parsed)
		}

		return this
	}

	resolve(item?: Item, viewArguments?: ViewArguments) {
		// TODO: Only doing this for head, let's see if that is enough
		//       Currently the assumption is that tails never change.
		//       If they do, a copy is required

		let args = new ViewArguments(viewArguments, item)
		this.head.parsed = Expression.resolve(this.head.parsed, args, true)
		this.set(".", item)

		return this
	}

	copy(item?: Item) {
		let dict = new CascadableDict(new CVUParsedObjectDefinition(), this.cascadeStack)
		if (item) { dict.set(".", item) }
		return dict
	}
}

export var UserState = CascadableDict
export var ViewArguments = CascadableDict