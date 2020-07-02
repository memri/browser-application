//
//  cache.swift
//  memri
//
//  Created by Ruben Daniels on 3/12/20.
//  Copyright © 2020 memri. All rights reserved.
//

var config = Realm.Configuration(
	// Set the new schema version. This must be greater than the previously used
	// version (if you've never set a schema version before, the version is 0).
	51,

	// Set the block which will be called automatically when opening a Realm with
	// a schema version lower than the one set above
	function (oldSchemaVersion) {
		// We haven’t migrated anything yet, so oldSchemaVersion == 0
		if (oldSchemaVersion < 2) {
			// Nothing to do!
			// Realm will automatically detect new properties and removed properties
			// And will update the schema on disk automatically
		}
	}
)

/// Computes the Realm database path at /home/<user>/realm.memri/memri.realm and creates the directory (realm.memri) if it does not exist.
/// - Returns: the computed database file path
var getRealmPath = function() {
	let homeDir = ProcessInfo.processInfo.environment["SIMULATOR_HOST_HOME"]
	if (homeDir) {
		let realmDir = homeDir + "/realm.memri"
		console.log(`REALM DIR: ${realmDir}`)
		try {
			  FileManager.default.createDirectory(
				realmDir, true, null)
		} catch(error) {
			console.log(error)
		}

		return realmDir + "/memri.realm"
	} else {
		throw "Could not get realm path"
	}
}

class CacheTODO {//TODO
	/// PodAPI object
	podAPI
	/// Object that schedules with the POD
	sync
	/// Realm Database object
	realm

	rlmTokens = []
	cancellables = []
	queryIndex = {}

	// TODO: document
	scheduleUIUpdate

	/// Starts the local realm database, which is created if it does not exist, sets the api and initializes the sync from them.
	/// - Parameter api: api object
	constructor(api) {
		// Tell Realm to use this new configuration object for the default Realm
		/*#if targetEnvironment(simulator)//TODO
			do {
				config.fileURL = URL(fileURLWithPath: try getRealmPath())
			} catch {
				// TODO: Error handling
				print("\(error)")
			}
		#endif*/

		Realm.Configuration.defaultConfiguration = config

		console.log(`Starting realm at ${String(Realm.Configuration.defaultConfiguration.fileURL)}`)//TODO

		// TODO: Error handling
		this.realm = new Realm()

		this.podAPI = api

		// Create scheduler objects
		this.sync = new Sync(this.podAPI, this.realm)
		this.sync.cache = this
	}

	/// gets default item from database, and adds them to realm
	install() {
		// Load default database from disk
		try {
			let jsonData = jsonDataFromFile("default_database")
			let items = MemriJSONDecoder.decode(DataItemFamily.constructor, jsonData)
			realmWriteIfAvailable(this.realm, function () {
				for (var item of items) {
					this.realm.add(item, .modified)
				}
			})
		} catch (error) {
			console.log(`Failed to Install: ${error}`)
		}
	}

	// TODO: Refactor: don't use async syntax when nothing is async
	query(datasource) {
		var error
		var items

		/*query(datasource) {//TODO
			error = $0
			items = $1
		}*/

		if (error) { throw error }

		return items ?? []
	}

	///  This function does two things 1) executes a query on the local realm database with given querOptions, and executes callback on the result.
	///  2) calls the syncer with the same datasource to execute the query on the pod.
	/// - Parameters:
	///   - datasource: datasource for the query, containing datatype(s), filters, sortInstructions etc.
	///   - callback: action exectued on the result
	query1(datasource, callback) {
		// Do nothing when the query is empty. Should not happen.
		let q = datasource.query ?? ""

		// Log to a maker user
		debugHistory.info(`Executing query ${q}`)

		if (q == "") {
			callback("Empty Query", null)
		} else {
			// Schedule the query to sync from the pod
			this.sync.syncQuery(datasource)

			// Parse query
			let [typeName, filter] = this.parseQuery(q)
			let type = new DataItemFamily(typeName)
			if (typeName == "*") {
				var returnValue = []

				for (var dtype of DataItemFamily.allCases) {
					// NOTE: Allowed forced cast
					let objects = this.realm.objects(dtype.getType())
						.filter("deleted = false " + (filter ?? ""))//TODO
					for (var item of objects) { returnValue.push(item) }
				}

				callback(null, returnValue)
			}
			// Fetch the type of the data item
			else if (type) {
				// Get primary key of data item
				// let primKey = type.getPrimaryKey()

				// Query based on a simple format:
				// Query format: <type><space><filter-text>
				let queryType = DataItemFamily.getType(type)
				//                let t = queryType() as! Object.Type

				var result = this.realm.objects(queryType())
					.filter("deleted = false " + (filter ?? ""))//TODO

				let sortProperty = datasource.sortProperty
				if (sortProperty && sortProperty != "") {
					result.sort(//TODO
						sortProperty,
						datasource.sortAscending.value ?? true
					)
				}

				// Construct return array
				var returnValue = []
				for (var item of result) {
					if (item instanceof DataItem) {
						returnValue.push(item)
					}
				}

				// Done
				callback(null, returnValue)
			} else {
				// Done
				callback(`Unknown type send by server: ${q}`, null)
			}
		}
	}

	/// Parses the query string, which whould be of format \<type\>\<space\>\<filter-text\>
	/// - Parameter query: query string
	/// - Returns: (type to query, filter to apply)
	parseQuery(query) {
		if (query.indexOf(" ") >= 0) {
			let splits = query.split(" ")
			let type = String(splits[0])
			return [type, String(splits.shift().join(" "))]
		} else {
			return [query, null]
		}
	}

