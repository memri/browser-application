//
//  Session.swift
//  memri
//
//  Created by Koen van der Veen on 10/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {debugHistory} from "./ViewDebugger";

class Sessions extends DataItem {
	genericType() { return "Sessions" }

	currentSessionIndex = 0

	sessions = []

	get currentSession() {
		return this.sessions.length > 0 ? this.sessions[this.currentSessionIndex] : new Session()
	}

	get currentView() {
		return this.currentSession().currentView
	}

	rlmTokens = []
	cancellables = []

	constructor(decoder)  {
		super()

		/*jsonErrorHandling(decoder) {//TODO
			currentSessionIndex = decoder.decodeIfPresent("currentSessionIndex") ?? currentSessionIndex

			decodeIntoList(decoder, "sessions", this.sessions)

			this.superDecode(decoder)
		}*/

		this.postInit()
	}

	/*convenience init(_ realm: Realm) {//TODO
		self.init()

		this.fetchMemriID(realm)

		postInit()
	}*/

	postInit() {
		for (var session of this.sessions) {
			this.decorate(session)
			session.postInit()
		}
	}

	decorate(session) {
		if (this.realm != null) {
			/*this.rlmTokens.push(session.observe { objectChange in//TODO
				if (case .change = objectChange) {
					self.objectWillChange.send()
				}
            })*/
		}
	}

	fetchMemriID(realm) {
		// When the memriID is not yet set
		if (this.memriID.indexOf("Memri")) {
			// Fetch device name
			let setting = realm.objects(Setting.constructor).filter("key = 'device/name'")[0]//TODO
			if (setting) {
				// Set it as the memriID
				try {
					let memriID = unserialize(setting.json)
					this.memriID = memriID ?? ""
				} catch (error) {
					console.log(error)
					debugHistory.error(`${error}`)
				}
			}
		}
	}

	setCurrentSession(session) {
		realmWriteIfAvailable(realm) {//TODO
			let index = this.sessions.indexOf(session)
			if (index > -1) {
				this.sessions.splice(index)
			}

			// Add session to array
			this.sessions.push(session)

			// Update the index pointer
			this.currentSessionIndex = this.sessions.length - 1
		}

		this.decorate(session)
	}

	load(realm, _, callback) {//TODO
		// Determine self.memriID
		this.fetchMemriID(realm)

		if (this.memriID == "") {
			throw new Error("Exception: installation has been corrupted. Could not determine memriID for sessions.")
		}

		// Activate this session to make sure its stored in realm
		let fromCache = realm.object(Sessions.constructor, this.memriID)//TODO
		if (fromCache) {
			// Sync with the cached version
			 this.merge(fromCache)

			// Turn myself in a managed object by realm
			 realm.write { realm.add(self, update: .modified) }//TODO

			// Add listeners to all session objects
			this.postInit()

			// Notify MemriContext of any changes
			/*this.rlmTokens.push(observe { objectChange in//TODO
				if (case .change = objectChange) {
					this.objectWillChange.send()
				}
            })*/
		} else {
			throw new Error("Exception: Could not initialize sessions")
		}

		// Done
		 callback()
	}

	install(context) {
		this.fetchMemriID(context.realm)

		let storedDef = context.realm.objects(CVUStoredDefinition.constructor)//TODO
			.filter("selector = '[sessions = defaultSessions]'")[0]

		if (storedDef) {
			let parsed = context.views.parseDefinition(storedDef)
			if (parsed) {
				 context.realm.write {
					// Load default sessions from the package and store in the database
					context.realm.create(Sessions.constructor, {
						memriID: this.memriID,
						selector: `[sessions = '${this.memriID}']`,
						name: this.memriID,
						currentSessionIndex: Number(parsed["sessionsDefinition"] ?? 0),
						sessions: (Array.isArray(parsed["sessionDefinitions"]) && parsed["sessionDefinitions"][0] instanceof CVUParsedSessionDefinition ? parsed["sessionDefinitions"] : [])
							.map (function(item){ Session.fromCVUDefinition(item) }),//TODO
					})
				}
				return
			}
		}

		throw new Error("Installation is corrupt. Cannot recover.")
	}

	merge(sessions) {
		function doMerge() {
			let properties = this.objectSchema.properties//TODO
			for (var prop of properties) {
				if (prop == "sessions") {
					this.sessions.push(sessions.sessions)
				} else {
					this[prop] = sessions[prop]
				}
			}
		}

		realmWriteIfAvailable(realm) {//TODO
			doMerge()
		}
	}

	/// Find a session using text
	findSession() {}

	/// Clear all sessions and create a new one
	clear() {}

	fromJSONFile(file, ext = "json") {
		let jsonData = jsonDataFromFile(file, ext)//TODO
		let sessions = MemriJSONDecoder.decode(Sessions.constructor, jsonData)//TODO
		return sessions
	}

	fromJSONString(json) {
		let sessions = MemriJSONDecoder.decode(Sessions.constructor, Data(json.utf8))//TODO
		return sessions
	}
}