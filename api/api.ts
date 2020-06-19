
/// Provides functions to communicate asynchronously with a Pod (Personal Online Datastore) for storage of data and/or for
/// executing actions
class ClientError{
    private Int: any;
    String: any;
    type = "ClientError";

    constructor(Int, String) {
        this.Int = Int;
        this.String = String;
    }
}

/// Specifies used http methods
let HTTPMethod = {
    GET: "GET",
    POST: "POST",
    DELETE: "DELETE",
    PUT: "PUT"
};

class PodAPI {
    key;

    HTTPError = {ClientError};
    
    constructor(podkey) {
        this.key = podkey
    }
    
    http(method = HTTPMethod.GET, path = "", body = null, callback, data) {

        let session = new URLSession(.default, null, .main)//TODO
        let podhost = Settings.get("user/pod/host") || ""//TODO

        var baseUrl = URL(podhost)//TODO
        if (!baseUrl) {
            let message = `Invalid pod host set in settings: ${podhost}`
            // debugHistory.error(message)
            callback(message, null)
            return
        }

        baseUrl = baseUrl
            .appendingPathComponent("v1")
            .appendingPathComponent(path)
        
        // TODO when the backend sends the correct caching headers
        // this can be changed: .reloadIgnoringCacheData

        let username = Settings.get("user/pod/username");
        let password = Settings.get("user/pod/password");

        if (!username || !password) {
            console.log("ERROR: Could not find login credentials, so could not authenticate to pod")
            return
        }

        let loginString = `${username}:${password}`
        let loginData = loginString.data(String.Encoding.utf8)
        if (!loginData) {
            return
        }
        let base64LoginString = loginData.base64EncodedString()
        
        var urlRequest = new URLRequest(
            baseUrl,
            this.reloadIgnoringCacheData,
            this.greatestFiniteMagnitude)
        urlRequest.httpMethod = method
        urlRequest.addValue("application/json", "Content-Type")
        if (body) { urlRequest.httpBody = body }
        urlRequest.allowsCellularAccess = true
        urlRequest.allowsExpensiveNetworkAccess = true
        urlRequest.allowsConstrainedNetworkAccess = true
        urlRequest.setValue("Basic \(base64LoginString)", "Authorization")
        
        let task = session.dataTask(urlRequest, function (data, response, error) {
            if (error) {
                callback(error, data)
            }
            else if (response instanceof HTTPURLResponse) {
                let httpResponse = response;
                if (httpResponse.statusCode > 399) {
                    let httpError = new HTTPError.ClientError(httpResponse.statusCode,
                        `URL: ${baseUrl.absoluteString}\nBody:` +
                            + (String(data ?? Data(), .utf8) ?? ""))
                    callback(httpError, data)
                    return
                }
            }
            
            callback(null, data)
        });

        task.resume()
    }
    
    getArray(item, prop) {
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
    }
    
    MAXDEPTH = 2;
    toJSON(dataItem, removeUID =  false) {
        
        let updatedFields = dataItem.syncState?.actionNeeded == "updated"
            ? dataItem.syncState?.updatedFields
            : null
        
        function recur(dataItem, depth) {
            let properties = dataItem.objectSchema.properties
            var result = []
            var isPartiallyLoaded = false
            
            // TODO Refactor: this will change when edges are implemented
            if (depth == this.MAXDEPTH) {
                isPartiallyLoaded = true
                result["memriID"] = dataItem.memriID
            }
            else {
                for (let prop of properties) {
                    if (prop.name == "syncState" || prop.name == "deleted" || (removeUID && prop.name == "uid")) {
                        // Ignore
                    }
                    else if (updatedFields == null || updatedFields?.contains(prop.name) ?? false) {
                        /*if (prop.type == .object) {
                            if (prop.isArray) {
                                var toList = [[String:Any]]()
                                for item in getArray(dataItem, prop.name) {
                                    toList.append(recur(item, depth + 1))
                                }
                                result[prop.name] = toList
                            }
                            else {
                                result[prop.name] = recur(dataItem[prop.name] as! DataItem, depth + 1)
                            }
                        }
                        else {
                            result[prop.name] = dataItem[prop.name]
                        }*///TODO
                    }
                    else {
                        isPartiallyLoaded = true
                    }
                }
            }
            
            var syncState = []
            if (isPartiallyLoaded) { syncState["isPartiallyLoaded"] = true }
            
            result["type"] = dataItem.genericType
            result["syncState"] = syncState
            
            return result
        }
        
        // TODO refactor: error handling
        try {
            return MemriJSONEncoder.encode(AnyCodable(recur(dataItem, 1)))
        }
        catch (error) {
            debugHistory.error("Exception while communicating with the pod: \(error)")
            return Data()
        }
    }
    
    /// Retrieves a single data item from the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to retrieve
    ///   - callback: Function that is called when the task is completed either with a result, or an error
    /// - Remark: Note that it is not necessary to specify the type here as the pod has a global namespace for uids
    get(memriID, callback, item) {
        
        this.http(HTTPMethod.GET, `items/${memriID}`, null, function (error, data) {

            if (data) {
                // TODO Refactor: Error handling
                // let result[DataItem]? = MemriJSONDecoder.decode(DataItemFamily.self, data)//TODO
                
                callback(null, result[0])
            }
            else {
                callback(error, null)
            }
        }, null)
    }
    
