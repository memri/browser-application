//
//  cache.swift
//  memri
//
//  Created by Ruben Daniels on 3/12/20.
//  Copyright © 2020 memri. All rights reserved.
//
import * as DB from "./defaults/default_database.json";
import {getItem, serialize} from "../gui/util";

import {debugHistory} from "../cvu/views/ViewDebugger";
import {Item, Edge, getItemType, ItemFamily} from "./items/Item";
import {ResultSet} from "./ResultSet";
import {DatabaseController} from "./DatabaseController";
import {Realm} from "./RealmLocal";
import {Sync} from "./Sync";
export var cacheUIDCounter: number = -1

export class CacheMemri {
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
	constructor(api?) {
		if (api) {
			this.podAPI = api;

			// Create scheduler objects
			this.sync = new Sync(this.podAPI);
			this.sync.cache = this
		}
	}

	/// gets default item from database, and adds them to realm
	install(dbName: string) {
		let realm = DatabaseController.getRealm();
		// Load default database from disk
		try {
			//let jsonData = jsonDataFromFile(dbName)
			let dicts = DB;//require("text-loader!./defaults/default_database.json"); //MemriJSONDecoder(jsonData)
			dicts.forEach(function(x, i) {
				if (!x.uid)
					x.uid = (i + 1) + 1000000
				/*else
                    console.log(x.uid)*/
			})

			let items = new Map();
			var lut = {}

			function recur(dict) {
				var values = {}
				let type = dict["_type"];
				let itemType = getItemType(type);
				if (typeof type != "string" || !itemType) {
					throw "Exception: Unable to determine type for item"
				}

				for (let [key, value] of Object.entries(dict)) {
					if (key == "uid") {
						let uid = value;
						if (typeof uid === "number") {
							lut[uid] = CacheMemri.incrementUID();
							values["uid"] = lut[uid]
						} else if (dict["uid"] == undefined) {
							values["uid"] = CacheMemri.incrementUID()
						}
					} else if (key != "allEdges" && key != "_type") {
						// Special case for installing default settings
						if (type == "Setting" && key == "value") {
							values["json"] = serialize(value)
							continue
						}

						/*if (realm.schema[type][key]?.type == "date") {//TODO
							values[key] = new Date(
								Number((value ?? 0) / 1000))
						} else {*/
							values[key] = value
						//}
					}
				}

				let obj = CacheMemri.createItem(type, values);
				let item = obj, allEdges = dict["allEdges"]
				if (Array.isArray(allEdges)) {//TODO: isCvuObject?
					items.set(item, allEdges);
				}

				return obj
			}

			// First create all items
			for (let dict of dicts) {
				//if (typeof dict.value.isCVUObject =="function") {
					recur(dict)
				//}
			}

			// Then create all edges
			for (let [item, allEdges] of items) {
				for (let edgeDict of allEdges) {
					let edgeType = edgeDict["type"];
					if (typeof edgeType != "string") {
						throw "Exception: Ill defined edge"
					}

					var edge: Edge;
					let targetDict = edgeDict["target"];
					if (typeof targetDict == "object") {
						let target = recur(targetDict);
						edge = CacheMemri.createEdge(
							item,
							target,
							edgeType,
							String(edgeDict["edgeLabel"]),
							Number(edgeDict["sequence"])
						)
					} else {
						let itemType = edgeDict["itemType"];
						let _itemUID = edgeDict["uid"];
						let itemUID = lut[_itemUID];
						if (typeof itemType != "string" || typeof _itemUID != "number" || !itemUID) {
							throw `Exception: Ill defined edge: ${edgeDict}`
						}

						edge = CacheMemri.createEdge(
							item,
							[itemType, itemUID],
							edgeType,
							String(edgeDict["edgeLabel"]),
							Number(edgeDict["sequence"])
						)
					}

					DatabaseController.writeSync(() => {
						item.allEdges.push(edge)
					})
				}
			}

		} catch (error) {
			console.log(`Failed to Install: ${error}`)
		}
	}

