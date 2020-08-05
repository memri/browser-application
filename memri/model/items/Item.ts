import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";
import {decodeEdges, jsonDataFromFile, MemriJSONDecoder, MemriJSONEncoder, unserialize} from "../../gui/util";
import {ExprInterpreter} from "../../parsers/expression-parser/ExprInterpreter";
import {CacheMemri} from "../Cache";
import {debugHistory} from "../../cvu/views/ViewDebugger";
import {DatabaseController, ItemReference} from "../DatabaseController";
import {RealmObjects, Realm} from "../RealmLocal";
import {Color} from "../../parsers/cvu-parser/CVUParser";
import {Datasource} from "../../api/Datasource";
import {Session} from "../../sessions/Session";
import {Sessions} from "../../sessions/Sessions";
import {UserState, ViewArguments} from "../../cvu/views/CascadableDict";

enum ItemError {
    cannotMergeItemWithDifferentId
}

export function UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


/// Item is the baseclass for all of the data classes.
export class SchemaItem {
    get genericType() {
        return this?.constructor?.name;
    }
    /// A collection of all edges this Item is connected to.
    allEdges: RealmObjects = new RealmObjects();
    /// Last access date of the Item.
    dateAccessed: Date
    /// Creation date of the Item.
    dateCreated: Date
    /// Last modification date of the Item.
    dateModified: Date
    /// Boolean whether the Item has been deleted.
    deleted: boolean = false
    /// The identifier of an external source.
    externalID
    /// A description of the item.
    itemDescription
    /// Boolean whether the Item has been starred.
    starred: boolean = false
    /// Object describing syncing information about this object like loading state, versioning,
    /// etc.
    syncState
    /// The last version loaded from the server.
    version: number = 0
    /// The unique identifier of the Item set by the pod.
    uid

    superDecode(decoder: Decoder) {
        decodeEdges(decoder, "allEdges", this)
        /*this.dateAccessed = decoder.decodeIfPresent("dateAccessed") ?? this.dateAccessed
        this.dateCreated = decoder.decodeIfPresent("dateCreated") ?? this.dateCreated
        this.dateModified = decoder.decodeIfPresent("dateModified") ?? this.dateModified
        this.deleted = decoder.decodeIfPresent("deleted") ?? this.deleted
        this.externalID = decoder.decodeIfPresent("externalID") ?? this.externalID
        this.itemDescription = decoder.decodeIfPresent("itemDescription") ?? this.itemDescription
        this.starred = decoder.decodeIfPresent("starred") ?? this.starred
        this.syncState = decoder.decodeIfPresent("syncState") ?? this.syncState
        this.version = decoder.decodeIfPresent("version") ?? this.version
        this.uid = decoder.decodeIfPresent("uid") ?? this.uid*/
    }

    /*enum CodingKeys {
        allEdges, dateAccessed, dateCreated, dateModified, deleted, externalID, itemDescription,
            starred, syncState, version, uid
        }*/
}

export class Item extends SchemaItem {
    /// Title computed by implementations of the Item class
    get computedTitle() {
        return `${this.genericType} [${this.uid ?? -1000}]`
    }

    functions = {}

    /// Primary key used in the realm database of this Item
    primaryKey() {
            return "uid"
        }

    get toString() {
        var str = `${this.genericType} ${this.realm == undefined ? "[UNMANAGED] " : ""}{\n`
            + `    uid: ${this.uid == undefined ? "null" : String(this.uid ?? 0)}\n`
            + `    _updated: ${!this["_updated"] || this["_updated"].length == 0 ? "[]" : `[${this["_updated"].join(", ")}]`}\n`
            + "    " + Object.keys(this)
                .filter(item => {
                    return this[item] != undefined && item != "allEdges"
                        && item != "uid" && item != "_updated"
                })
                .map(item => {
                    `${item}: ${CVUSerializer.valueToString(this[item])}`
                })
                .join("\n    ");


        str += (this.allEdges.length > 0 ? "\n\n    " : "")
            + this.allEdges
                .map(item => {
                    return item.toString
                })
                .join("\n    ")
            + "\n}"

        return str
    }

    get changelog() {
        return this.edges("changelog")?.items("AuditItem"); //TODO:
    }

    constructor(objectFromRealm?) {
        super();

        if (objectFromRealm) {
            for (let key in objectFromRealm) {
                this[key] = objectFromRealm[key];
            }
        }

        this.functions["describeChangelog"] = function () {
            let dateCreated = this.dateCreate//Views.formatDate(this.dateCreated); //TODO:
            let views = this.changelog?.filter(item => {
                return item.action == "read"
            }).length ?? 0;
            let edits = this.changelog?.filter(item => {
                return item.action == "update"
            }).length ?? 0
            let timeSinceCreated = this.dateCreated //Views.formatDateSinceCreated(this.dateCreated); //TODO:
            return `You created this ${this.genericType} ${dateCreated} and viewed it ${views} times and edited it ${edits} times over the past ${timeSinceCreated}`
        }.bind(this)

        this.functions["computedTitle"] = function () {
            return this.computedTitle;
        }.bind(this);

        this.functions["edge"] = args => {
            let edgeType = args[0];
            if (typeof edgeType == "string") {
                return this.edge(edgeType)
            } else if (Array.isArray(edgeType) && edgeType.length > 0 && typeof edgeType[0] == "string") {
                return this.edge(edgeType)
            }
            return null
        };

        this.functions["edges"] = args => {
            let edgeType = args[0];
            if (typeof edgeType == "string") {
                return this.edge(edgeType)
            } else if (Array.isArray(edgeType) && edgeType.length > 0 && typeof edgeType[0] == "string") {
                return this.edge(edgeType)
            }
            return null
        }

        this.functions["min"] = args => {
            let first = Number(args[0]) ?? 0; //TODO:
            let second = Number(args[1]) ?? 0 //TODO:
            return Math.min(first, second);
        }

        this.functions["max"] = args => {
            let first = Number(args[0]) ?? 0; //TODO:
            let second = Number(args[1]) ?? 0 //TODO:
            return Math.max(first, second);
        }

        this.functions["floor"] = args => {
            let value = Number(args[0]) ?? 0; //TODO:
            return Math.floor(value);
        }
        this.functions["ceil"] = args => {
            let value = Number(args[0]) ?? 0; //TODO:
            return Math.ceil(value);
        }
    }

    /*required init(from _: Decoder) throws {
        super.init()
    }*/

    cast() {
        return this
    }

    /// Get string, or string representation (e.g. "true) from property name
    /// - Parameter name: property name
    /// - Returns: string representation
    getString(name: string) {
        if (this[name] == undefined) {
            //#if DEBUG
            console.log(`Warning: getting property that this item doesnt have: ${name} for ${this.genericType}:${this.uid ?? -1000}`)
            //#endif

            return ""
        } else {
            return ExprInterpreter.evaluateString(this[name]); //TODO
        }
    }

