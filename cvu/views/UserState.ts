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

export class UserState extends SchemaItem/*extends Object, CVUToString*/ {
	state = ""

	cacheID = UUID();

	/// Primary key used in the realm database of this Item
	primaryKey() {
		return "uid"
	}

	constructor(dict) {//TODO
		super()
		this.storeInCache(dict);
		this.persist()
	}

	storeInCache(dict) {
		let id = this.uid != undefined ? `${this.uid ?? -99}` : this.cacheID
		return setInMemoryObjectCache(`UserState:${id}`, dict)
	}

	getFromCache() {
		let id = this.uid != undefined ? `${this.uid ?? -99}` : this.cacheID
		return getInMemoryObjectCache(`UserState:${id}`);
	}

	get(propName) {
		let dict = this.asDict()

		if (dict[propName] == undefined) {
			return null
		}

		return dict[propName];
	}

	set(propName, newValue, persist = true) {
		var dict = this.asDict()
		dict[propName] = newValue

		try {
			this.storeInCache(dict)
		} catch {
			/* TODO: ERROR HANDLIGNN */
			debugHistory.warn(`Unable to store user state property ${propName}`)
			return
		}

		if (this.persist) {
			this.scheduleWrite()
		}
	}

	transformToDict() {
		if (this.state == "") { return {} }
		let stored = this.unserialize(this.state) ?? {} //TODO:
		var dict = {}

		for (let [key, wrapper] of Object.entries(stored)) {
			let lookup = wrapper.value;
			if (typeof lookup.isCVUObject() == "function" && lookup["___"] != undefined) {
				let itemType = lookup["_type"];
				let uid = lookup["_uid"];
				if (typeof itemType == "string" && typeof uid == "number") {
					dict[key] = this.getItem(itemType, uid)
				} else {
					debugHistory.warn("Could not expand item. View may not load as expected")
				}
			} else {
				dict[key] = wrapper.value
			}
		}

		this.storeInCache(dict);
		return dict
	}

	scheduled = false
	scheduleWrite() {
		// Don't schedule when we are already scheduled
		if (!this.scheduled) {
			// Prevent multiple calls to the dispatch queue
			this.scheduled = true

			// Schedule update
			/*DispatchQueue.main.async {
				// Reset scheduled
				this.scheduled = false

				// Update UI
				this.persist()
			}*/ //TODO:
		}
	}

	persist() {
		//if (realm == null) { return }//TODO

		let x = this.getFromCache();
		if (x) {
			realmWriteIfAvailable(this.realm, function () {
				try {
					var values = {}

					for (let [key, value] of Object.entries(x)) {
						if (value instanceof Item) {
							values[key] = {"_type": value.genericType,
										   "_uid": value.uid.value,
										   "___": true}
						} else if (Array.isArray(value) && value.length > 0 && value instanceof Item) {
							/*values[key] = AnyCodable(value.map(item => {
								{"_type": value.genericType,
									"_uid": value.uid.value,
									"___": true} }))*/ //TODO
					} /*else if (value instanceof AnyCodable) {
							values[key] = value
						}*/ else {
							values[key] = /*AnyCodable(*/value//)//TODO
						}
					}

					let data = /*new MemriJSONEncoder.encode(values)*/JSON.stringify(values) //TODO
					this["state"] = String(data) ?? ""
				} catch (error) {
					debugHistory.error(`Could not persist state object: ${error}`)
				}
			}.bind(this))
		}
	}

	// Requires support for dataItem lookup.

	toggleState(stateName) {
		let x = this.get(stateName) ?? true
		this.set(stateName, !x)
	}

	hasState(stateName) {
		let x = this.get(stateName) ?? false
		return x
	}

	asDict() {
		let cached = this.getFromCache();
		if (cached) {
			return cached
		} else {
			try {
				return this.transformToDict()
			} catch (error) {
				debugHistory.error(`Could not unserialize state object: ${error}`)
				return {}
			} // TODO: refactor: handle error
		}
	}

	merge(state) {
		let dict = this.asDict().concat(state.asDict()) //TODO
		this.storeInCache(dict);
		this.persist();
	}

	toCVUString(depth, tab) {
		return new CVUSerializer().dictToString(this.asDict(), depth, tab)
	}

	clone(viewArguments?: ViewArguments, values?, managed: boolean = true, item?: Item) {
		var dict = viewArguments?.asDict() ?? {}
		//let values = values;
		if (values)  {
			dict = Object.assign({}, values, dict);
		}

		if (managed) { return new UserState(dict).fromDict(dict, item) }
		else { return new UserState(dict) }
	}

	fromDict(dict, item?: Item) {
		let userState = new Cache.createItem(UserState.self, {}) //TODO

		// Resolve expressions
		var dct = dict
		for (let [key, value] of Object.entries(dct)) {
			let expr = value;
			if (expr instanceof Expression) {
				dct[key] = expr.execute(new ViewArguments({".": item}))
			}
		}

		userState.storeInCache(dct)
		userState.persist()
		return userState
	}
}

export var ViewArguments = UserState
