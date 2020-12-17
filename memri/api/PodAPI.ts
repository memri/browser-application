import {Settings} from "../../router"
import {debugHistory} from "../../router";
import {Authentication} from "../../router";
import {getItemType, SchemaItem} from "../../router";
import {mockApi} from "../../playground/mockApi";


export class PodAPI {
    key;
    host?: string
    username?: string
    password?: string

    get isConfigured(): boolean {
        return (this.host ?? Settings.shared.get("user/pod/host")) != ""
    }

    constructor(podkey, mockApi?) {
        this.key = podkey
        this.mockApi = mockApi
    }
    
    async http({method = "POST", path = "", payload}, callback) {
        await Authentication.getOwnerAndDBKey((error, ownerKey, databaseKey) => {
            if (ownerKey == undefined || databaseKey == undefined) {
                // TODO:
                callback(error, null)
                return
            }
            this.httpWithKeys({method, path, payload, ownerKey, databaseKey}, callback);
        });
    } 
    
    async httpWithKeys({method = "POST", path = "", payload, ownerKey, databaseKey}, callback) {
        let settings = new Settings()
        let podhost = this.host ?? settings.getString("user/pod/host")
        if (podhost == "mock" || podhost == "" || podhost == "http://localhost:3030") { //TODO: change it
            let body = JSON.stringify(payload);
            if (!this.mockApi)
                this.mockApi = new mockApi();
            return this.mockApi.http({method, path, body}, callback);
        }
        
        if (podhost && !/^http/.test(podhost)) podhost = "http://" + podhost;

        var url = new URL(podhost)
        if (!url) {
            let message = `Invalid pod host set in settings: ${podhost}`
            callback(message, null)
            return
        }

        url.pathname += `v2/${ownerKey}/${path}`
        
        let headers = {
            "Content-Type": "application/json"
        };
        let body = JSON.stringify({ databaseKey, payload });
        
        var result, error
        try {
            result = await fetch(url, {
                method,
                headers,
                body,
            })
            result = await result.json()
        } catch(e) {
            error = e;
        }
        callback && callback(error, result);
    }
    
    /*getArray(item, prop) {
        let className = item.objectSchema[prop]?.objectClassName
        
        if (className == "Edge") {
            var result = []
            let list = item[prop]
            if (list?.constructor?.name == "Array" && list[0]?.constructor?.name == "Edge") {
                for (let edge of list) {
                    let d = getDataItem(edge)
                    if (d) {
                        result.push(d)
                    }

                }
                
                return result
            }
            else {
                // TODO error
                return []
            }
        }
        else if (className == "DataItem") {
            // Unsupported
            return []
        }
        else {
            return dataItemListToArray(item[prop])
        }
    }*/
    
    /*MAXDEPTH = 2;
    recursiveSearch(item, removeUID = false) {
		if (item.syncState?.actionNeeded === null) { throw new Error("No action required") }

		var createItems = []
		var updateItems = []
		var deleteItems = []
		var createEdges = []
		var updateEdges = []
		var deleteEdges = []

		function recurEdge(edge, forceInclude = false) {
			let a = edge.syncState?.actionNeeded
			if (a == null && !forceInclude) { return }
            let action = a
            if (!action) return

			var result = {}

			let properties = item.objectSchema.properties
			for (var prop of properties) {
				if (prop.name == "syncState" || prop.name == "deleted"
					|| prop.name == "targetItemType" || prop.name == "targetItemID"
					|| prop.name == "sourceItemType" || prop.name == "sourceItemID") {
					// Ignore
				} else {
					result[prop.name] = edge[prop.name]
				}
			}

            let tgt = edge.item()
			if (tgt) {
				recur(tgt)
				result["_source"] = edge.sourceItemID
				result["_target"] = edge.targetItemID
			} else {
				// Database is corrupt
                debugHistory.warn("Database corruption; edge to nowhere")
			}

			switch (action) {
                case "create": createEdges.push(result); break
                case "update": updateEdges.push(result); break
                case "delete": deleteEdges.push(result); break
                default: throw new Error("Unexpected action")
			}
		}

		function recur(item, forceInclude = false) {
			let a = item.syncState?.actionNeeded
			if (a == undefined && !forceInclude) { return }
            let action = a
			if (!action) { return }

			let updatedFields = item.syncState?.updatedFields
			var result = {
                _type: item.genericType,
            }

			let properties = item.objectSchema.properties
			for (var prop of properties) {
				if (prop.name == "syncState" || prop.name == "deleted") {
					// Ignore
				} else if (prop.name == "allEdges") {
					for (var edge of item.allEdges) {
						recurEdge(edge, action == "create")
					}
				} else if (updatedFields == null || updatedFields?.includes(prop.name)) {
					if (prop.type == ".object") {//TODO
						throw new Error("Unexpected object schema")
					} else {
						result[prop.name] = item[prop.name]
					}
				}
			}

			switch (action) {
                case "create": createItems.push(result); break
                case "update": updateItems.push(result); break
                case "delete": deleteItems.push(result); break
                default: throw new Error("Unexpected action")
			}
		}

		// TODO: refactor: error handling
        try {
			recur(item)

			var result = {}
			if (createItems.length > 0) { result["createItems"] = createItems }
			if (updateItems.length > 0) { result["updateItems"] = updateItems }
			if (deleteItems.length > 0) { result["deleteItems"] = deleteItems }
			if (createEdges.length > 0) { result["createEdges"] = createEdges }
			if (updateEdges.length > 0) { result["updateEdges"] = updateEdges }
			if (deleteEdges.length > 0) { result["deleteEdges"] = deleteEdges }

			return result
		} catch (error) {
            debugHistory.error(`Exception while communicating with the pod: ${error}`)//TODO
			return {}
		}
	}*/