    /// Get the type of Item
    /// - Returns: type of the Item
    getType() {
        let type = ItemFamily[this["_type"]];
        if (type) {
            let T = getItemType(type)
            // NOTE: allowed forced downcast
            return (new T(this))
        } else {
            console.log(`Cannot find type ${this.genericType} in ItemFamily`)
            return null
        }
    }

    /// Determines whether item has property
    /// - Parameter propName: name of the property
    /// - Returns: boolean indicating whether Item has the property
    hasProperty(propName: string) {
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                if (this[prop] == propName) {
                    return true
                }
                let haystack = this[prop.name];
                if (typeof haystack == "string") {
                    if (haystack.toLowerCase().indexOf(propName.toLowerCase()) > -1) {
                        return true
                    }
                }
            }
        }

        return false
    }

    /// Get property value
    /// - Parameters:
    ///   - name: property name
    get(name: string) {
        if (this[name] != undefined) {
            return this[name]
        } else if (this.edge(name)) {
            return this.edge(name).target();
        }
        return null
    }

    /// Set property to value, which will be persisted in the local database
    /// - Parameters:
    ///   - name: property name
    ///   - value: value
    set(name: string, value) {
        DatabaseController.writeSync(() => {
            //let schema = this[name];
            if  (typeof value != "object" || !value) {
                this[name] = value
                this.modified([name])
            } else if (Array.isArray(value)) {
                let list = value;
                for (let obj of list) {
                    this.link(obj, name);
                }
            } else {
                let obj = value;
                this.link(obj, name, undefined,undefined,true)
            }
            this.dateModified = new Date() // Update DateModified
        })
    }

    /// Flattens the type hierarchy in sequence to search through all related edge types
    edgeCollection(edgeType: string) {
        // TODO: IMPLEMENT

        if (edgeType == "family") {
            return ["family", "brother", "sister", "sibling", "father", "mother", "aunt",
                "uncle", "cousin", "niece"]
        }

        return null
    }

    reverseEdges(edgeType: string) {
        if (this.realm && !this.uid) {
            return null;
        }

        // TODO: collection support
        //#warning("Not implemented fully yet")

        // Should this create a temporary edge for which item() is source() ?
        return this.realm?.objects("Edge") //TODO:
            .filtered(`targetItemID = ${this.uid} AND type = '${edgeType}`)
    }

    reverseEdge(edgeType: string) {
        if (this.realm && !this.uid) {
            return null;
        }

        // TODO: collection support
        //#warning("Not implemented fully yet")

        // Should this create a temporary edge for which item() is source() ?
        return this.realm?.objects("Edge") //TODO:
            .filtered(`targetItemID = ${this.uid} AND type = '${edgeType}'`)[0]//deleted = false AND
    }

    edges(edgeType: string|string[]) {
        if (Array.isArray(edgeType)) {
            if (edgeType.length == 0 && this.realm == undefined) {
                return null;
            }
            var flattened = [];
            for (let type in edgeType) {
                let collection = this.edgeCollection(type);
                if (collection) {
                    flattened.push(collection);
                } else {
                    flattened.push(type)
                }
            }
            let filter = `(type = '${flattened.join("' or type = '")}')`; //deleted = false and

            return this.allEdges.filtered(filter)
        } else {
            if (edgeType == "" && this.realm == undefined) {
                return null;
            }
            let collection = this.edgeCollection(edgeType);
            if (collection) {
                return this.edges(collection)
            }

            return this.allEdges.filtered(`type = '${edgeType}'`) //deleted = false AND
        }

    }

    edge(edgeType: string) {
        return this.edges(edgeType)[0];
    }

    determineSequenceNumber(edgeType: string, sequence?: EdgeSequencePosition) {
        if (!sequence) {
            return null;
        }

        var orderNumber = 1000 // Default 1st order number

        let edges = this.allEdges.filtered(`deleted = false and type = '${edgeType}'`);

        switch (sequence) {
            case EdgeSequencePosition.numberOne:
                orderNumber = sequence; //TODO
                break;
            case EdgeSequencePosition.first:
                var sorted = edges.sorted("sequence", false) //TODO:
                let firstOrderNumber = sorted[0]?.sequence;
                if (firstOrderNumber) {
                    orderNumber = Math.round(firstOrderNumber / 2) //TODO:

                    if (orderNumber == firstOrderNumber) {
                        // TODO: renumber the entire list
                        throw "Not implemented yet"
                    }
                }
                break;
            case EdgeSequencePosition.last:
                var sorted = edges.sorted("sequence", true) //TODO:
                let lastOrderNumber = sorted[0]?.sequence;
                if (lastOrderNumber) {
                    orderNumber = lastOrderNumber + 1000
                }
                break;
            case EdgeSequencePosition.before:
                let beforeEdge = sequence;
                if (!this.allEdges.indexOf(beforeEdge) > -1 || beforeEdge.type != edgeType) {
                    throw "Edge is not part of this set"
                }
                let beforeNumber = beforeEdge.sequence;
                if (!beforeNumber) { //TODO
                    throw "Before edge is not part of an ordered list"
                }

                let beforeBeforeEdge = edges
                    .filtered(`deleted = false AND sequence < ${beforeNumber}`)
                    .sorted("sequence", true)[0];

                let previousNumber = (beforeBeforeEdge?.sequence ?? 0)
                if (beforeNumber - previousNumber > 1000) {
                    orderNumber = beforeNumber - 1000
                } else if (beforeNumber - previousNumber > 1) {
                    orderNumber = beforeNumber - (beforeNumber - previousNumber / 2)
                } else {
                    // TODO: renumber the entire list
                    throw "Not implemented yet"
                }
                break;
            case EdgeSequencePosition.after:
                let afterEdge = sequence;
                if (!this.allEdges.indexOf(afterEdge) > -1 || afterEdge.type != edgeType) {
                    throw "Edge is not part of this set"
                }
                let afterNumber = afterEdge.sequence;
                if (!afterNumber) {
                    throw "Before edge is not part of an ordered list"
                }

                let afterAfterEdge = edges
                    .filtered(`deleted = false AND sequence < ${afterNumber}`)
                    .sorted("sequence", true)[0] //TODO:

                let nextNumber = (afterAfterEdge?.sequence ?? 0)
                if (afterNumber - nextNumber > 1000) {
                    orderNumber = afterNumber - 1000
                } else if (afterNumber - nextNumber > 1) {
                    orderNumber = afterNumber - (afterNumber - nextNumber / 2)
                } else {
                    // TODO: renumber the entire list
                    throw "Not implemented yet"
                }
        }

        return orderNumber
    }

    /// When distinct is set to false multiple of the same relationship type are allowed
    link(item, edgeType: string = "edge",
         sequence?, label?,
         distinct: boolean = false, overwrite: boolean = true) {
        if (!this.get("uid")) {
            throw "Exception: Missing uid on source"
        }


        let targetID = item["uid"];
        if (item["uid"] != undefined && typeof targetID == "number") {

        } else {
            throw "Exception: Missing uid on target"
        }

        if (edgeType == "") {
            throw "Exception: Edge type is not set"
        }

        let query = `deleted = false and type = '${edgeType}'` //
            + (distinct ? "" : ` and targetItemID = ${targetID}`)
        var edge = this.allEdges.filtered(query)[0] //TODO
        let sequenceNumber = this.determineSequenceNumber(edgeType, sequence);

        DatabaseController.writeSync(function () {
            if (item.realm == undefined && item?.constructor?.name == "Item") {
                item["_action"] = "create"
                this.realm?.add(item, ".modified") //TODO
            }

            if (edge == undefined) {
                edge = CacheMemri.createEdge(
                    this,
                    item,
                    edgeType,
                    label,
                    sequenceNumber
                );
                if (edge) {
                    this.allEdges.push(edge);
                }
            } else if (overwrite && edge) {
                edge.targetItemID= targetID
                edge.targetItemType = item.genericType
                edge.sequence = sequenceNumber
                edge.edgeLabel = label

                if (edge["_action"] == undefined) {
                    edge["_action"] = "update"
                }
            } else if (edge == undefined) {
                throw "Exception: Could not create link"
            }
        }.bind(this))

        return edge
    }

    //    public func orderedEdgeIndex(_ type: String, _ needle: Edge) -> Int? {
    //        var i = 0
    //        if let list = edges(type) {
    //            for edge in list {
    //                i += 1
    //                if edge.sourceItemID.value == needle.sourceItemID.value
    //                    && edge.sourceItemType == needle.sourceItemType {
    //                    return i
    //                }
    //            }
    //        }
    //        return nil
    //    }

    unlink(edge: Edge | Item, edgeType?: string, all: boolean = true) {
        if (edge?.constructor?.name == "Edge") {
            if (edge.sourceItemID.value == this.uid && edge.sourceItemType == this.genericType) {
                DatabaseController.writeSync(function () {
                    edge.deleted = true;
                    edge["_action"] = "delete"
                    this.realm?.delete(edge)//TODO
                })
            } else {
                throw "Exception: Edge does not link from this item"
            }
        } else {
            let targetID = edge.get("uid");
            if (!targetID) {
                return;
            }
            if (edgeType == "") {
                throw "Exception: Edge type is not set"
            }

            let edgeQuery = edgeType != undefined ? `type = '${edgeType!}' and ` : "";
            let query = `deleted = false and ${edgeQuery} targetItemID = ${targetID}`
            let results = this.allEdges.filtered(query); //TODO:

            if (results.length > 0) {
                DatabaseController.writeSync(() => {
                    if (all) {
                        for (let edge of results) {
                            edge.deleted = true
                            edge._action = "delete"
                        }
                    } else if (results[0]) {
                        let edge = results[0];
                        edge.deleted = true
                        edge._action = "delete"
                    }
                });
            }
        }
    }

    /// Toggle boolean property
    /// - Parameter name: property name
    toggle(name: string) {
        /*if (this.objectSchema[name]?.type != "boolean") {
            throw `'${name}' is not a boolean property`
        }*/

        let val = Boolean(this[name]) ?? false
        this.set(name, !val);
    }

    /// Compares value of this Items property with the corresponding property of the passed items property
    /// - Parameters:
    ///   - propName: name of the compared property
    ///   - item: item to compare against
    /// - Returns: boolean indicating whether the property values are the same
    isEqualProperty(propName: string, item: Item) {
        let prop = this[propName];
        if (prop) {
            // List
            if (Array.isArray(prop)) {
                return false // TODO: implement a list compare and a way to add to updatedFields
            } else {
                return this.isEqualValue(this[propName], item[propName])
            }
        } else {
            // TODO: Error handling
            console.log(`Unable to compare property ${propName}, but ${this} does not have that property`)
            return false
        }
    }

    isEqualValue(a, b) {
        if (a == undefined) {
            return b == undefined
        } else if (a) {
            return a == b
        }
        /*else if let a = a as? String { return a == b as? String }
        else if let a = a as? Int { return a == b as? Int }
        else if let a = a as? Double { return a == b as? Double }
        else if let a = a as? Object { return a == b as? Object }*/
        else {
            debugHistory.warn("Unable to compare value: types do not mach")
            return false
        }
    }

    /// Safely merges the passed item with the current Item. When there are merge conflicts, meaning that some other process
    /// requested changes for the same properties with different values, merging is not performed.
    /// - Parameter item: item to be merged with the current Item
    /// - Returns: boolean indicating the succes of the merge
    safeMerge(item: Item) {
        // Ignore when marked for deletion
        if (this["_action"] == "delete") {
            return true
        }

        // Do not update when the version is not higher then what we already have
        if (item.version <= this.version) {
            return false
        }

        // Make sure to not overwrite properties that have been changed
        let updatedFields = this["_updated"]

        // Compare all updated properties and make sure they are the same
        //#warning("properly implement this for edges")
        for (let fieldName of updatedFields) {
            if (!this.isEqualProperty(fieldName, item)) {
                return false
            }
        }

        // Merge with item
        this.merge(item)

        return true
    }

    /// merges the the passed Item in the current item
    /// - Parameters:
    ///   - item: passed Item
    ///   - mergeDefaults: boolean describing how to merge. If mergeDefault == true: Overwrite only the property values have
    ///    not already been set (nil). else: Overwrite all property values with the values from the passed item, with the exception
    ///    that values cannot be set from a non-nil value to nil.
    merge(item: Item, mergeDefaults: boolean = false) {
        // Store these changes in realm
        let realm: Realm = this.realm;
        if (realm) {
            try {
                realm.write(() => {
                    this.doMerge(item, mergeDefaults)
                })
            } catch {
                console.log(`Could not write merge of ${item} and ${this} to realm`)
            }
        } else {
            this.doMerge(item, mergeDefaults)
        }
    }

    doMerge(item: Item, mergeDefaults: boolean = false) {
        let properties = this
        for (let prop in properties) {
            if (properties.hasOwnProperty(prop)) {
                // Exclude SyncState
                if (prop == "_updated" || prop == "_action" || prop == "_partial"
                    || prop == "deleted" || prop == "_changedInSession" || prop == "uid") {
                    continue
                }

                // Perhaps not needed:
                // - TODO needs to detect lists which will always be set
                // - TODO needs to detect optionals which will always be set

                // Overwrite only the property values that are not already set
                if (mergeDefaults) {
                    if (this[prop] == undefined) {
                        this[prop] = item[prop]
                    }
                }
                    // Overwrite all property values with the values from the passed item, with the
                // exception, that values cannot be set ot nil
                else {
                    if (item[prop] != undefined) {
                        this[prop] = item[prop]
                    }
                }
            }
        }
    }

    /// update the dateAccessed property to the current date
    accessed() {
        let safeSelf = new ItemReference(this) //TODO:
        DatabaseController.writeAsync((realm) => {
            let item = safeSelf.resolve();
            if (!item) {
                return
            }
            item = new Item(item);
            item.dateAccessed = new Date()

            let auditItem = CacheMemri.createItem("AuditItem", {"action": "read"});
            item.link(auditItem, "changelog");
        });
    }

    /// update the dateAccessed property to the current date
    modified(updatedFields: string[]) {
        let safeSelf = new ItemReference(this) //TODO:
        DatabaseController.writeAsync((realm: Realm) => {
            let item = safeSelf.resolve();
            if (!item) {
                return
            }

            let previousModified = item.dateModified
            item.dateModified = new Date()
            if (!item["_updated"]) {
                item["_updated"] = [];
            }

            for (let field of updatedFields) {
                if (!item["_updated"].includes(field)) {
                    item["_updated"].push(field)
                }
            }

            /*if (previousModified?.distance(new Date()) ?? 0 < 300) /!* 5 minutes *!/ {
                //#warning("Test that .last gives the last added audit item")
                let itemEdges = item.edges("changelog").filtered("_type = AuditItem");
                let auditItem = itemEdges[itemEdges.length - 1];
                let content = auditItem.content;
                var dict = unserialize(content);
                if (auditItem && content && dict) {
                    for (let field of updatedFields) {
                        if (item.objectSchema[field] == undefined) {
                            throw "Invalid update call"
                        }
                        dict[field] = item[field];
                    }
                    auditItem.content = String(MemriJSONEncoder(dict)) ?? ""
                    return;
                }
            }*/

            var dict = {}
            for (let field of updatedFields) {
                /*if (item.objectSchema[field] == undefined) {
                    throw "Invalid update call"
                }*/
                dict[field] = item[field]
            }

            let content = String(MemriJSONEncoder(dict)) ?? ""
            let auditItem = CacheMemri.createItem(
                "AuditItem", {
                    "action": "update",
                    "content": content
                }
            )
            item.link(auditItem, "changelog")
        })
    }

    /// compare two dataItems
    /// - Parameters:
    ///   - lhs: Item 1
    ///   - rhs: Item 2
    /// - Returns: boolean indicating equality