	// TODO: Refactor: don't use async syntax when nothing is async
	/*query(datasource) {
		var error
		var items

		/!*query(datasource) {//TODO
			error = $0
			items = $1
		}*!/

		if (error) { throw error }

		return items ?? []
	}*/

	///  This function does two things 1) executes a query on the local realm database with given querOptions, and executes callback on the result.
	///  2) calls the syncer with the same datasource to execute the query on the pod.
	/// - Parameters:
	///   - datasource: datasource for the query, containing datatype(s), filters, sortInstructions etc.
	///   - callback: action exectued on the result
	query(datasource, syncWithRemote =true, callback?) {
		let realm = DatabaseController.getRealm()
		// Do nothing when the query is empty. Should not happen.
		let q = datasource.query ?? ""

		// Log to a maker user
		debugHistory.info(`Executing query ${q}`)

		if (q == "") {
			callback && callback("Empty Query", null)
		} else {
			// Schedule the query to sync from the pod
			//if (syncWithRemote) {this.sync.syncQuery(datasource)}

			// Parse query
			let [typeName, filter] = this.parseQuery(q)
			let type = ItemFamily["type"+typeName]
			if (typeName == "*") {
				var returnValue = []

				for (var dtype in ItemFamily) {
					// NOTE: Allowed forced cast
					let objects = realm.objects(getItemType(dtype)?.constructor?.name)
						.filtered("deleted = false " + (filter ?? "")) //TODO
					for (var item of objects) { returnValue.push(new Item(item)) }
				}

				callback && callback(null, returnValue)
			}
			// Fetch the type of the data item
			else if (type) {
				// Get primary key of data item
				// let primKey = type.getPrimaryKey()

				// Query based on a simple format:
				// Query format: <type><space><filter-text>
				let queryType = getItemType(type)?.constructor?.name
				//                let t = queryType() as! Object.Type

				var result = realm.objects(typeName)
					.filtered("deleted = false " + (filter ?? ""))

				let sortProperty = datasource.sortProperty
				if (sortProperty && sortProperty != "") {
					result.sorted(
						sortProperty,
						datasource.sortAscending ?? true
					)
				}

				// Construct return array
				var returnValue = []
				for (var item of result) {
					//if (item?.constructor?.name == "Item") {
						returnValue.push(new Item(item))
					//}
				}

				// Done
				callback && callback(null, returnValue)
			} else {
				// Done
				callback && callback(`Unknown type send by server: ${q}`, null)
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
			let resultSet = new ResultSet(this, datasource);

			// Store resultset in the lookup table
			this.queryIndex[key] = resultSet

			// Make sure the UI updates when the resultset updates
			// this.cancellables.push(resultSet.objectWillChange.sink(function () {
				// TODO: Error handling
				this.scheduleUIUpdate(function (context) {//TODO
					return context.cascadingView.resultSet.datasource == resultSet.datasource
				})
			// }.bind(this)))

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
	static addToCache(item) {
		if (!item.uid) {
			throw "Cannot add an item without uid to the cache"
		}

		try {
			let cachedItem = this.mergeWithCache(item)
			if (cachedItem) {
				return cachedItem
			}

			// Add item to realm
			DatabaseController.tryWriteSync((el) => { el.add(item, "modified") }) //TODO
		} catch (error) {
			console.log(`Could not add to cache: ${error}`)
		}

		//this.bindChangeListeners(item)

		return item
	}

	static mergeWithCache(item: Item) {
		let uid = item.uid
		if (!uid) {
			throw "Cannot add an item without uid to the cache"
		}

		// Check if this is a new item or an existing one
		let cachedItem: Item = getItem(item.genericType, uid);
		if (cachedItem) {
			if (item.version <= cachedItem.version && !cachedItem["_partial"]) {
				return cachedItem;
			}

			// Check if there are local changes
			if (cachedItem["_action"] != undefined) {
				// Try to merge without overwriting local changes
				if (!cachedItem.safeMerge(item)) {
					// Merging failed
					throw `Exception: Sync conflict with item ${item.genericType}:${cachedItem.uid ?? 0}`
				}
				return cachedItem
			}
			// Merge in the properties from cachedItem that are not already set
			cachedItem.merge(item)
		}
		return null
	}

	// TODO: does this work for subobjects?
	/*bindChangeListeners(item: Item) { //TODO???
		this.rlmTokens.push(item.observe((objectChange) => {
			if (item.change == objectChange) {//TODO
				if (item["_action"] == undefined) {
					function doAction() {
						// Mark item for updating
						item["_action"] = "update"
						item["_changedInSession"] = true

						// Record which field was updated
						for (let prop of propChanges) { //TODO
							if (!item["_updated"].includes(prop.name)) {
								item["_updated"].push(prop.name)
							}
						}
					}

					this.sync.schedule();
					DatabaseController.writeSync(() => { doAction() })
				}
				this.scheduleUIUpdate(null);
			}
		}))
	}
*/
	/// marks an item to be deleted
	/// - Parameter item: item to be deleted
	/// - Remark: All methods and properties must throw when deleted = true;
	/// marks a set of items to be deleted
	/// - Parameter items: items to be deleted
	delete(item: Item|Item[]) {
		if (!Array.isArray(item)) {
			if (!item.deleted) {
				DatabaseController.writeSync(() => {//TODO
					item.deleted = true
					item["_action"] = "delete";
					let auditItem = CacheMemri.createItem("AuditItem", {"action": "delete"})
					item.link(auditItem, "changelog");

					this.sync.schedule()
				})
			}
		} else {
			DatabaseController.writeSync(() => {//TODO
				for (let el of item) {
					if (!el.deleted) {
						el.deleted = true
						el["_action"] = "delete";
						let auditItem = CacheMemri.createItem("AuditItem", {"action": "delete"})
						el.link(auditItem, "changelog");
					}
				}
				this.sync.schedule()
			})
		}

	}

	/// - Parameter item: item to be duplicated
	/// - Remark:Does not copy the id property
	/// - Returns: copied item
	duplicate(item: Item) {
		let excludes = ["uid", "dateCreated", "dateAccessed", "dateModified", "starred",
			"deleted", "_updated", "_action", "_partial", "_changedInSession"]

		//#warning("Does not duplicate all edges")

		let itemType = item.getType()
		if (itemType) {
			var dict= {};

			for (var prop in item) {
				if (item.hasOwnProperty(prop)) {
					if (!excludes.includes(prop)) {
						dict[prop] = item[prop]
					}
				}
			}

			return CacheMemri.createItem(itemType, dict);
		}

		throw `Exception: Could not copy ${item.genericType}`
	}

	static getDeviceID() {
		return 1_000_000_000
	}

	static incrementUID() {
		DatabaseController.writeSync((realm: Realm) => {
			if (cacheUIDCounter == -1) {
				let setting = realm.objects("Setting").filtered(`key = '${this.getDeviceID()}/uid-counter'`)[0];
				if (setting && setting.json) {
					cacheUIDCounter = Number(setting.json);
				} else {
					cacheUIDCounter = this.getDeviceID() + 1

					// As an exception we are not using Cache.createItem here because it should
					// not be synced to the backend
					realm.create("Setting", {
						"uid": cacheUIDCounter - 1,
						"key": `${this.getDeviceID()}/uid-counter`,
						"_action": "create",
						"json": String(cacheUIDCounter),
					})
					return
				}
			}

			cacheUIDCounter += 1
			let setting = realm.objects("Setting").filtered(`key = '${this.getDeviceID()}/uid-counter'`)[0];
			if (setting) {
				setting.json = String(cacheUIDCounter);
				if (setting._action == undefined) {
					setting._action = "update"
					setting["_updated"] = ["json"]
				}
			}
		});
		return cacheUIDCounter
	}

	mergeFromCache(cachedItem: Item, newerItem: Item) {
		// Do nothing when the version is not higher then what we already have
		if (!newerItem["_partial"] && newerItem.version <= cachedItem.version) {
			return cachedItem
		}

		// Check if there are local changes
		if (newerItem["_action"] != undefined) {
			// Try to merge without overwriting local changes
			if (!newerItem.safeMerge(cachedItem)) {
				// Merging failed
				throw `Exception: Sync conflict with item.uid ${cachedItem.uid}`
			}
		}

		// If the item is partially loaded, then lets not overwrite the database
		if (newerItem["_partial"]) {
			// Merge in the properties from cachedItem that are not already set
			newerItem.merge(cachedItem, true)
		}

		return newerItem
	}

	//#warning("This doesnt trigger syncToPod()")
	static createItem(type, values = {}, unique?: string) {
		var item
		DatabaseController.tryWriteSync((realm: Realm) => {
			var dict = values

			// TODO:
			// Always merge
			var fromCache
			let uid = dict["uid"];
			if (unique) {
				// TODO: find item in DB & merge
				// Uniqueness based on also not primary key
				fromCache = realm.objects(type).filtered(unique)[0]
			} else if (uid) {
				// TODO: find item in DB & merge
				fromCache = realm.objectForPrimaryKey(type, uid)
			}

			if (fromCache) {
				// mergeFromCache(fromCache, ....)
				let properties = fromCache/*.objectSchema.properties*/;
				let excluded = ["uid", "dateCreated", "dateAccessed", "dateModified"]

				var fields = [];

				function setWhenChanged(name: string, value?) {
					let isEqualValue = (a, b) => {
						if (a == undefined) {
							return b == undefined
						} else if (a) {
							return a == b
						}
						else {
							debugHistory.warn("Unable to compare value: types do not mach")
							return false
						}
					};
					if (isEqualValue(fromCache[name], value)) {
						return;
					}
					fromCache[name] = value
					fields.push(name)
				}

				for (let prop in properties) {
					if (properties.hasOwnProperty(prop)) {
						if (!excluded.includes(properties[prop]) && dict[prop] != undefined) {
							setWhenChanged(prop, dict[prop])
						}
					}
				}
				if (fields.length > 0){
					fromCache.modified(fields)
				}
				fromCache["dateModified"] = new Date();

				if (item && item["_action"] != "create") {
					item["_action"] = "update"
				}

				if (item && type != "AuditItem") {
					let auditItem = CacheMemri.createItem("AuditItem", {"action": "update"})
					item.link(auditItem, "changelog")
				}

				item = fromCache
				return
			}

			if (dict["dateCreated"] == undefined) {
				dict["dateCreated"] = new Date()
			}
			if (dict["uid"] == undefined) {
				dict["uid"] = CacheMemri.incrementUID();
			}

            //console.log(`${type} - ${dict["uid"]}`)

			item = realm.create(type, dict);

			if (item) {
				item["_action"] = "create"
			}

			if (item && type != "AuditItem") {
				let auditItem = CacheMemri.createItem("AuditItem", {"action": "create"})
				item.link(auditItem, "changelog");
			}
		})

		return item ?? new Item()
	}

	static createEdge(source: Item, target: Object, edgeType: string,
			   label?: string, sequence?: number) {
		if (Array.isArray(target)) {
			var edge: Edge;
			DatabaseController.tryWriteSync((realm) => {
				// TODO:
				// Always overwrite (see also link())

				// TODO: find item in DB & merge
				// Uniqueness based on also not primary key

				let values = {
					"targetItemType": target[0],
					"targetItemID": target[1],
					"sourceItemType": source.genericType,
					"sourceItemID": source.uid,
					"type": edgeType,
					"edgeLabel": label,
					"sequence": sequence,
					"dateCreated": new Date(),
					"_action": "create"
				}

				edge = realm.create("Edge", values)
			});

			return edge ?? new Edge()
		} else {
			let targetUID = target["uid"];
			if (target["uid"] != undefined && typeof targetUID == "number") {

			} else {
				throw "Cannot link target, no .uid set"
			}

			return CacheMemri.createEdge(source, ["type" + target["_type"], targetUID],
				edgeType, label, sequence)
		}
	}
}