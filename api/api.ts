import {settings} from "../model/Settings"
import {SchemaItem} from "../model/items/Item";
import {debugHistory} from "../cvu/views/ViewDebugger";

export class PodAPI {
    key;
     
    constructor(podkey, mockApi?) {
        this.key = podkey
        this.mockApi = mockApi
    }
    
    async http({method = "GET", path = "", body, data}, callback) {

        let podhost = settings.get("user/pod/host") || ""
        if (podhost == "mock") {
            return this.mockApi.http({method, path, body, data}, callback);
        }
        
        if (podhost && !/^http/.test(podhost)) podhost = "http://" + podhost;

        var url = new URL(podhost)
        if (!url) {
            let message = `Invalid pod host set in settings: ${podhost}`
            // console.error(message)
            callback(message, null)
            return
        }

        url.pathname += "v1/" + path
        
        let username = settings.get("user/pod/username");
        let password = settings.get("user/pod/password");
        
        let loginString = undefined;
        if (username && password) {
            loginString = btoa(`${username}:${password}`)
            loginString = `Basic ${loginString}`;
        }
        let headers = {
            "Content-Type": "application/json"
        }
        if (loginString)
            headers.Authorization = loginString
        
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
            if (list instanceof Array && list[0] instanceof Edge) {
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
    
    MAXDEPTH = 2;
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
	}

	toJSON(result) {
		return JSON.stringify(result)
	}

    simplify(item: SchemaItem | Edge, create = false) {
        if (item instanceof SchemaItem) {
            let updatedFields = item.syncState?.updatedFields
            var result = {
                "_type": item.genericType,
                "uid": item.uid
            }

            let properties = item.objectSchema.properties
            let exclude = ["syncState", "deleted", "allEdges", "uid"];
            for (var prop of properties) {
                if (exclude.includes(prop.name)) {
                    // Ignore
                } else if (create || updatedFields == undefined || updatedFields?.includes(prop.name)) {
                    if (prop.type == ".object") {//TODO
                        debugHistory.warn("Unexpected object schema")
                    } /*else if prop.type == .date, let date = item[prop.name] as? Date { //TODO:
                        result[prop.name] = Int(date.timeIntervalSince1970 * 1000)
                    }*/ else {
                        result[prop.name] = item[prop.name]
                    }
                }
            }
            if (typeof result["uid"] != "number") {
                throw `Exception: Item does not have uid set: ${item}`
            }
            return result
        } else {
            var result = {}

            let properties = item.objectSchema.properties;
            let exclude = ["version", "syncState", "deleted", "targetItemType", "targetItemID", "sourceItemType", "sourceItemID"]
            for (var prop of properties) {
                if (exclude.includes(prop.name)) {
                    // Ignore
                } else if (prop.name == "type") {
                    result["_type"] = item[prop.name]
                } else {
                    //#warning("Implement checking for updatedfields")
                    result[prop.name] = item[prop.name]
                }
            }

            if (item.target()) {
                result["_source"] = item.sourceItemID
                result["_target"] = item.targetItemID
            } else {
                // Database is corrupt
                debugHistory.warn("Database corruption; edge to nowhere")
            }

            if (result["_source"] == undefined && result["_target"] == undefined) {
                console.log(result);
                throw `Exception: Edge is not properly formed: ${item}`
            }

            return result
        }
    }

    /// Retrieves a single data item from the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to retrieve
    ///   - callback: Function that is called when the task is completed either with a result, or an error
    /// - Remark: Note that it is not necessary to specify the type here as the pod has a global namespace for uids
    get(memriID, callback) {

        this.http({method: "POST", body: `items/${memriID}`}, function (error, data) {

            if (data) {
                // TODO Refactor: Error handling
                let result = /*MemriJSONDecoder.decode(DataItemFamily.self, data)*/ JSON.parse(data) //TODO

                callback(null, result[0])
            } else {
                callback(error, null)
            }
        })
    }

	sync1(item, callback) {
        this.http({method: "POST", path: "bulk_action", body: this.toJSON(this.recursiveSearch(item))}, function (error) {
            callback(error)
        })
	}

	sync(createItems?,
         updateItems?,
         deleteItems?,
         createEdges?,
         updateEdges?,
         deleteEdges?,
         callback?) {
		var result = {}
		if (createItems?.length ?? 0 > 0) { result["createItems"] = createItems?.map (function(item){ this.simplify(item, true) }.bind(this)) }
		if (updateItems?.length ?? 0 > 0) { result["updateItems"] = updateItems?.map (function(item){ this.simplify(item) }.bind(this)) }
		if (deleteItems?.length ?? 0 > 0) { result["deleteItems"] = deleteItems?.map (function(item){ this.simplify(item) }.bind(this)) }
		if (createEdges?.length ?? 0 > 0) { result["createEdges"] = createEdges?.map (function(item){ this.simplify(item, true) }.bind(this)) }
		if (updateEdges?.length ?? 0 > 0) { result["updateEdges"] = updateEdges?.map (function(item){ this.simplify(item) }.bind(this)) }
		if (deleteEdges?.length ?? 0 > 0) { result["deleteEdges"] = deleteEdges?.map (function(item){ this.simplify(item) }.bind(this)) }


        this.http({method: "POST", path: "bulk_action", body: this.toJSON(result)}, function (error) {
            callback(error)
        })
	}

    /// Create a data item and return the new uid for that data item
    /// - Parameters:
    ///   - item: The data item to create on the pod
    ///   - callback: Function that is called when the task is completed either with the new uid, or an error
    create(item, callback, uid) {
    
        this.http({method: "POST", path: "items", body: this.toJSON(item, true)}, function(error, data) {
            callback(error, data)
        })
    }
    
    /// Updates a data item and returns the new version number
    /// - Parameters:
    ///   - item: The data item to update on the pod
    ///   - callback: Function that is called when the task is completed either with the new version number, or an error
    update(item, callback, uid) {
        this.http({method: "PUT", path: `items/${item.uid}`, body: this.toJSON(item, true)}, function(error, data) {
            callback(error, data)
        })
    }
    
    /// Marks a data item as deleted on the pod.
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    /// - Remark: Note that data items that are marked as deleted are by default not returned when querying
    remove(memriID, callback, uid) {
        this.http({method: "DELETE", path: `items/${memriID}`}, function(error, data) {
            callback(error, data)
        })
    } 
    
    /// Queries the database for a subset of DataItems and returns a list of DataItems
    /// - Parameters:
    ///   - queryOptions: Object describing what to query and how to return the results
    ///   - callback: Function that is called when the task is completed either with the results, or  an error
    /// - Remark: The query language is a WIP
    query(queryOptions, callback) {

        // TODO Can no longer detect whether the data item is synced
//        if (queryOptions.query!.test(#"^-\d+"#)) { // test for uid that is negative
//            callback("nothing to do", nil)
//            return
//        }

        var data = null

        let query = queryOptions.query || ""
        let matches = query.match(/^(\w+) AND uid = '(.+)'$/)

        if (matches) {
            let type = matches[1]
            let uid = matches[2]

            data = `
            {
                "_type": "${type}",
                "uid": ${uid}
            }
            `/*.data(using: .utf8)*///TODO
        } else {
            let type = query.match(/^(\w+)$/)[1]//TODO
            if (type) {
                console.log(`Requesting query result of ${type}: ${queryOptions.query ?? ""}`)
                data = `
                {
                    "_type": "${type}"
                }
                `/*.data(.utf8)*///TODO
            } else {
                callback("Not implemented yet", null)
                return
            }
        }

        this.http({method: "POST", path: "search_by_fields", body: data}, function (error, items) {
            if (error) {
                console.error(`Could not load data from pod: \n${error}`)
                callback(error, null)
            } else {
                callback(null, items)
                // todo handle edges
                // if (items) {
                //     let uids = items.filter(function (item) {
                //         return item.uid;
                //     })
                //     let data2 = uids/*.description.data(using: .utf8)*/ //TODO:
                //     this.http({method: "POST", path: "items_with_edges", body: data2}, function (error, data) {
                //         try {
                //             if (error) {
                //                 debugHistory.error(`Could not connect to pod: \n${error}`)
                //                 callback(error, null);
                //             } else if (data) {
                //                 var items2;
                //                 //try JSONErrorReporter {
                //                 items2 = /*JSON.stringify(*/data//);
                //                 //}
                // 
                //                 callback(null, items2)
                //             }
                //         } catch (error) {
                //             debugHistory.error(`Could not connect to pod: \n${error}`)
                //             callback(error, null)
                //         }
                //     })
                // }
            }
        })
        
    }

    
    /// Runs an importer on the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    runImporterRun(uid, callback) {
        this.http({method: "PUT", path: `import/${uid}`}, function (error) {
            callback(error, error == null)
        })
    }

