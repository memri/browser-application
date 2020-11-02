//
//  DatabaseController.swift
//  memri
//
//  Created by Toby Brennan on 19/7/20.
//  Copyright © 2020 memri. All rights reserved.
//
import {debugHistory} from "../cvu/views/ViewDebugger";

//import * as path from "path";
import {Realm} from "../../router";
import {Authentication} from "../../router";
import {getItemType, ItemFamily} from "../../router";

export var realm;

export class ItemReference {
    uid: number
    type
    
    constructor (to: Item) {
		let uid = to.uid;
		let type = to.getType();
		if (!uid || !type /*|| to.realm == undefined*/) {
			console.log("Trying to get a reference to an item that is not in realm or has no uid");
			return
		}
        this.uid = uid
        this.type = type
    }

	resolve() {
		try {
			return DatabaseController.trySync(false,(realm) => {
				return realm.objectForPrimaryKey(this.type?.constructor?.name, this.uid)
			})
		} catch (e) {
			return;
		}
	}
}

export class EdgeReference {
    type: string
    sourceItemID: number
    targetItemID: number

	constructor (to: Edge) {
		let type = to.type;
		let targetItemID = to.targetItemID;
		let sourceItemID = to.sourceItemID;
		if (!type || !targetItemID || !sourceItemID) {
			throw "Trying to get a reference to an edge that is not in realm or has no uid"
		}
        this.type = type;
		this.sourceItemID = sourceItemID;
		this.targetItemID = targetItemID;
    }

	resolve() {
		try {
			return DatabaseController.trySync(false,(realm: Realm) => {
				return realm.objects("Edge")
					.filtered(`type = '${this.type}' AND sourceItemID = ${this.sourceItemID} AND targetItemID = ${this.targetItemID}`)[0]
			})
		} catch (e) {
			return
		}
	}
}

export class DatabaseController {
	static realmTesting = false

	constructor() {}

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
		//Authentication.getPublicRootKey((error, data) => {
			/*if (!data) {
				receiveRealm(error, undefined)
				return;
			}*/

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
				if (!realm) {
					realm = new Realm();
				}
				receiveRealm(undefined, realm)
			} catch (error) {
				// TODO error handling
				// Notify the user
				debugHistory.error(`${error}`)
				receiveRealm(error, undefined)
			}
		//})
	}
	/// This function returns a Realm for the current thread
	static getRealmSync() {
		//let data = Authentication.getPublicRootKeySync()
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

	static asyncOnCurrentThread(write = false, error, exec?) {
		if (error == undefined) { //TODO: made this not to use this.globalErrorHandler again and again @mkslanc
			error = this.globalErrorHandler;
		}
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
	}

	static sync(write = false, exec) {
		try {
			return this.trySync(write, exec);
		} catch (error) {
			debugHistory.warn(`${error}`)
			return;
		}
	}

	/// Execute a realm based function that throws and returns a value on the main thread
	static trySync(
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
	static asyncOnBackgroundThread(write = false, error, exec) {
		if (error == undefined) { //TODO: made this not to use this.globalErrorHandler again and again @mkslanc
			error = this.globalErrorHandler;
		}
		//this.realmQueue.async(() => {
			/*autoreleasepool {*/
            this.asyncOnCurrentThread(write, error, exec);
        //})
		//})
	}

	/// Execute a realm based function on the main thread (warning this blocks the UI)
	static asyncOnMainThread(write: boolean = false, error = this.globalErrorHandler, exec) {
		/*DispatchQueue.main.async {
        autoreleasepool {*/
		this.asyncOnCurrentThread(write, error, exec)
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

	static deleteDatabase(callback) {
		try {
			/*let fileManager = FileManager.default
            let realmUrl = this.getRealmURL()

            // Check if realm database exists
            if fileManager.fileExists(atPath: realmUrl.path) {
                try fileManager.removeItem(at: realmUrl)
            }*/

			callback(undefined)
		} catch (error) {
			callback(`Could not remove realm database: ${error}`)
		}

		//callback(undefined);
	}

	static clean(callback) { //TODO:
		//#warning("@Toby, deleting here on realm doesnt remove them from the db and thus this is called every time. Any idea why?")
		DatabaseController.asyncOnBackgroundThread(true, callback, (realm) => {
            for (let itemType in ItemFamily) {
				let type = getItemType(ItemFamily[itemType]);
                if (type) {
                    let items = realm.objects(type).filtered("_action = undefined and deleted = true")
                    for (let item of items) {
    //                        item.allEdges.forEach { edge in
    //                            realm.delete(edge)
    //                        }
                    //realm.delete(item.allEdges)
                    realm.delete(item)
                }
            }

                let edges = realm.objects("Edge").filtered("_action = undefined and deleted = true")
                for (let edge of edges) {
                    realm.delete(edge)
                }
            }

            callback(undefined)
        })

	}

}
