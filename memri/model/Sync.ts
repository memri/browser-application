//
// Sync.swift
// Copyright © 2020 memri. All rights reserved.

/// Based on a query, Sync checks whether it still has the latest version of the resulting Items. It does this asynchronous and in the
/// background, items are updated automatically.
import {Datasource} from "../../router";
import {Edge,AuditItem, getItemType, ItemFamily} from "../../router";
import {debugHistory} from "../../router";
import {CacheMemri} from "../../router";
import {DatabaseController, EdgeReference, ItemReference} from "../../router";

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
    }

    load() {
        // Periodically sync data from the pod
        // TODO:
        // Schedule syncing to the pod to see if (there are any jobs that remain
        this.schedule()

        // Run any priority syncs in the background
        this.prioritySyncAll()
    }

	/// Schedule a query to sync the resulting Items from the pod
	/// - Parameter datasource: QueryOptions used to perform the query
	async syncQuery(datasource: Datasource, auditable: boolean = true, callback?) {
		// TODO: if (this query was executed recently, considering postponing action
		try {
            let data = JSON.stringify({ // TODO: move this to Datasource
                query: datasource.query,
                sortProperty: datasource.sortProperty,
                sortAscending: datasource.sortAscending ?? false ? "true" : "false"
            })
            
            // Add to realm
			DatabaseController.asyncOnBackgroundThread(true, undefined,(realm) => {
                var safeRef: ItemReference
                if (auditable) {
                    // Store query in a log item
                    let audititem = new AuditItem()

                    audititem.uid = CacheMemri.incrementUID()
                    audititem.content = String(data) ?? ""
                    audititem.action = "query"
                    audititem.date = Date.now()

                    // Set syncstate to "fetch" in order to get priority treatment for querying
                    audititem._action = "fetch"
                    audititem._type = "AuditItem"

                    realm.add(audititem)
                    safeRef = new ItemReference(audititem);
                }
				// Execute query with priority
                this.prioritySync(datasource, () => {
                    if (auditable) {
                        // We no longer need to process this log item
                        DatabaseController.asyncOnBackgroundThread(true, undefined, () => {
                            safeRef.resolve()._action = undefined;
                        })
                    }

                    callback && callback()
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

	async prioritySync(datasource, callback?) {
		// Only execute queries once per session until we fix syncing
        
//        guard recentQueries[datasource.uniqueString] != true else {
//            return
//        }
        
        debugHistory.info(`Syncing from pod with query: ${datasource.query ?? ""}`)

        // Call out to the pod with the query
        await this.podAPI.query(datasource, true, (error, items) => {
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
                            let finalItem = CacheMemri.addToCache(item)
                            let file = finalItem;//TODO: check as File?
                            if (file instanceof File) {
                                file.queueForDownload()
                            }
                        } catch(error) {
                            debugHistory.error(`${error}`)
                        }
                    }

                    try {
                        // Update resultset with the new results
                         resultSet.reload()
                        this.cache.scheduleUIUpdate(); //TODO: for updating view after receiving data @mkslanc
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
	async schedule(long =  false) {
        let isLocalInstall = localStorage.getItem("isLocalInstall") == "true"; //TODO: added not to sync with missing pod
        if (isLocalInstall)
            return ;
        // Don't schedule when we are already scheduled
		if (this.scheduled == 0 || !long && this.scheduled == 2) {
			// Prevent multiple calls to the dispatch queue
            this.scheduled = long ? 2 : 1

			// Wait 100ms before syncing (should this be longer?)
			//DispatchQueue.main.asyncAfter(now() + (long ? 18000 : 0.1), () => {//TODO now()

            setTimeout(function() {
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
            }.bind(this), 2000);

			//}) //TODO:
		}
	}

	async syncToPod() {
		function markAsDone(list, callback) {
			DatabaseController.asyncOnBackgroundThread(true, callback,(realm) => {
				for (var sublist of list) {
					for (var item of sublist) {
                        let resolvedItem = (item instanceof ItemReference || item instanceof EdgeReference) && item.resolve()
						if (item instanceof ItemReference && resolvedItem) {
							if (resolvedItem._action == "delete") {
                                let file = resolvedItem; //TODO: as File?
                                if (file) {
                                    file.clearCache()
                                }

                                resolvedItem._action = undefined;
							}
							else {
								resolvedItem._action = undefined
								resolvedItem._updated = [];
							}
						} else if (item instanceof EdgeReference && resolvedItem) {
							if (resolvedItem._action == "delete") {
                                resolvedItem._action = undefined;
							}
							else {
								resolvedItem._action = undefined
								resolvedItem._updated = [];
							}
						}
					}
				}

                callback(undefined);
			})
		}
		
		/*if (this.syncing) { return }
        this.syncing = true*/

        await DatabaseController.asyncOnBackgroundThread(false, undefined, async (realm) => {
            var found = 0
            var itemQueue = {create: [], update: [], delete: []}
            var edgeQueue = {create: [], update: [], delete: []}

            // Items
            for (var itemType in ItemFamily) {

                let type = getItemType(itemType)?.constructor?.name;
                if (type) {
                    let items = realm.objects(itemType).filtered("_action != undefined")
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
            let edges = realm.objects("Edge").filtered("_action != undefined")
            for (var edge of edges) {
                let action = edge._action
                if (action && edgeQueue[action] != undefined) {
                    if (!edge.isValid())
                        continue //TODO: this is not working now @mkslanc
                    edgeQueue[action]?.push(edge)
                    found += 1
                }
            }

            let safeItemQueue = Object.entries(itemQueue).map((actionItem) =>
                actionItem[1].map((item) => new ItemReference(item))
            )

            let safeEdgeQueue = Object.entries(edgeQueue).map((edgeItem) =>
                edgeItem[1].map((item) => new EdgeReference(item))
            )

            if (found > 0) {
                debugHistory.info(`Syncing to pod with ${found} changes`)
                try {
                     await this.podAPI.sync(
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
                                // TODO: Items/Edges could have changed in the mean time, check dateModified/AuditItem`)
                                markAsDone(safeItemQueue, () => {
                                    markAsDone(safeEdgeQueue, () => {
                                        debugHistory.info("Syncing complete");
                                        this.cache.scheduleUIUpdate(); //TODO: ?

                                        // TODO: "Should this hold up further syncing?")
                                        this.syncFilesToPod(() => {
                                            this.syncing = false
                                            this.schedule(true);
                                        })
                                    })
                                });


                                this.schedule()
                            }
                    })
                } catch(error) {
                    debugHistory.error(`Could not sync to pod: ${error}`)
                }
            } else {
                this.syncFilesToPod(() => {
                    this.syncing = false;
                    this.schedule(true)
                });
            }
        })
	}

    syncFilesFromPod(callback) {
        DatabaseController.asyncOnBackgroundThread(false, undefined, (realm) => {
            var list = [];
            let items = realm.objects("LocalFileSyncQueue").filtered("task = 'upload'")
            items.forEach(($0) => {
                let s = $0["sha256"];
                if (typeof s == "string") {
                    list.push(s)
                }
            })

            if (list.length == 0) {
                callback(undefined) // done
                return
            }


            function validate(sha256: string) {
                return DatabaseController.sync(false, (realm) => {
                    let file = realm.objects("File").filtered(`sha256 = '${sha256}'`)[0];
                    if (!file || file._action == "create" || file._updated.includes("sha256")) {
                        return false
                    }
                    return true
                }) ?? true
            }

            var i = -1

            function next() {
                i += 1
                let sha256 = list[i];
                if (!sha256) {
                    callback(undefined) // done
                    return
                }

                if (validate(sha256)) {
                    this.podAPI.downloadFile(sha256, (error, progress, response) => {
                        if (error) {
                            debugHistory.warn(`${error}`) // TODO ERror handling
                            callback(error)
                        } else if (progress) {
                            console.log(`Download progress ${progress}`)
                        } else if (response) {
                            this.LocalFileSyncQueue.remove(sha256) //TODO:
                            next()
                        } else {
                            debugHistory.warn("Unknown error") // TODO ERror handling
                            callback(error)
                        }
                    })
                    return
                } else {
                    this.LocalFileSyncQueue.remove(sha256) //TODO:
                    next()
                }
            }

            next()
        })
    }

    syncFilesToPod(callback) {
        DatabaseController.asyncOnBackgroundThread(false, undefined, (realm) => {
            let items = realm.objects("LocalFileSyncQueue").filtered("task = 'upload'")
            for (let item of items) {
                let itemSha256 = item.sha256
                this.podAPI.uploadFile(item.fileUUID, (error, progress, response) => {
                    if (error) {
                        debugHistory.warn(`${error}`) // TODO ERror handling
                        callback(error)
                    } else if (progress) {
                        console.log(`UploadFile progress ${progress}`)
                    } else if (response) {
                        this.LocalFileSyncQueue.remove(itemSha256) //TODO:
                    } else {
                        debugHistory.warn("Unknown error") // TODO ERror handling
                        callback(error)
                    }
                })

            }
        })
    }

    //TODO: This is terribly brittle, we'll need to completely rearchitect syncing
    async syncAllFromPod(callback) {
        await this.syncQuery(new Datasource("CVUStoredDefinition"), false, () => {
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