    /// Runs an indexer on the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    runIndexerRun(uid, callback) {
        this.http({method: "PUT", path: `index/${uid}`}, function (error) {
            callback(error, error == null)
        })
    }
    
    
    
//    queryNLP(query, callback, result) {}
//
//    queryDSL(query, callback, result) {}
//
//    queryRAW(query, callback, result) {}

//    import() {}
//    export() {}
//    sync() {}
//    index() {}
//    convert() {}
//    augment() {}
//    automate() {}
//
//    streamResource(URI, options, callback, stream) {}
}

/*
{
          item(func: eq(isPartiallyLoaded, true)) {
            uid
            ~syncState {
              expand(_all_) {
                uid
                name
                comment
                color
                isPartiallyLoaded
                version
              }
            }
          }
        }
        
        {
          get(func: type(note)) @filter(NOT anyofterms(title, "3") OR eq(starred, false)) @recurse {
            uid
            type : dgraph.type
            expand(note)
          }
        }
        This will give you the uid and type of both note node and the label nodes that are linked to it via labels edge, and all properties of note. If you want more properties of the linked label, you can either specify it e.g. name under expand(note) , or if you want all of them, do query like this:
        {
          get(func: type(note)) @filter(NOT anyofterms(title, "3") OR eq(starred, false)) @recurse {
            uid
            type : dgraph.type
            expand(_all_)
          }
        }
        @recurse(depth:2)
        
        
        {
          get(func: anyofterms(title, "5")) @recurse {
            uid
            type : dgraph.type
            expand(note)
          }
        }
        The expand() trick as I wrote in the last post also applies here, so if you want only uid and type of 2nd layer nodes, you use expand(note) (all properties of the 1st layer node). I give the result here:
        {
          "data": {
            "get": [
              {
                "uid": "0x2",
                "dgraph.type": [
                  "note"
                ],
                "title": "Shopping list 5",
                "content": "- tomatoes\n- icecream"
                "labels": [
                  {
                    "uid": "0x1",
                    "dgraph.type": [
                      "label"
                    ]
                  },
                  {
                    "uid": "0x6",
                    "dgraph.type": [
                      "label"
                    ]
                  }
                ]
              }
            ]
          },
            
            
            {
              item(func: anyofterms(name, "Home"))  {
                ~labels {
                  uid
                  dgraph.type
                  expand(note) {
                    uid
                }
                }
              }
            }
*/