	toJSON(result) {
		return JSON.stringify(result)
	}

    simplify(item: SchemaItem | Edge, create = false) {
        if (item instanceof SchemaItem) {
            let updatedFields = item._updated
            var result = {
                "_type": item.genericType,
                "uid": item.uid
            }
            let properties = Object.keys(item)
            //let properties = item.objectSchema.properties
            let exclude = [
                "_updated", "_action", "_partial", "_changedInSession", "deleted", "allEdges", "uid",
            ]
            for (var prop of properties) {
                if (exclude.includes(prop)) {
                    // Ignore
                } else if (create || updatedFields?.includes(prop)) {
                    if (prop/*.type*/ == ".object") {//TODO
                        debugHistory.warn("Unexpected object schema")
                    } /*else if prop.type == .date, let date = item[prop.name] as? Date { //TODO:
                        result[prop.name] = Int(date.timeIntervalSince1970 * 1000)
                    }*/ else {
                        result[prop] = item[prop]
                    }
                }
            }
            if (typeof result["uid"] != "number") {
                debugHistory.warn(`Exception: Item does not have uid set: ${item}`);
                return
            }
            return result
        } else {
            var result = {}

            let properties = Object.keys(item)
            //let properties = item.objectSchema.properties;
            let exclude = [
                "version", "deleted", "targetItemType", "targetItemID", "sourceItemType",
                "sourceItemID", "_updated", "_action", "_partial", "_changedInSession",
            ]
            for (var prop of properties) {
                if (exclude.includes(prop)) {
                    // Ignore
                } else if (prop == "type") {
                    result["_type"] = item[prop]
                } else {
                    // TODO: Implement checking for updatedfields
                    result[prop] = item[prop]
                }
            }

            if (item.target()) {
                result["_source"] = item.sourceItemID
                result["_target"] = item.targetItemID
            } else {
                // Database is corrupt
                debugHistory.warn("Database corruption; edge to nowhere")
            }

            if (result["_source"] == undefined || result["_target"] == undefined) {
                debugHistory.warn(`Exception: Edge is not properly formed: ${item}`)
                return
            }

            return result
        }
    }

    /// Retrieves a single data item from the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to retrieve
    ///   - callback: Function that is called when the task is completed either with a result, or an error
    /// - Remark: Note that it is not necessary to specify the type here as the pod has a global namespace for uids
    async get(uid, callback) {

        await this.http({method: "POST", path: `item_with_edges/${uid}`}, function (error, data) {

            if (data) {
                // TODO Refactor: Error handling
                let result = /*MemriJSONDecoder.decode(DataItemFamily.self, data)*/ JSON.parse(data) //TODO

                callback(null, result[0])
            } else {
                callback(error, null)
            }
        })
    }


	async sync(createItems?,
         updateItems?,
         deleteItems?,
         createEdges?,
         updateEdges?,
         deleteEdges?,
         callback?) {
		var result = {}//TODO: i muted AuditItem creating from local pod due to not unique uid @mkslanc
		if (createItems?.length ?? 0 > 0) { result["createItems"] = createItems?.map (function(item){ return this.simplify(item, true) }.bind(this)).filter(el => el != undefined && el["_type"] != "AuditItem") }
		if (updateItems?.length ?? 0 > 0) { result["updateItems"] = updateItems?.map (function(item){ return this.simplify(item) }.bind(this)).filter(el => el != undefined) }
		if (deleteItems?.length ?? 0 > 0) { result["deleteItems"] = deleteItems?.map (function(item){ return this.simplify(item) }.bind(this)) }
		if (createEdges?.length ?? 0 > 0) { result["createEdges"] = createEdges?.map (function(item){ return this.simplify(item, true) }.bind(this)).filter(el => el != undefined) }
		if (updateEdges?.length ?? 0 > 0) { result["updateEdges"] = updateEdges?.map (function(item){ return this.simplify(item) }.bind(this)).filter(el => el != undefined) }
		if (deleteEdges?.length ?? 0 > 0) { result["deleteEdges"] = deleteEdges?.map (function(item){ return this.simplify(item) }.bind(this)).filter(el => el != undefined) }


        await this.http({method: "POST", path: "bulk_action", payload: result}, function (error) {
            callback(error)
        })
	}