	getResultSet(datasource) {
		// Create a unique key from query options
		let key = datasource.uniqueString

		// Look for a resultset based on the key
		let resultSet = this.queryIndex[key]
		if (resultSet) {
			// Return found resultset
			return resultSet
		} else {
			// Create new result set
			let resultSet = new ResultSet(this)

			// Store resultset in the lookup table
			this.queryIndex[key] = resultSet

			// Make sure the new resultset has the right query properties
			resultSet.datasource.query = datasource.query
			resultSet.datasource.sortProperty = datasource.sortProperty
			resultSet.datasource.sortAscending.value = datasource.sortAscending.value

			// Make sure the UI updates when the resultset updates
			this.cancellables.push(resultSet.objectWillChange.sink(function () {
				// TODO: Error handling
				this.scheduleUIUpdate(function (context) {//TODO
					this.context.cascadingView.resultSet.datasource == resultSet.datasource
				})
            }.bind(this)))

			return resultSet
		}
	}

	/// Adding an item to cache consist of 3 phases. 1) When the passed item already exists, it is merged with the existing item in the cache.
	/// If it does not exist, this method passes a new "create" action to the SyncState, which will generate a uid for this item. 2) the merged
	/// objects ia added to realm 3) We create bindings from the item with the syncstate which will trigger the syncstate to update when
	/// the the item changes
	/// - Parameter item:DataItem to be added
	/// - Throws: Sync conflict exception
	/// - Returns: cached dataItem
	addToCache(item) {
		try {
			let newerItem = this.mergeWithCache(item)
			if (newerItem) {
				return newerItem
			}

			// Add item to realm
			realm.write { realm.add(item, .modified) }//TODO
			if (item.syncState?.actionNeeded == "create") {
				this.sync.execute(item)
			}
		} catch {
			console.log(`Could not add to cache: ${error}`)
		}

		this.bindChangeListeners(item)

		return item
	}

	mergeWithCache(item) {
		// Check if this is a new item or an existing one
		let syncState = item.syncState
		if (syncState) {
			if (item.uid == 0) {
				// Schedule to be created on the pod
				realm.write {//TODO
					syncState.actionNeeded = "create"
					realm.add(AuditItem("create", [item]))
				}
			} else {
				// Fetch item from the cache to double check
				let cachedItem = getDataItem(item.genericType, item.memriID)//TODO
				if (cachedItem) {
					// Do nothing when the version is not higher then what we already have
					if (!syncState.isPartiallyLoaded &&
						item.version <= cachedItem.version) {
						return cachedItem
					}

					// Check if there are local changes
					if (syncState.actionNeeded != "") {
						// Try to merge without overwriting local changes
						if (!item.safeMerge(cachedItem)) {//TODO
							// Merging failed
							throw `Exception: Sync conflict with item.memriID ${cachedItem.memriID}`
						}
					}

					// If the item is partially loaded, then lets not overwrite the database
					if (syncState.isPartiallyLoaded) {
						// Merge in the properties from cachedItem that are not already set
						item.merge(cachedItem, true)//TODO
					}
				}
			}
			return null
		} else {
			console.log(`Error: no syncstate available during merge`)
			return null
		}
	}

	// TODO: does this work for subobjects?
	bindChangeListeners(item) {
		let syncState = item.syncState
		if (syncState) {
			// Update the sync state when the item changes
			this.rlmTokens.push(item.observes(function (objectChange) {//TODO
				let propChanges = objectChange//TODO
				if (propChanges) {
					if (syncState.actionNeeded == "") {
						function doAction() {
							// Mark item for updating
							syncState.actionNeeded = "update"
							syncState.changedInThisSession = true

							// Record which field was updated
							for (var prop of propChanges) {
								if (!syncState.updatedFields.includes(prop.name)) {
									syncState.updatedFields.push(prop.name)
								}
							}
						}

						realmWriteIfAvailable(this.realm) { doAction() }//TODO
					}
					this.scheduleUIUpdate(null)
				}
			}))


			// Trigger sync.schedule() when the SyncState changes
			// rlmTokens.append(syncState.observe { objectChange in
			// 	if case .change = objectChange {
			// 		if syncState.actionNeeded != "" {
			// 			self.sync.schedule()
			// 		}
			// 	}
            // })
		} else {
			console.log("Error, no syncState available for item")
		}
	}

	/// sets delete to true in the syncstate, for an array of items
	/// - Parameter item: item to be deleted
	/// - Remark: All methods and properties must throw when deleted = true;
	delete(item) {
		if (!item.deleted) {
			realmWriteIfAvailable(realm) {//TODO
				item.deleted = true
				item.syncState?.actionNeeded = "delete"
				realm.add(AuditItem("delete", [item]))
			}
		}
	}

	/// sets delete to true in the syncstate, for an array of items
	/// - Parameter items: items to be deleted
	delete1(items) {
		realmWriteIfAvailable(realm) {//TODO
			for (var item in items) {
				if (!item.deleted) {
					item.deleted = true
					item.setSyncStateActionNeeded("delete")
					realm.add(AuditItem("delete", [item]))
				}
			}
		}
	}

	/// - Parameter item: item to be duplicated
	/// - Remark:Does not copy the id property
	/// - Returns: copied item
	duplicate(item) {
		let cls = item.getType()
		if (cls) {
			let copy = item.getType()?.init()
			if (copy) {
				let primaryKey = cls.primaryKey()
				for (var prop of item.objectSchema.properties) {
					// TODO: allow generation of uid based on number replaces {uid}
					// if (item[prop.name] as! String).includes("{uid}")

					if (prop.name != primaryKey) {
						copy[prop.name] = item[prop.name]
					}
				}
				return copy
			}
		}

		throw `Exception: Could not copy ${item.genericType}`
	}
}