/*public static func == (lhs: Item, rhs: Item) -> Bool {
        lhs.uid == rhs.uid
    }*/ //TODO

    /// Reads Items from file
    /// - Parameters:
    ///   - file: filename (without extension)
    ///   - ext: extension
    /// - Throws: Decoding error
    /// - Returns: Array of deserialized Items
    fromJSONFile(file: string, ext: string = "json") {
        let jsonData = jsonDataFromFile(file, ext) //TODO

        let items = MemriJSONDecoder(jsonData) //TODO
        return items
    }


    /// Read Item from string
    /// - Parameter json: string to parse
    /// - Throws: Decoding error
    /// - Returns: Array of deserialized Items
    fromJSONString(json: string) {
        let items: [Item] = MemriJSONDecoder(json) //TODO
        return items
    }
}

Object.assign(RealmObjects.prototype, {
    lookup(type?, dir: Direction = Direction.target) {
        if (this.length == 0) {
            return
        }

        var listType = type
        if (listType == undefined) {
            let strType = dir == Direction.target ? this?.targetItemType : this?.sourceItemType;
            let itemType = ItemFamily[strType];
            if (strType && itemType) {
                listType = getItemType(itemType)?.constructor?.name;
            }
        }
        let finalType = listType;
        if (!finalType) {
            return undefined;
        }

        try {
            return DatabaseController.tryRead((realm) => {
                let filter = "uid = "
                    + this.map ( (item) => {
                        let value = (dir == Direction.target ? item.targetItemID : item.sourceItemID);
                    if (value) {
                        return String(value)
                    }
                    return undefined
                }).join(" or uid = ")
                return realm.objects(finalType).filtered(filter); //.objects(finalType)
            })
        } catch (error) {
            debugHistory.error(`${error}`);
            return undefined;
        }
    },
    items(type) { return this.lookup(type) },
    targets(type) { return this.lookup(type) },
    sources(type) { return this.lookup(type, Direction.source) },
    itemsArray() {
        var result = [];

        for (let edge of this) {
            let target = edge.target();
            if (target) {
                result.push(target)
            }
        }

        return result
    },
    edgeArray() {
        var result = [];

        for (let edge of this) {
            result.push(edge)
        }

        return result
    }
})

