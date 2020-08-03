//
//  DatabaseController.swift
//  memri
//
//  Created by Toby Brennan on 19/7/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {Item} from "./items/Item";
import {debugHistory} from "../cvu/views/ViewDebugger";

//import * as path from "path";
import {Realm} from "./RealmLocal";
var realm;

export class ItemReference {
    uid: number
    type
    
    constructor (to: Item) {
        this.uid = to.uid ?? -1
        this.type = to.getType() ?? new Item();
    }
    
    resolve() {
        return DatabaseController.read((realm) => { return realm.objectForPrimaryKey(this.type?.constructor?.name, this.uid) })
    }
}

class EdgeReference {
    type: string
    sourceItemID: number
    targetItemID: number

	constructor (to: Edge) {
        this.type = to.type ?? ""
		this.sourceItemID = to.sourceItemID.value ?? -1
		this.targetItemID = to.targetItemID.value ?? -1
    }
    
    resolve() {
        DatabaseController.read ((realm: Realm) => {
			return realm.objects("Edge")
                .filtered(`type = '${this.type}' AND sourceItemID = ${this.sourceItemID} AND targetItemID = ${this.targetItemID}`)[0]//TODO
        })
    }
}

export class DatabaseController {
	constructor() {}
	
	static realmTesting = false

	/*static get realmConfig(): Realm.Configuration {
		return {
			// Set the file url
			path: this.getRealmURL(),
			// Set the new schema version. This must be greater than the previously used
			// version (if (you've never set a schema version before, the version is 0).
			schemaVersion: 101,

			// Set the block which will be called automatically when opening a Realm with
			// a schema version lower than the one set above
			/!*migration: function(oldSchemaVersion) {
				// We haven’t migrated anything yet, so oldSchemaVersion == 0
				if (oldSchemaVersion < 2) {
					// Nothing to do!
					// Realm will automatically detect new properties and removed properties
					// And will update the schema on disk automatically
				}
            }*!/
		}
	}*/
	
	/// Computes the Realm database path at /home/<user>/realm.memri/memri.realm and creates the directory (realm.memri) if (it does not exist.
	/// - Returns: the computed database file url
	/*static getRealmURL() {
		// #if (targetEnvironment(simulator)
		let homeDir = path.dirname(require.main.filename);/!*ProcessInfo.processInfo.environment["SIMULATOR_HOST_HOME"]*!/
		if (homeDir) {
			var realmDir = homeDir + "/realm.memri"
			
			if (this.realmTesting) {
				realmDir += ".testing"
			}
			
			/!*try {
				 FileManager.default.createDirectory(realmDir, true)
			} catch(error) {
				console.log(error)
			}*!/
			
			//let realmURL = new URL(realmDir + "/memri.realm")
			return realmDir + "/memri.realm"
		} else {
			throw "Could not get realm url"
		}
		// #else
		/!*let paths = FileManager.default.urls("documentDirectory", "userDomainMask")
		let documentsDirectory = paths[0]
		return documentsDirectory.appendingPathComponent("memri.realm")*!/
		// #endif
	}*/
	
	/// This function returns a Realm for the current thread
	static getRealm() {
		if (!realm) {
			realm = new Realm();
		}
		return realm;
	}
	
	static get realmQueue() {
		let queue = new DispatchQueue("memri.realmQueue", "utility") //TODO:
		return queue
	}
//	static let realmQueueSpecificKey = DispatchSpecificKey<Bool>()
	/// This is used internally to get a queue-confined instance of Realm
//	static function getQueueConfinedRealm() {
//		try! Realm(configuration: realmConfig, queue: realmQueue)
//	}
//	static var isOnRealmQueue: Bool {
//		DispatchQueue.getSpecific(key: realmQueueSpecificKey) ?? false
//	}
	
	/*static tryRead(doRead) {
		let realm = this.getRealm()
		doRead(realm)
	}*/

	static tryRead(doRead) {
		let realm = this.getRealm()
		return doRead(realm)
	}
	
	/*read(doRead) {
		try {
			 this.tryRead(doRead)
		}
		catch(error) {
			debugHistory.error(`Realm Error: ${error}`)
		}
	}*/
	
	static read(doRead) {
		try {
			return this.tryRead(doRead)
		}
		catch(error) {
			debugHistory.error(`Realm Error: ${error}`)
			return null
		}
	}
	
	/// Use this for tasks that will affect user-visible behaviour. It will run on the current-thread.
	/*static tryWriteSync(doWrite) {
		let realm = this.getRealm()
		if (realm.isInTransaction) {
			doWrite(realm)
			return
		}
		realm.write(function() {
			doWrite(realm)
		})
	}*/
	
	/// Use this for tasks that will affect user-visible behaviour. It will run on the current-thread.
	static tryWriteSync(doWrite) {
		let realm = this.getRealm()
		if (realm.isInTransaction) {
			return doWrite(realm)
		}
		realm.write(function() {
			return doWrite(realm)
		})
		return null
	}
	
	/// Use this for tasks that will affect user-visible behaviour. It will run on the current-thread.
	/*static writeSync(doWrite) {
		try {
			 this.tryWriteSync(doWrite)
		}
		catch(error) {
			debugHistory.error(`Realm Error: ${error}`)
		}
	}*/
	
	/// Use this for tasks that will affect user-visible behaviour. It will run on the current-thread.
	static writeSync(doWrite) {
		try {
			return this.tryWriteSync(doWrite)
		}
		catch(error) {
			debugHistory.error(`Realm Error: ${error}`)
			return null
		}
	}
	
	/// Use this for writing to Realm in the background. It will run on a background thread.
	/*static writeAsync(doWrite) {
		this.realmQueue.async(() => {
			autoreleasepool(() => {//TODO
				try {
					let realm = this.getRealm()
					if (realm.isInTransaction) {
						doWrite(realm)
						return
					}
					realm.write(function() {
						doWrite(realm)
					})
				}
				catch(error) {
					debugHistory.error(`Realm Error: ${error}`)
				}
			})
		})
	}*/
	
	/// Use this for writing to Realm in the background. It will run on a background thread.
	//static writeAsync(doWrite)
	static writeAsync(doWrite, objectReference?: ThreadSafeReference) {
		if (arguments.length == 1) {
			//this.realmQueue.async(() => {
				//autoreleasepool(() => {//TODO
					try {
						let realm = this.getRealm()
						if (realm.isInTransaction) {
							doWrite(realm)
							return
						}
						realm.write(function() {
							doWrite(realm)
						})
					}
					catch(error) {
						debugHistory.error(`Realm Error: ${error}`)
					}
				//})
			//})
		} else {
			//this.realmQueue.async(() => {
				//autoreleasepool(() => {
					try {
						let realm = this.getRealm()
						let threadSafeObject = realm.resolve(objectReference)
						if (!threadSafeObject) {return}

						if (realm.isInTransaction) {
							doWrite(realm, threadSafeObject)
							return
						}

						realm.write(() => {
							doWrite(realm, threadSafeObject)
						})
					} catch(error) {
						debugHistory.error(`Realm Error: ${error}`)
					}
				//})
			//})
		}
	}
}
