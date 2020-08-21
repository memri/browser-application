//
//  Sync.swift
//  memri
//
//  Created by Ruben Daniels on 4/3/20.
//  Copyright © 2020 memri. All rights reserved.
//

///// This class represent the state of syncing for a Item, it keeps tracks of the multiple versions of a Item on the server and
///// what actions are needed to sync the Item with the latest version on the pod
// class SyncState extends Object, Codable {
//	// Whether the data item is loaded partially and requires a full load
//	@objc dynamic var isPartiallyLoaded: Bool = false
//
//	// What action is needed on this data item to sync with the pod
//	// Enum: "create", "delete", "update"
//	@objc dynamic var actionNeeded: String = ""
//
//	// Which fields to update
//	let updatedFields = List<String>()
//
//	//
//	@objc dynamic var changedInThisSession = false
//
//	required convenience init(from decoder: Decoder)  {
//		self.init()
//
//		jsonErrorHandling(decoder) {
//			isPartiallyLoaded =  decoder.decodeIfPresent("isPartiallyLoaded") ?? isPartiallyLoaded
//		}
//	}
//
//	required init() {
//		super.init()
//	}
// }

/// Based on a query, Sync checks whether it still has the latest version of the resulting Items. It does this asynchronous and in the
/// background, items are updated automatically.
import {Datasource} from "../api/Datasource";
import {Edge,AuditItem, getItemType, ItemFamily} from "./items/Item";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {CacheMemri} from "./Cache";
import {DatabaseController, ItemReference} from "../storage/DatabaseController";

export class Sync {
	/// PodAPI Object to use for executing queries
	podAPI: PodAPI
	/// Cache Object used to fetch resultsets
	cache?: CacheMemri
    

	scheduled = 0
	syncing = false
	backgroundSyncing = false

	recentQueries = {}

	/// Initialization of the cache
	/// - Parameters:
	///   - api: api Object
	///   - rlm: local Realm database object
	constructor(api: PodAPI) {
		this.podAPI = api

		// Periodically sync data from the pod
		// TODO:

		// Schedule syncing to the pod to see if (there are any jobs that remain
		this.schedule()

		// Run any priority syncs in the background
        this.prioritySyncAll()
	}

	/// Schedule a query to sync the resulting Items from the pod
	/// - Parameter datasource: QueryOptions used to perform the query
	syncQuery(datasource: Datasource, auditable: boolean = true, callback?) {
		// TODO: if (this query was executed recently, considering postponing action
		try {
            let data = JSON.stringify({ // TODO: move this to Datasource
                query: datasource.query,
                sortProperty: datasource.sortProperty,
                sortAscending: datasource.sortAscending ?? false ? "true" : "false"
            })
            
            // Add to realm
			DatabaseController.writeAsync((realm) => {
                var safeRef: ItemReference
                if (auditable) {
                    // Store query in a log item
                    let audititem = new AuditItem()

                    audititem.uid = CacheMemri.incrementUID()
                    audititem.content = String(data) ?? ""
                    audititem.action = "query"
                    audititem.date = new Date()

                    // Set syncstate to "fetch" in order to get priority treatment for querying
                    audititem._action = "fetch"

                    realm.add(audititem)
                    safeRef = new ItemReference(audititem);
                }
				// Execute query with priority
                this.prioritySync(datasource, () => {
                    if (auditable) {
                        // We no longer need to process this log item
                        DatabaseController.writeAsync(() => {
                            safeRef?.resolve()?._action = undefined;
                        })
                    }

                    callback()
                })
			})
			
		} catch(error) {
			console.log(`syncQuery failed: ${error}`)
		}
	}

	clearSyncCache() {
		this.recentQueries = {}
	}

	prioritySyncAll() {
		//
		if (!this.backgroundSyncing) {
			//
            this.backgroundSyncing = true

			// TODO: make async in order to not hurt init when cache is not set

			// Execute query objects
			//            prioritySync()

			//
            this.backgroundSyncing = false
		}
	}

	prioritySync(datasource, callback?) {
		// Only execute queries once per session until we fix syncing
        
//        guard recentQueries[datasource.uniqueString] != true else {
//            return
//        }
        
        debugHistory.info(`Syncing from pod with query: ${datasource.query ?? ""}`)

        // Call out to the pod with the query
        this.podAPI.query(datasource, (error, items) => {
            if (items) {
                let cache = this.cache
                if (cache) {
                    this.recentQueries[datasource.uniqueString] = true

                    // Find resultset that belongs to this query
                    let resultSet = cache.getResultSet(datasource)
                    //                    if (resultSet.length == 1) { return }

                    for (var item of items) {
                        // TODO: handle sync errors
                        try {
                            CacheMemri.addToCache(item)
                        } catch(error) {
                            debugHistory.error(`${error}`)
                        }
                    }

                    try {
                        // Update resultset with the new results
                         resultSet.reload()
                    } catch(error) {
                        debugHistory.error(`${error}`)
                    }

                    callback && callback();
                }
            } else {
                // Ignore errors (we'll retry next time)
                // TODO: consider resorting so that it is not retried too often
            }
        })
	}

