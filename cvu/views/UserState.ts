//
//  UserState.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


class UserState extends Object, CVUToString {
	memriID = DataItem.generateUUID()
	state = ""

	onFirstSave

	constructor(dict, onFirstSave) {//TODO
		super()

		this.onFirstSave = onFirstSave

		try { InMemoryObjectCache.set(this.memriID, dict) }
		catch {
			// TODO: Refactor error reporting
		}
	}

	get(propName) {
		let dict = this.asDict()

		let lookup = dict[propName]
		
		if (lookup && typeof lookup == "object" && lookup["memriID"] != null) {
			let x = this.getDataItem(lookup["type"]  ?? "",
										   lookup["memriID"]  ?? "")
			return x
		} else if (dict[propName] == null) {
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

		try {  globalInMemoryObjectCache.set(this.memriID, x) }
		catch { /* TODO: ERROR HANDLIGNN */ }

		if (persist) { this.scheduleWrite() }
	}

	transformToDict() {
		if (this.state == "") { return {} }
		let stored = JSON.parse(this.state) ?? {}//TODO
		var dict = {}

		for (let [key, value] of Object.entries(stored)) {
			dict[key] = value.value
		}

		InMemoryObjectCache.set(this.memriID, dict)//TODO
		return dict
	}

	scheduled = false
	scheduleWrite() {
		// Don't schedule when we are already scheduled
		if (!this.scheduled) {
			// Prevent multiple calls to the dispatch queue
			this.scheduled = true

			// Schedule update
			DispatchQueue.main.async {
				// Reset scheduled
				this.scheduled = false

				// Update UI
				this.persist()
			}
		}
	}

	persist() {
		if (realm == null) { return }//TODO

		let x = InMemoryObjectCache.get(this.memriID)
		if (x && typeof x == "object") {
			realmWriteIfAvailable(realm) {
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
			}
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
		x = InMemoryObjectCache.get(this.memriID)
		try { if (x == null) { x = this.transformToDict() } } catch { return {} } // TODO: refactor: handle error
		return x ?? {}
	}

	merge(state) {
		let dict = this.asDict().merging(state.asDict(), { _, new in new })//TODO
		InMemoryObjectCache.set(this.memriID, dict)
	}

	clone() {
		UserState(this.asDict())//TODO
	}

	toCVUString(depth, tab) {
		CVUSerializer.dictToString(this.asDict(), depth, tab)
	}
}

var ViewArguments = UserState