    /// Create a data item and return the new uid for that data item
    /// - Parameters:
    ///   - item: The data item to create on the pod
    ///   - callback: Function that is called when the task is completed either with the new uid, or an error
    create(item, callback, uid) {
        
        this.http(HTTPMethod.POST, "items", toJSON(item, true), function (error, data) {
            callback(error, data != null ? Int(String(data ?? Data(), ".utf8") ?? "") : null)
        }, null)
    }
    
    /// Updates a data item and returns the new version number
    /// - Parameters:
    ///   - item: The data item to update on the pod
    ///   - callback: Function that is called when the task is completed either with the new version number, or an error
    update(item, callback, version) {
                       
        this.http(HTTPMethod.PUT, `items/${item.memriID}`, toJSON(item), function (error, data) {
            callback(error, (data != null ? Int(String(data ?? Data(), ".utf8") ?? "") : null))
        }, null)
    }
    
    /// Marks a data item as deleted on the pod.
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    /// - Remark: Note that data items that are marked as deleted are by default not returned when querying
    remove(memriID, callback, success) {
        
        this.http(HTTPMethod.DELETE, "items/\(memriID)", null, function (error, data) {
            callback(error, error == null)
        }, null)
    }
    
    /// Queries the database for a subset of DataItems and returns a list of DataItems
    /// - Parameters:
    ///   - queryOptions: Object describing what to query and how to return the results
    ///   - callback: Function that is called when the task is completed either with the results, or  an error
    /// - Remark: The query language is a WIP
    query(queryOptions, callback, result) {
        
        // TODO Can no longer detect whether the data item is synced
//        if (queryOptions.query!.test(#"^-\d+"#)) { // test for uid that is negative
//            callback("nothing to do", nil)
//            return
//        }
        
        var data = null
        
        let query = queryOptions.query ?? ""
        // let matches = query.match(#"^(\w+) AND memriID = '(.+)'$"#)//TODO
        if (matches.count == 3) {
            let type = matches[1]
            let memriID = matches[2]
            
            console.log("Requesting single \(type) with memriID \(memriID)")
            
            data = ""`
                {
                  items(function: type(${type})) @filter(eq(memriID, ${memriID})) {
                    uid
                    type : dgraph.type
                    expand(_all_) {
                      uid
                      type : dgraph.type
                      expand(_all_) {
                        uid
                        memriID
                        type : dgraph.type
                      }
                    }
                  }
                }
            `"".data(.utf8)
        }
        else {
            let type = query.split(" ").first ?? ""
            
            console.log(`Requesting query result of ${type}: ${queryOptions.query ?? ""}`)
            
            data = ""`
                {
                  items(function: type(${type})) {
                    uid
                    type : dgraph.type
                    expand(_all_) {
                      uid
                      type : dgraph.type
                      expand(_all_) {
                        uid
                        memriID
                        type : dgraph.type
                      }
                    }
                  }
                }
            `"".data(.utf8)
        }
        
        this.http(HTTPMethod.POST, "all", data, function (error, data) {
            if (error) {
                // debugHistory.error(`Could not load data from pod: \n${error}`)
                callback(error, null)
            }
            else if (data) {
                try {
                    var items:[DataItem]?
                     JSONErrorReporter() {
                        items =  MemriJSONDecoder
                            .decode(family: DataItemFamily.self, from: data)
                    }
                    
                    callback(nil, items)
                }
                catch (error) {
                    debugHistory.error("Could not load data from pod: \n\(error)")
                    callback(error, nil)
                }
            }
        }, null)
        
    }
    
    /// Runs an importer on the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    runImport(memriID, callback, success) {
        
        this.http(HTTPMethod.PUT, "import/\(memriID)", null, function (error, data) {
            callback(error, error == null)
        }, null)
    }

    /// Runs an indexer on the pod
    /// - Parameters:
    ///   - memriID: The memriID of the data item to remove
    ///   - callback: Function that is called when the task is completed either with a result, or  an error
    runIndex(memriID, callback, success) {

        this.http(HTTPMethod.PUT, "index/\(memriID)", null, function (error, data) {
            callback(error, error == null)
        }, null)
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
          item(function: eq(isPartiallyLoaded, true)) {
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
          get(function: type(note)) @filter(NOT anyofterms(title, "3") OR eq(starred, false)) @recurse {
            uid
            type : dgraph.type
            expand(note)
          }
        }
        This will give you the uid and type of both note node and the label nodes that are linked to it via labels edge, and all properties of note. If you want more properties of the linked label, you can either specify it e.g. name under expand(note) , or if (you want all of them, do query like this:
       ) {
          get(function: type(note)) @filter(NOT anyofterms(title, "3") OR eq(starred, false)) @recurse {
            uid
            type : dgraph.type
            expand(_all_)
          }
        }
        @recurse(depth:2)
        
        
        {
          get(function: anyofterms(title, "5")) @recurse {
            uid
            type : dgraph.type
            expand(note)
          }
        }
        The expand() trick as I wrote in the last post also applies here, so if (you want only uid and type of 2nd layer nodes, you use expand(note) (all properties of the 1st layer node). I give the result here:
       ) {
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
              item(function: anyofterms(name, "Home"))  {
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