enum Direction {
    source, target
}


/*extension RealmSwift.Results where Element == Edge {
    private enum Direction {
        case source, target
}
enum Direction {
    source, target
}

function lookup(type?, dir: Direction = Direction.target) {

        guard count > 0 else {
            return nil
        }

        var listType = type
        if listType == nil {
        let strType = dir == .target ? first?.targetItemType : first?.sourceItemType
        if let strType = strType, let itemType = ItemFamily(rawValue: strType) {
        listType = itemType.getType() as? T.Type
    }
}

    guard let finalType = listType else {
        return nil
    }

    do {
        let realm = try Realm()
        let filter = "uid = "
            + compactMap {
            if let value = (dir == .target ? $0.targetItemID.value : $0.sourceItemID.value) {
                return String(value)
            }
            return nil
        }.joined(separator: " or uid = ")
        return realm.objects(finalType).filter(filter)
    } catch {
        debugHistory.error("\(error)")
        return nil
    }
}

    // TODO: support for heterogenous edge lists

    func items<T: Item>(type: T.Type? = nil) -> Results<T>? { lookup(type: type) }
        func targets<T: Item>(type: T.Type? = nil) -> Results<T>? { lookup(type: type) }
        func sources<T: Item>(type: T.Type? = nil) -> Results<T>? { lookup(type: type, dir: .source) }

    func itemsArray<T: Item>(type _: T.Type? = T.self) -> [T] {
        var result = [T]()

        for edge in self {
            if let target = edge.target() as? T {
                result.append(target)
            }
        }

        return result
    }

    //    #warning("Toby, how do Ranges work exactly?")
    //    #warning("@Ruben I think this achieves what you want")
    //    // TODO: views.removeSubrange((currentViewIndex + 1)...)
    //    func removeEdges(ofType type: String, withOrderMatchingBounds orderBounds: PartialRangeFrom<Int>) {
    //        edges(type)?.filter("order > \(orderBounds.lowerBound)").forEach { edge in
    //            do {
    //                try self.unlink(edge)
    //            } catch {
    //                // log errors in unlinking here
    //            }
    //        }
    //    }
}*/

class first {
    value;
    type;

    constructor() {
        this.type = "first";
    }
}

class last {
    value;
    type;

    constructor() {
        this.type = "last";
    }
}

class before {
    value;
    type = "before";

    constructor(value) {
        this.value = value;
    }
}

class after {
    value;
    type = "after";

    constructor(value) {
        this.value = value;
    }
}

class numberOne {
    value;
    type = "number";