	//TODO: downloadFile

    //TODO: uploadFile

    /// Create a data item and return the new uid for that data item
    /// - Parameters:
    ///   - item: The data item to create on the pod
    ///   - callback: Function that is called when the task is completed either with the new uid, or an error
    create(item, callback) {
    
        this.http({path: "create_item", payload: item}, function(error, data) {
            callback(error, data)
        })
    }
    
    /// Updates a data item and returns the new version number
    /// - Parameters:
    ///   - item: The data item to update on the pod
    ///   - callback: Function that is called when the task is completed either with the new version number, or an error
    update(item, callback) {
        this.http({path: `update_item`, payload: item}, function(error, data) {
            callback(error, data)
        })
    }
    
    /// Marks a data item as deleted on the pod.
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    /// - Remark: Note that data items that are marked as deleted are by default not returned when querying
    remove(memriID, callback) {
        this.http({ path: "delete_item", payload: memriID}, function(error, data) {
            callback(error, data)
        })
    }
    
    /// Queries the database for a subset of DataItems and returns a list of DataItems
    /// - Parameters:
    ///   - queryOptions: Object describing what to query and how to return the results
    ///   - callback: Function that is called when the task is completed either with the results, or  an error
    /// - Remark: The query language is a WIP
    async query(queryOptions, withEdges = true, callback) {

        // TODO Can no longer detect whether the data item is synced
//        if (queryOptions.query!.test(#"^-\d+"#)) { // test for uid that is negative
//            callback("nothing to do", nil)
//            return
//        }

        var payload  = {}

        let query = queryOptions.query ?? ""
        let matches = query.match(/^(\w+) AND uid = '(.+)'$/)

        if (matches) {
            let type = matches[1]
            let uid = matches[2]

            if (typeof uid != "number")
                callback("Invalid UID (not an integer)", null)

            payload._type = type
            payload.uid = uid
        } else {
            let type = query.match(/^(\w+)$/)//TODO
            if (type && type[1]) {
                payload._type = type[1]
            } else {
                callback("Not implemented yet", null)
                return
            }
        }

        await this.http({ path: "search_by_fields", payload: payload }, function (error, data) {
            if (error) {
                debugHistory.error(`Could not connect to pod: \n${error}`)
                callback(error, null)
            } else {
                //callback(null, data)
                //todo handle edges
                if (data) {
                    try {
                        let items = data.map((el)=>new (getItemType(el["_type"]))(el));
                        if (items) {
                            if (withEdges) {
                                let payload = items.map(($0) => $0.uid);
                                this.http({method: "POST", path: "get_items_with_edges", payload: payload}, function (error, data) {
                                    try {
                                        if (error) {
                                            debugHistory.error(`Could not connect to pod: \n${error}`)
                                            callback(error, null);
                                        } else if (data) {
                                            var items2;
                                            //try JSONErrorReporter {
                                            items2 = data.map((el)=>new (getItemType(el["_type"]))(el));
                                            //}

                                            callback(null, items2)
                                        }
                                    } catch (error) {
                                        debugHistory.error(`Could not connect to pod: \n${error}`)
                                        callback(error, null)
                                    }
                                })
                            } else {
                                callback(null, items)
                            }
                        } else {
                            callback(null, null)
                            return
                        }
                    } catch (error) {
                        debugHistory.error(`Could not connect to pod: \n${error}`)
                        callback(error, null)
                    }
                }
            }
        }.bind(this))
        
    }


    /// Runs an importer on the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    async runImporter(uid, callback) {
        await Authentication.getOwnerAndDBKey((error, ownerKey, dbKey) => {
            if (!ownerKey || !dbKey) {
                // TODO
                callback(error, false)
                return
            }
            var payload = {};

            payload["uid"] = uid

            payload["servicePayload"] = {
                "databaseKey": dbKey,
                "ownerKey": ownerKey
            }

            this.http({method: "POST", path: "run_importer", payload: payload}, (error, result) => {
                callback(error, error == null)
            })
        })
    }

    /// Runs an indexer on the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    async runIndexer(uid, callback) {
        await Authentication.getOwnerAndDBKey((error, ownerKey, dbKey)=> {
            if (!ownerKey || !dbKey) {
                // TODO
                callback(error, false)
                return
            }
            var payload = {};

            payload["uid"] = uid

            payload["servicePayload"] = {
                "databaseKey": dbKey,
                "ownerKey": ownerKey
            }
            this.http({method: "POST", path: "run_indexer", payload: payload}, (error) => {
                callback(error, error == null)
            })
        })
    }

}
