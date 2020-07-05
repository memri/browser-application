//
//  UserState.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";
import {DataItem} from "../../model/DataItem";
import {InMemoryObjectCache} from "../../model/InMemoryObjectCache";

export class UserState /*extends Object, CVUToString*/ {
	memriID = DataItem.generateUUID();
	state = ""

	onFirstSave

	constructor(dict, onFirstSave) {//TODO
		//super()

		this.onFirstSave = onFirstSave

		try { new InMemoryObjectCache().set(this.memriID, dict) }
		catch {
			// TODO: Refactor error reporting
		}
	}

	get(propName) {
		let dict = this.asDict()

		let lookup = dict[propName]
		
		if (lookup && typeof lookup.isCVUObject === "function" && lookup["memriID"] != undefined) {
			let x = this.getDataItem(lookup["type"]  ?? "",
										   lookup["memriID"]  ?? "")
			return x
		} else if (dict[propName] == undefined) {
			return null
		}

		return dict[propName]
	}

	set(propName, newValue, persist = true) {
		let event = this.onFirstSave
		if (event) {
			event(this)
			this.onFirstSave = null
		}

		var x = this.asDict()

		if (newValue instanceof DataItem) {
			x[propName] = {type: newValue.genericType, memriID: newValue.memriID}
		} else {
			x[propName] = newValue
		}

		try {  new InMemoryObjectCache().set(this.memriID, x) }
		catch { /* TODO: ERROR HANDLIGNN */ }

		if (persist) { this.scheduleWrite() }
	}

	transformToDict() {
		if (this.state == "") { return {} }
		let stored = Object.assign({},this.state) //TODO
		var dict = {}

		for (let [key, value] of Object.entries(stored)) {
			dict[key] = value.value
		}

		new InMemoryObjectCache().set(this.memriID, dict)//TODO
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
			}*/
		}
	}

	persist() {
		if (realm == null) { return }//TODO

		let x = new InMemoryObjectCache().get(this.memriID)
		if (x && typeof x == "object") {
			/*realmWriteIfAvailable(realm) {
				try {
					var values = {}

					for (let [key, value] of Object.entries(x)) {
						if (value instanceof AnyCodable) {
							values[key] = value
						} else {
							values[key] = new AnyCodable(value)
						}
					}

					let data = JSON.stringify(values)//TODO
					this.state = String(data, encoding: .utf8) ?? ""//TODO
				} catch {
					debugHistory.error(`Could not persist state object: ${error}`)
				}
			}*/
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
		var x
		x = new InMemoryObjectCache().get(this.memriID)
		try { if (x == null) { x = this.transformToDict() } } catch { return {} } // TODO: refactor: handle error
		return x ?? {}
	}

	merge(state) {
		let dict = this.asDict().concat(state.asDict()) //TODO
		new InMemoryObjectCache().set(this.memriID, dict) //TODO
	}

	clone() {
		new UserState(this.asDict())//TODO
	}

	toCVUString(depth, tab) {
		new CVUSerializer().dictToString(this.asDict(), depth, tab)
	}
}

export var ViewArguments = UserState