    constructor(value) {
        this.value = value;
    }
}

export const EdgeSequencePosition = {
    first,
    last,
    before,
    after,
    numberOne
}


export class Edge {
    type: string;
    sourceItemType: any;
    sourceItemID: any;
    targetItemType: any;
    targetItemID: any;
    sequence: any;
    edgeLabel: string;
    _action: string;
    get toString(): string {
        return `Edge (${this.type ?? ""}${this.edgeLabel != undefined ? `:${this.edgeLabel ?? ""}` : ""}): ${this.sourceItemType ?? ""}:${this.sourceItemID.value ?? 0} -> ${this.targetItemType ?? ""}:${this.targetItemID.value ?? 0}`
    }

    get targetType() {
        return getItemType(ItemFamily[this.targetItemType ?? ""]);
    }

    get sourceType() {
        return getItemType(ItemFamily[this.sourceItemType ?? ""]);
    }

    item(type) {
        this.target(type)
    }

    target() {
        try {
            return DatabaseController.tryRead((item) => {
                let itemType = this.targetType;
                if (itemType) {
                    return item.objectForPrimaryKey(itemType, this.targetItemID);
                } else {
                    throw `Could not resolve edge target: ${this}`
                }
            })
        } catch (error) {
            debugHistory.error(`${error}`)
        }

        return;
    }

    source() {
        try {
            return DatabaseController.tryRead((item) => {
                let itemType = this.sourceType;
                if (itemType) {
                    return item.objectForPrimaryKey(itemType, this.sourceItemID);
                } else {
                    throw `Could not resolve edge source: ${this}`
                }
            })
        } catch (error) {
            debugHistory.error(`${error}`)
        }

        return;
    }

    parseTargetDict(dict) {
        if (!dict)
            return;

        let itemType = dict["_type"];
        if (typeof itemType != "string") {
            throw `Invalid JSON, no _type specified for target: ${dict}`
        }

        let type = getItemType(ItemFamily[itemType]);
        if (!type) {//TODO as? Item.Type
            throw `Invalid target item type specificed: ${itemType}`
        }

        let realm = DatabaseController.getRealm()
        var item = new type();
        for (let [key, value] of Object.entries(dict)) {
                item[key] = value;
        }

        item = CacheMemri.addToCache(item);
        let uid = item["uid"];
        if (uid) {
            this.targetItemType = itemType
            this.targetItemID.value = uid
        } else {
            throw "Unable to create target item in edge"
        }
    }

    constructor(type: string = "edge", source, target,
        sequence?: number, label?: string, action?: string) {
        if (typeof type != "string") {
            if (type) {
                for (let key in type) {
                    this[key] = type[key];
                }
            }
        } else {
            this.type = type
            this.sourceItemType = source[0]
            this.sourceItemID.value = source[1]
            this.targetItemType = target[0]
            this.targetItemID.value = target[1]
            this.sequence.value = sequence
            this.edgeLabel = label
            this._action = action
        }
    }
}


/// TBD
export class CVUStoredDefinition extends Item {
    /// TBD
    definition?: string;
    /// TBD
    domain?: string
    /// The name of the item.
    name?: string
    /// TBD
    query?: string
    /// TBD
    selector?: string
    /// TBD
    type?: string

    constructor(objectFromRealm?) {
        super();
        for (let key in objectFromRealm) {
            this[key] = objectFromRealm[key];
        }
    }
}

export class CVUStateDefinition extends CVUStoredDefinition {
    static fromCVUStoredDefinition(stored: CVUStoredDefinition) {
        return CacheMemri.createItem("CVUStateDefinition", {
            "definition": stored.definition,
            "domain": "state",
            "name": stored.name,
            "query": stored.query,
            "selector": stored.selector,
            "type": stored.type
        })
    }

    static fromCVUParsedDefinition(parsed: CVUParsedDefinition) {
        return CacheMemri.createItem("CVUStateDefinition", {
            "definition": parsed.toCVUString(0, "    "),
            "domain": "state",
            "name": parsed.name,
//            "query": stores.query,
            "selector": parsed.selector,
            "type": parsed.definitionType
        })
    }

    constructor(objectFromRealm) {
        super(objectFromRealm);
        for (let key in objectFromRealm) {
            this[key] = objectFromRealm[key];
        }
    }
}

//----------------------------------------------------schema.ts

export enum ItemFamily {
    AuditItem = "AuditItem",
    Company = "Company",
    CreativeWork = "CreativeWork",
    DigitalDocument = "DigitalDocument",
    Comment = "Comment",
    Note = "Note",
    MediaObject = "MediaObject",
    Audio = "Audio",
    Photo = "Photo",
    Video = "Video",
    CVUStoredDefinition = "CVUStoredDefinition",
    CVUStateDefinition = "CVUStateDefinition",
    Datasource = "Datasource",
    Device = "Device",
    Diet = "Diet",
    Downloader = "Downloader",
    Edge = "Edge",
    File = "File",
    Importer = "Importer",
    ImporterRun = "ImporterRun",
    Indexer = "Indexer",
    IndexerRun = "IndexerRun",
    Label = "Label",
    Location = "Location",
    Address = "Address",
    Country = "Country",
    MedicalCondition = "MedicalCondition",
    NavigationItem = "NavigationItem",
    OnlineProfile = "OnlineProfile",
    Person = "Person",
    PhoneNumber = "PhoneNumber",
    PublicKey = "PublicKey",
    Session = "Session",
    Sessions = "Sessions",
    SessionView = "SessionView",
    Setting = "Setting",
    SyncState = "SyncState",
    UserState = "UserState",
    ViewArguments = "ViewArguments",
    Website = "Website",
}

//export var discriminator = Discriminator._type //TODO:

export var backgroundColor = function(name) {
    switch (name) {
        case ItemFamily.AuditItem: return new Color("#93c47d")
        case ItemFamily.Company: return new Color("#93c47d")
        case ItemFamily.CreativeWork: return new Color("#93c47d")
        case ItemFamily.DigitalDocument: return new Color("#93c47d")
        case ItemFamily.Comment: return new Color("#93c47d")
        case ItemFamily.Note: return new Color("#ccb94b ")
        case ItemFamily.MediaObject: return new Color("#93c47d")
        case ItemFamily.Audio: return new Color("#93c47d")
        case ItemFamily.Photo: return new Color("#93c47d")
        case ItemFamily.Video: return new Color("#93c47d")
        case ItemFamily.CVUStoredDefinition: return new Color("#93c47d")
        case ItemFamily.CVUStateDefinition: return new Color("#93c47d");
        case ItemFamily.Datasource: return new Color("#93c47d")
        case ItemFamily.Device: return new Color("#93c47d")
        case ItemFamily.Diet: return new Color("#37af1c")
        case ItemFamily.Downloader: return new Color("#93c47d")
        case ItemFamily.Edge: return new Color("#93c47d")
        case ItemFamily.File: return new Color("#93c47d")
        case ItemFamily.Importer: return new Color("#93c47d")
        case ItemFamily.ImporterRun: return new Color("#93c47d")
        case ItemFamily.Indexer: return new Color("#93c47d")
        case ItemFamily.IndexerRun: return new Color("#93c47d")
        case ItemFamily.Label: return new Color("#93c47d")
        case ItemFamily.Location: return new Color("#93c47d")
        case ItemFamily.Address: return new Color("#93c47d")
        case ItemFamily.Country: return new Color("#93c47d")
        case ItemFamily.MedicalCondition: return new Color("#3dc8e2")
        case ItemFamily.NavigationItem: return new Color("#93c47d")
        case ItemFamily.OnlineProfile: return new Color("#93c47d")
        case ItemFamily.Person: return new Color("#3a5eb2")
        case ItemFamily.PhoneNumber: return new Color("#eccf23")
        case ItemFamily.PublicKey: return new Color("#93c47d")
        case ItemFamily.Setting: return new Color("#93c47d")
        case ItemFamily.UserState: return new Color("#93c47d")
        case ItemFamily.ViewArguments: return new Color("#93c47d")
        case ItemFamily.Website: return new Color("#3d57e2")
    }
}

