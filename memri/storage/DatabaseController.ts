//
//  DatabaseController.swift
//  memri
//
//  Created by Toby Brennan on 19/7/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {Item} from "../model/items/Item";
import {debugHistory} from "../cvu/views/ViewDebugger";

//import * as path from "path";
import {Realm} from "../model/RealmLocal";
var realm;

export class ItemReference {
    uid: number
    type
    
    constructor (to: Item) {
		let uid = to.uid;
		let type = to.getType();
		if (!uid || !type || to.realm == undefined) {
			fatalError("Trying to get a reference to an item that is not in realm or has no uid"); //TODO:
		}
        this.uid = uid
        this.type = type
    }

	resolve() {
		try {
			return DatabaseController.tryCurrent(false,(realm) => {
				return realm.objectForPrimaryKey(this.type?.constructor?.name, this.uid)
			})
		} catch (e) {
			return;
		}
	}
}

class EdgeReference {
    type: string
    sourceItemID: number
    targetItemID: number

	constructor (to: Edge) {
		let type = to.type;
		let targetItemID = to.targetItemID;
		let sourceItemID = to.sourceItemID;
		if (!type || !targetItemID || !sourceItemID) {
			fatalError("Trying to get a reference to an edge that is not in realm or has no uid")
		}
        this.type = type;
		this.sourceItemID = sourceItemID;
		this.targetItemID = targetItemID;
    }

	resolve() {
		try {
			return DatabaseController.tryCurrent(false,(realm: Realm) => {
				return realm.objects("Edge")
					.filtered(`type = '${this.type}' AND sourceItemID = ${this.sourceItemID} AND targetItemID = ${this.targetItemID}`)[0]
			})
		} catch (e) {
			return
		}
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
	static getRealmAsync(receiveRealm) {
		Authentication.getPublicRootKey((error, data) => {
			if (!data) {
				receiveRealm(error, undefined)
				return;
			}

			//var config = realmConfig

			if (!this.realmTesting) {
				/*#if targetEnvironment(simulator)
				if !reportedKey {
					print("REALM KEY: \(data.hexEncodedString(options: .upperCase))")
					reportedKey = true
				}
				#endif*/

				//config.encryptionKey = data
			}

			try {
				let realm = new Realm();
				receiveRealm(undefined, realm)
			} catch {
				// TODO error handling
				// Notify the user
				debugHistory.error(`${error}`)
				receiveRealm(error, undefined)
			}
		})
	}
	/// This function returns a Realm for the current thread
	static getRealmSync() {
		let data = Authentication.getPublicRootKeySync()
		//var config = this.realmConfig
		/*if (!realmTesting) {
			#if targetEnvironment(simulator)
			if !reportedKey {
				reportedKey = true
				print("REALM KEY: \(data.hexEncodedString(options: .upperCase))")
				Authentication.getOwnerAndDBKey { err, owner, db in
					if err != nil {
						reportedKey = false
						return
					}

					print("OWNER KEY: \(owner ?? "")")
					print("DB KEY: \(db ?? "")")
				}
			}
			#endif

			config.encryptionKey = data
		}*/
		return new Realm();
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

	static current(write = false, error = this.globalErrorHandler, exec?) {
		if (arguments.length == 3) {
			this.getRealmAsync((err, realm) => {
				if (err) {
					error(err)
					return;
				}
				if (!realm) {
					error("Unable to initialize realm")
					return
				}

				try {
					if (write) {
						if (realm.isInWriteTransaction) {
							exec(realm)
							return;
						}

						realm.write(() => {
							exec(realm)
						})
					} else {
						exec(realm)
					}
				} catch (err) {
					error(err)
				}
			});
		} else {
			exec = error;
			try {
				return this.tryCurrent(write, exec);
			} catch (error) {
				debugHistory.warn(`${error}`)
				return;
			}
		}

	}

	/// Execute a realm based function that throws and returns a value on the main thread
	static tryCurrent(
		write = false,
		exec) {
		let realm = this.getRealmSync()

		if (write) {
			if (realm.isInWriteTransaction) {
				return exec(realm)
			}

			return realm.write(() => {
				return exec(realm)
			})
		} else {
			return exec(realm)
		}
	}

	/// Execute a realm based function on a background thread
	static background(write = false, error = this.globalErrorHandler, exec) { //TODO:
		this.realmQueue.async(() => {
			/*autoreleasepool {*/
            this.current(write, error, exec);
        //})
		})
	}

	/// Execute a realm based function on the main thread (warning this blocks the UI)
	static main(write: boolean = false, error = this.globalErrorHandler, exec) {
		/*DispatchQueue.main.async {
        autoreleasepool {*/
		this.current(write, error, exec)
		//}
		//}
	}

	static write(rlm: Realm, exec) {
		try {
			let realm = rlm == undefined ? this.getRealmSync() : rlm!
			if (realm.isInWriteTransaction) {
				return exec();
			}

			return realm.write(() => exec())
		} catch (error) {
			debugHistory.warn(`${error}`)
		}
	}

	static globalErrorHandler(error) {
		debugHistory.error(`${error}`)
	}

	deleteDatabase(callback) {
		Authentication.authenticateOwnerByPasscode((error) => {
			if (error) {
				callback(`Unable to authenticate: ${error}`)
				return
			}

			/*try {
                let fileManager = FileManager.default
                let realmUrl = try getRealmURL()

                // Check if realm database exists
                if fileManager.fileExists(atPath: realmUrl.path) {
                    try fileManager.removeItem(at: realmUrl)
                }

                callback(nil)
            }
            catch {
                callback("Could not remove realm database: \(error)")
            }*/
		})
	}

	clean(callback) { //TODO:
		//#warning("@Toby, deleting here on realm doesnt remove them from the db and thus this is called every time. Any idea why?")
		/*DatabaseController.background(true, callback, (realm) => {
            for (itemType in ItemFamily.allCases) {
                if itemType == .typeUserState { continue }

                if let type = itemType.getType() as? Item.Type {
                    let items = realm.objects(type).filter("_action == nil and deleted = true")
                    for item in items {
    //                        item.allEdges.forEach { edge in
    //                            realm.delete(edge)
    //                        }
                    realm.delete(item.allEdges)
                    realm.delete(item)
                }
            }

                let edges = realm.objects(Edge.self).filter("_action == nil and deleted = true")
                for edge in edges {
                    realm.delete(edge)
                }
            }

            callback(nil)
        }*/
	}

}