	/// Schedule a syncing round
	/// - Remark: currently calls mock code
	schedule(long =  false) {
		// Don't schedule when we are already scheduled
		if (this.scheduled == 0 || !long && this.scheduled == 2) {
			// Prevent multiple calls to the dispatch queue
            this.scheduled = long ? 2 : 1

			// Wait 100ms before syncing (should this be longer?)
			/*DispatchQueue.main.asyncAfter(now() + (long ? 18000 : 0.1), () => {//TODO now()
				if (this.syncing) {
                    this.scheduled = 0
                    this.schedule()
					return
				}

				// Reset scheduled
                this.scheduled = 0

				// Start syncing local data to the pod
				 this.syncing = true
                this.syncToPod()
			})*/ //TODO:
		}
	}

	syncToPod() {
		function markAsDone(list, callback) {
			DatabaseController.writeAsync((realm) => {
				for (var sublist of list) {
					for (var item of sublist) {
                        let resolvedItem = (item?.constructor?.name == "ItemReference" || item?.constructor?.name == "EdgeReference") && item.resolve()
						if (item?.constructor?.name == "ItemReference" && resolvedItem) {
							if (resolvedItem._action == "delete") {
								realm.delete(resolvedItem)
							}
							else {
								resolvedItem._action = ""
								resolvedItem._updated.removeAll()
							}
						} else if (item?.constructor?.name == "EdgeReference" && resolvedItem) {
							if (resolvedItem._action == "delete") {
								realm.delete(resolvedItem)
							}
							else {
								resolvedItem._action = ""
								resolvedItem._updated.removeAll()
							}
						}
					}
				}

                callback();
			})
		}
		
		if (this.syncing) { return }
        this.syncing = true
        
        DatabaseController.read((realm) => {
            var found = 0
            var itemQueue = {create: [], update: [], delete: []}
            var edgeQueue = {create: [], update: [], delete: []}

            // Items
            for (var itemType in ItemFamily) {
                if (itemType == ItemFamily.UserState) { continue }

                let type = getItemType(itemType)?.constructor?.name;
                if (type) {
                    let items = realm.objects(type).filtered((_action) => _action != undefined) //TODO:
                    for (var item of items) {
                        let action = item._action
                        if (action && itemQueue[action] != undefined && item.uid > 0) {
                            itemQueue[action]?.push(item)
                            found += 1
                        }
                    }
                }
            }

            // Edges
            let edges = realm.objects("Edge").filtered((_action) => _action != undefined) //TODO
            for (var edge of edges) {
                let action = edge._action
                if (action && edgeQueue[action] != undefined) {
                    edgeQueue[action]?.push(edge)
                    found += 1
                }
            }

            let safeItemQueue = Object.entries(itemQueue).map((actionItem) => {
                actionItem[1].map ((item) => new ItemReference(item) )
            })

            let safeEdgeQueue = Object.entries(edgeQueue).map((edgeItem) => {
                edgeItem[1].map ((item) => new EdgeReference(item) )
            })

            if (found > 0) {
                debugHistory.info(`Syncing to pod with ${found} changes`)
                try {
                     this.podAPI.sync(
                         itemQueue["create"],
                         itemQueue["update"],
                         itemQueue["delete"],
                         edgeQueue["create"],
                         edgeQueue["update"],
                         edgeQueue["delete"],
                         (error) => {
                            if (error) {
                                debugHistory.error(`Could not sync to pod: ${error}`)
                                this.syncing = false;
                                this.schedule(true)
                            }
                            else {
                                // #warning(`Items/Edges could have changed in the mean time, check dateModified/AuditItem`)
                                markAsDone(safeItemQueue, ()=>{
                                    markAsDone(safeEdgeQueue, ()=>{
                                        debugHistory.info("Syncing complete")

                                        this.syncing = false
                                        this.schedule()
                                    })
                                });


                                this.schedule()
                            }
                    })
                } catch(error) {
                    debugHistory.error(`Could not sync to pod: ${error}`)
                }
            } else {
                this.syncing = false;
                this.schedule(true)
            }
        })
	}

    //#warning("This is terribly brittle, we'll need to completely rearchitect syncing next week")
    syncAllFromPod(callback) {
        this.syncQuery(new Datasource("CVUStoredDefinition"), false, () => {
            this.syncQuery(new Datasource("CVUStateDefinition"), false, () => {
                this.syncQuery(new Datasource("Country"), false, () => {
                    this.syncQuery(new Datasource("Setting"), false, () => {
                        this.syncQuery(new Datasource("NavigationItem"), false, () => {
                            callback()
                        })
                    })
                })
            })
        })
    }


	syncFromPod() {
		// TODO:
	}

//	/// - Remark: Currently unused
//	/// - TODO: Implement and document
//	/// - Parameters:
//	///   - item:
//	///   - callback:
//	/// - Throws:
//	function execute(item, callback, success) {
//		if (let syncState = item.syncState) {
//			switch syncState.actionNeeded {
//			case "create", "delete", "update":
//				try podAPI.sync(item) { (error, _) -> Void in
//					if (error != nil) { return callback(error, false) }
//				}
//			case "fetch":
//				// TODO:
//				break
//			default:
//				// Ignore unknown tasks
//				print("Unknown sync state action: \(item.syncState?.actionNeeded ?? "")")
//			}
//		} else {
//			throw "No syncState defined"
//		}
//	}
}