export var foregroundColor = function(name) {
    switch (name) {
        case ItemFamily.AuditItem: return new Color("#ffffff")
        case ItemFamily.Company: return new Color("#ffffff")
        case ItemFamily.CreativeWork: return new Color("#ffffff")
        case ItemFamily.DigitalDocument: return new Color("#ffffff")
        case ItemFamily.Comment: return new Color("#ffffff")
        case ItemFamily.Note: return new Color("#ffffff")
        case ItemFamily.MediaObject: return new Color("#ffffff")
        case ItemFamily.Audio: return new Color("#ffffff")
        case ItemFamily.Photo: return new Color("#ffffff")
        case ItemFamily.Video: return new Color("#ffffff")
        case ItemFamily.CVUStoredDefinition: return new Color("#ffffff")
        case ItemFamily.CVUStateDefinition: return new Color("#ffffff")
        case ItemFamily.Datasource: return new Color("#ffffff")
        case ItemFamily.Device: return new Color("#ffffff")
        case ItemFamily.Diet: return new Color("#ffffff")
        case ItemFamily.Downloader: return new Color("#ffffff")
        case ItemFamily.Edge: return new Color("#ffffff")
        case ItemFamily.File: return new Color("#ffffff")
        case ItemFamily.Importer: return new Color("#ffffff")
        case ItemFamily.ImporterRun: return new Color("#ffffff")
        case ItemFamily.Indexer: return new Color("#ffffff")
        case ItemFamily.IndexerRun: return new Color("#ffffff")
        case ItemFamily.Label: return new Color("#ffffff")
        case ItemFamily.Location: return new Color("#ffffff")
        case ItemFamily.Address: return new Color("#ffffff")
        case ItemFamily.Country: return new Color("#ffffff")
        case ItemFamily.MedicalCondition: return new Color("#ffffff")
        case ItemFamily.NavigationItem: return new Color("#ffffff")
        case ItemFamily.OnlineProfile: return new Color("#ffffff")
        case ItemFamily.Person: return new Color("#ffffff")
        case ItemFamily.PhoneNumber: return new Color("#ffffff")
        case ItemFamily.PublicKey: return new Color("#ffffff")
        case ItemFamily.Setting: return new Color("#ffffff")
        case ItemFamily.UserState: return new Color("#ffffff")
        case ItemFamily.ViewArguments: return new Color("#ffffff")
        case ItemFamily.Website: return new Color("#ffffff")
    }
}

export var getPrimaryKey = function(name) {
    return new (getItemType(name))().primaryKey() ?? ""
}

export var getItemType = function(name) {
    switch (name) {
        case ItemFamily.AuditItem: return AuditItem
        case ItemFamily.Company: return Company
        case ItemFamily.CreativeWork: return CreativeWork
        case ItemFamily.DigitalDocument: return DigitalDocument
        case ItemFamily.Comment: return Comment
        case ItemFamily.Note: return Note
        case ItemFamily.MediaObject: return MediaObject
        case ItemFamily.Audio: return Audio
        case ItemFamily.Photo: return Photo
        case ItemFamily.Video: return Video
        case ItemFamily.CVUStoredDefinition: return CVUStoredDefinition
        case ItemFamily.CVUStateDefinition: return CVUStateDefinition
        case ItemFamily.Datasource: return Datasource
        case ItemFamily.Device: return Device
        case ItemFamily.Diet: return Diet
        case ItemFamily.Downloader: return Downloader
        case ItemFamily.Edge: return Edge
        case ItemFamily.File: return File
        case ItemFamily.Importer: return Importer
        case ItemFamily.ImporterRun: return ImporterRun
        case ItemFamily.Indexer: return Indexer
        case ItemFamily.IndexerRun: return IndexerRun
        case ItemFamily.Label: return Label
        case ItemFamily.Location: return Location
        case ItemFamily.Address: return Address
        case ItemFamily.Country: return Country
        case ItemFamily.MedicalCondition: return MedicalCondition
        case ItemFamily.NavigationItem: return NavigationItem
        case ItemFamily.OnlineProfile: return OnlineProfile
        case ItemFamily.Person: return Person
        case ItemFamily.PhoneNumber: return PhoneNumber
        case ItemFamily.PublicKey: return PublicKey
        case ItemFamily.Session: return Session
        case ItemFamily.Sessions: return Sessions
        case ItemFamily.SessionView: return SessionView
        case ItemFamily.Setting: return Setting
        case ItemFamily.SyncState: return SyncState
        case ItemFamily.UserState: return UserState
        case ItemFamily.ViewArguments: return ViewArguments
        case ItemFamily.Website: return Website
    }
}


/// TBD
export class AuditItem extends Item {
    /// Date of death.
    date: Date
    /// TBD
    content
    /// TBD
    action

    /// TBD
    get appliesTo() {
        return this.edges("appliesTo")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder);



        /*
                jsonErrorHandling(function () {
                    this.date = decoder.decodeIfPresent("date") ?? this.date
                    this.content = decoder.decodeIfPresent("content") ?? this.content
                    this.action = decoder.decodeIfPresent("action") ?? this.action

                    this.superDecode(decoder)
                }.bind(this))*/
    }
}

/// A business corporation.
export class Company extends Item {
    /// TBD
    type
    /// The name of the item.
    name

    constructor(decoder) {
        super(decoder);
    }
}

/// The most generic kind of creative work, including books, movies, photographs, software
/// programs, etc.
export class CreativeWork extends Item{
    /// An abstract is a short description that summarizes a CreativeWork.
    abstract
    /// Date of first broadcast/publication.
    datePublished: Date
    /// Keywords or tags used to describe this content. Multiple entries in a keywords list are
    /// typically delimited by commas.
    keyword
    /// A license document that applies to this content, typically indicated by URL.
    license
    /// A text that belongs to this item.
    text

