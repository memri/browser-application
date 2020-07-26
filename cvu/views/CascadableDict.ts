//
//  UserState.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

import {Item} from "../../model/items/Item";
import {Expression} from "../../parsers/expression-parser/Expression";
import {Cascadable} from "./Cascadable";
import {ItemReference} from "../../model/DatabaseController";
import {CVUParsedDefinition, CVUParsedObjectDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";

export class CascadableDict extends Cascadable/*extends Cascadable, Subscriptable*/ {
	get(name: string, type = CascadableDict) {
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
			this.setState(name, value.map((item) => {
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

	get description() {
		return this.head.parsed?.keys.description ?? ""
	}

	constructor(head?, tail?, host?:Cascadable) {//TODO
		if (head instanceof CascadableDict) {
			var combinedTail = head?.tail;
			combinedTail?.push(tail?.cascadeStack ?? [])
			super(new CVUParsedObjectDefinition(head?.head.parsed), combinedTail)
		} else {
			if (head instanceof CVUParsedDefinition) {
				super(head, tail, host)
			} else {
				super(new CVUParsedObjectDefinition(head), tail, host)
			}
		}
	}

	resolve(item?: Item) {
		// TODO: Only doing this for head, let's see if that is enough
		//       Currently the assumption is that tails never change.
		//       If they do, a copy is required

		// #warning("This will resolve items which is not good")
		for (let [key, value] of Object.entries(this.head.parsed ?? {})) {
			let expr = value
			if (expr instanceof Expression) {
				this.head.parsed[key] = expr.execute(this.viewArguments)
			}
		}
	}

}

export var UserState = CascadableDict
export var ViewArguments = CascadableDict