    /// A media object that encodes this CreativeWork. This property is a synonym for encoding.
    get associatedMedia() {
        return this.edges("associatedMedia")?.items(MediaObject)
    }

    /// An audio object.
    get audio() {
        return this.edges("audio")?.items(Audio)
    }

    /// A citation or reference to another creative work, such as another publication, web page,
    /// scholarly article, etc.
    get citation() {
        return this.edges("citation")?.items(CreativeWork)
    }

    /// The location depicted or described in the content. For example, the location in a
    /// photograph or painting.
    get contentLocation() {
        return this.edges("contentLocation")?.items(Location)
    }

    /// The location where the CreativeWork was created, which may not be the same as the
    /// location depicted in the CreativeWork.
    get locationCreated() {
        return this.edges("locationCreated")?.items(Location)
    }

    /// A video object.
    get video() {
        return this.edges("video")?.items(Video)
    }

    /// The author of this content or rating.
    get writtenBy() {
        return this.edges("writtenBy")?.items(Person)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// An electronic file or document.
export class DigitalDocument extends Item {
    constructor(decoder) {
        super(decoder);
    }
}

/// A comment.
export class Comment extends Item{
    /// TBD
    content
    /// TBD
    textContent

    constructor(decoder) {
        super(decoder);
    }
}

/// A file containing a note.
export class Note extends Item {
    /// TBD
    title = ""
    /// TBD
    content = ""
    /// TBD
    textContent = ""

    /// TBD
    get comment() {
        return this.edges("comment")?.items(Comment)
    }

    constructor(objectFromRealm?) {
        super(objectFromRealm);

        if (objectFromRealm) {
            for (let key in objectFromRealm) {
                this[key] = objectFromRealm[key];
            }
        }
        /*jsonErrorHandling(function () {
            this.title = decoder.decodeIfPresent("title") ?? this.title
            this.content = decoder.decodeIfPresent("content") ?? this.content
            this.textContent = decoder.decodeIfPresent("textContent") ?? this.textContent

            this.superDecode(decoder)
        }.bind(this))*/
    }
}

/// A media object, such as an image, video, or audio object embedded in a web page or a
/// downloadable dataset i.e. DataDownload. Note that a creative work may have many media objects
/// associated with it on the same web page. For example, a page about a single song (MusicRecording)
/// may have a music video (VideoObject), and a high and low bandwidth audio stream (2 AudioObject's).
export class MediaObject extends Item {
    /// The endTime of something. For a reserved event or service, the time that it is expected
    /// to end. For actions that span a period of time, when the action was performed. e.g. John wrote a
    /// book from January to December. For media, including audio and video, it's the time offset of the
    /// end of a clip within a larger file.
    endTime: Date
    /// Location of the actual bytes of the media object, for example the image file or video
    /// file.
    fileLocation
    /// Size of the application / package (e.g. 18MB). In the absence of a unit (MB, KB etc.),
    /// KB will be assumed.
    fileSize
    /// The startTime of something. For a reserved event or service, the time that it is
    /// expected to start. For actions that span a period of time, when the action was performed. e.g.
    /// John wrote a book from January to December. For media, including audio and video, it's the time
    /// offset of the start of a clip within a larger file.
    startTime: Date
    /// The bitrate of the media object.
    bitrate
    /// TBD
    duration
    /// The height of the item.
    height
    /// The width of the item.
    width

    /// TBD
    get file() {
        return this.edge("file")?.target(File)
    }

    /// TBD
    get includes() {
        return this.edges("includes")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// An audio file.
export class Audio extends Item {
    /// The caption for this object. For downloadable machine formats (closed caption, subtitles
    /// etc.) use MediaObject and indicate the encodingFormat.
    caption
    /// If this MediaObject is an AudioObject or VideoObject, the transcript of that object.
    transcript
    /// The name of the item.
    name
    /// The bitrate of the media object.
    bitrate
    /// TBD
    duration

    /// TBD
    get file() {
        return this.edge("file")?.target(File)
    }

    /// TBD
    get includes() {
        return this.edges("includes")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// An image file.
export class Photo extends Item{
    /// The caption for this object. For downloadable machine formats (closed caption, subtitles
    /// etc.) use MediaObject and indicate the encodingFormat.
    caption
    /// Exif data for this object.
    exifData
    /// The name of the item.
    name
    /// The width of the item.
    width
    /// The height of the item.
    height

    /// Thumbnail image for an image or video.
    get thumbnail() {
        return this.edge("thumbnail")?.target(File)
    }

    /// TBD
    get file() {
        return this.edge("file")?.target(File)
    }

    /// TBD
    get includes() {
        return this.edges("includes")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// A video file.
export class Video extends Item{
    /// The caption for this object. For downloadable machine formats (closed caption, subtitles
    /// etc.) use MediaObject and indicate the encodingFormat.
    caption
    /// Exif data for this object.
    exifData
    /// The name of the item.
    name
    /// The width of the item.
    width
    /// The height of the item.
    height
    /// TBD
    duration

    /// Thumbnail image for an image or video.
    get thumbnail() {
        return this.edges("thumbnail")?.items(File)
    }

    /// TBD
    get file() {
        return this.edge("file")?.target(File)
    }

    /// TBD
    get includes() {
        return this.edges("includes")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// A business corporation.
export class Device extends Item{
    /// TBD
    deviceID
    /// TBD
    make
    /// TBD
    manufacturer
    /// TBD
    model
    /// The name of the item.
    name
    /// TBD
    dateAquired: Date
    /// TBD
    dateLost: Date

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class Diet extends Item {
    /// TBD
    type
    /// TBD
    addition
    /// The name of the item.
    name

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class Downloader extends Item{
    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class File extends Item{
    /// The uri property represents the Uniform Resource Identifier (URI) of a resource.
    uri

    /// TBD
    get usedBy() {
        return this.edges("usedBy")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class Importer extends Item{
    /// The name of the item.
    name
    /// TBD
    dataType
    /// TBD
    icon
    /// TBD
    bundleImage

    /// TBD
    get importerRun() {
        return this.edges("importerRun")?.items(ImporterRun)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class ImporterRun extends Item {
    /// The name of the item.
    name
    /// TBD
    dataType

    /// TBD
    get importer() {
        return this.edge("importer")?.target(Importer)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// An indexer enhances your personal data by inferring facts over existing data and adding those
/// to the database.
export class Indexer extends Item{
    /// The name of the item.
    name
    /// TBD
    icon
    /// TBD
    query
    /// TBD
    bundleImage
    /// TBD
    runDestination

    /// TBD
    get indexerRun() {
        return this.edges("indexerRun")?.items(IndexerRun)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// A run of a certain Indexer.
export class IndexerRun extends Item{
    /// The name of the item.
    name
    /// TBD
    query
    /// TBD
    progress

    /// TBD
    get indexer() {
        return this.edge("indexer")?.target(Indexer)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class Label extends Item{
    /// The color of this thing.
    color
    /// The name of the item.
    name

    /// TBD
   /* get comment() {
        return this.edges("comment")?.items(Comment)
    }

    set comment(value) {
        this.set("comment", value);
    }*/

    /// TBD
    get appliesTo() {
        return this.edges("appliesTo")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// The location of something.
export class Location extends Item{
    /// TBD
    latitude
    /// TBD
    longitude

    constructor(decoder) {
        super(decoder);
    }
}

/// A postal address.
export class Address extends Item{
    /// A city or town.
    city
    /// The postal code. For example, 94043.
    postalCode
    /// A state or province of a country.
    state
    /// The street address. For example, 1600 Amphitheatre Pkwy.
    street
    /// TBD
    type

    /// TBD
    get country() {
        return this.edge("country")?.target(Country)
    }

    /// The location of for example where the event is happening, an organization is located, or
    /// where an action takes place.
    get location() {
        return this.edge("location")?.target(Location)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class Country extends Item{
    /// The name of the item.
    name

    /// TBD
    get flag() {
        return this.edge("flag")?.target(File)
    }

    /// The location of for example where the event is happening, an organization is located, or
    /// where an action takes place.
    get location() {
        return this.edge("location")?.target(Location)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class MedicalCondition extends Item{
    /// TBD
    type
    /// The name of the item.
    name

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class NavigationItem extends Item{
    /// TBD
    title
    /// TBD
    sessionName
    /// TBD
    type
    /// TBD
    sequence

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class OnlineProfile extends Item{
    /// TBD
    type
    /// TBD
    handle

    constructor(decoder) {
        super(decoder);
    }
}

/// A person (alive, dead, undead, or fictional).
export class SchemaPerson extends Item{
    /// Date of birth.
    birthDate: Date
    /// Email address.
    email
    /// Date of death.
    deathDate: Date
    /// Family name. In the U.S., the last name of an Person. This can be used along with
    /// givenName instead of the name property.
    firstName
    /// Given name. In the U.S., the first name of a Person. This can be used along with
    /// familyName instead of the name property.
    lastName
    /// The sexual orientation of a person.
    gender
    /// The gender of a person.
    sexualOrientation
    /// The height of the item.
    height
    /// TBD
    shoulderWidth
    /// TBD
    armLength

    /// Physical address of the event or place.
    get address() {
        return this.edges("address")?.items(Address)
    }

    /// The place where the person was born.
    get birthPlace() {
        return this.edge("birthPlace")?.target(Location)
    }

    /// The place where the person died.
    get deathPlace() {
        return this.edge("deathPlace")?.target(Location)
    }

    /// TBD
    get profilePicture() {
        return this.edge("profilePicture")?.target(Photo)
    }

    /// A relation between two persons.
    get relationship() {
        return this.edges("relationship")?.items(Person)
    }

    /// A phone number.
    get hasPhoneNumber() {
        return this.edges("hasPhoneNumber")?.items(PhoneNumber)
    }

    /// TBD
    get website() {
        return this.edges("website")?.items(Website)
    }

    /// TBD
    get company() {
        return this.edges("company")?.items(Company)
    }

    /// TBD
    get publicKey() {
        return this.edges("publicKey")?.items(PublicKey)
    }

    /// TBD
    get onlineProfile() {
        return this.edges("onlineProfile")?.items(OnlineProfile)
    }

    /// TBD
    get diet() {
        return this.edges("diet")?.items(Diet)
    }

    /// TBD
    get medicalCondition() {
        return this.edges("medicalCondition")?.items(MedicalCondition)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class PhoneNumber extends Item{
    /// A phone number with an area code.
    phoneNumber
    /// TBD
    type

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class PublicKey  extends Item {
    /// TBD
    type
    /// TBD
    key
    /// The name of the item.
    name

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class SchemaSession extends Item {
    /// TBD
    currentViewIndex: number = 0
    /// TBD
    editMode: boolean = false
    /// The name of the item.
    name
    /// TBD
    showContextPane: boolean = false
    /// TBD
    showFilterPanel: boolean = false

    /// TBD
    get screenshot() {
        return this.edge("screenshot")?.target(File)
    }

    /// TBD
    get views() {
        return this.edges("view")?.sorted("sequence").items(SessionView)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class SchemaSessions extends Item{
    /// TBD
    currentSessionIndex: number = 0

    /// TBD
    get sessions() {
        return this.edges("session")?.sorted("sequence").items(Session)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class SessionView extends Item {
    /// The name of the item.
    name

    /// TBD
    get datasource() {
        return this.edge("datasource")?.target(Datasource)
    }

    /// TBD
    get session() {
        return this.edge("session")?.target(Session)
    }

    /// TBD
    get userState() {
        return this.edge("userState")?.target(UserState)
    }

    /// TBD
    get viewDefinition() {
        return this.edge("viewDefinition")?.target(CVUStoredDefinition)
    }

    /// TBD
    get viewArguments() {
        return this.edge("viewArguments")?.target(ViewArguments)
    }

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class Setting extends Item {
    /// TBD
    key
    /// TBD
    json

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class SyncState extends Item{
    updatedFields = []
    /// TBD
    isPartiallyLoaded: boolean = false
    /// TBD
    actionNeeded
    /// TBD
    changedInThisSession: boolean = false

    constructor(decoder) {
        super(decoder);
    }
}

/// TBD
export class Website  extends Item{
    /// TBD
    type
    /// URL of the item.
    url

    constructor(decoder) {
        super(decoder);
    }
}

export function dataItemListToArray(object) {
    var collection = []
    if (!Array.isArray(object) || !object.length) return
    if (object[0]?.constructor?.name == "Item") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "AuditItem") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Company") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "CreativeWork") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "DigitalDocument") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Comment") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Note") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "MediaObject") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Audio") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Photo") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Video") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "CVUStoredDefinition") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Device") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Diet") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Downloader") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Edge") { return object.itemsArray() }
    else if (object[0]?.constructor?.name == "File") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Importer") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "ImporterRun") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Indexer") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "IndexerRun") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Label") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Location") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Address") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Country") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "MedicalCondition") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "NavigationItem") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "OnlineProfile") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Person") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "PhoneNumber") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "PublicKey") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Session") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Sessions") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "SessionView") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Setting") { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0]?.constructor?.name == "Website") { object.forEach(function (item) {collection.push(item)}) }

    return collection
}

export class Person extends SchemaPerson {
    get computedTitle(): string {
        return `${this.firstName ?? ""} ${this.lastName ?? ""}`
    }

    /// Age in years
    get age(): number {
        if (this.birthDate) {
            return //Calendar.current.dateComponents([.year], from: birthDate, to: Date()).year //TODO:
        }
        return undefined;
    }

    constructor(decoder) {
        super(decoder)

        //this.functions["age"] = () => { return this.age }
    }
}