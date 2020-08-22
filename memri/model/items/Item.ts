import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";
import {decodeEdges, jsonDataFromFile, MemriJSONDecoder, MemriJSONEncoder, unserialize} from "../../gui/util";
import {ExprInterpreter} from "../../parsers/expression-parser/ExprInterpreter";
import {CacheMemri} from "../Cache";
import {debugHistory} from "../../cvu/views/ViewDebugger";
import {DatabaseController, ItemReference} from "../../storage/DatabaseController";
import {RealmObjects, Realm} from "../RealmLocal";
import {Color} from "../../parsers/cvu-parser/CVUParser";
import {Datasource} from "../../api/Datasource";
import {Session} from "../../sessions/Session";
import {Sessions} from "../../sessions/Sessions";
import {UserState, ViewArguments} from "../../cvu/views/CascadableDict";
import {MemriDictionary} from "../MemriDictionary";

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

    // Used by the filter panel to know what computed variables to show
    get computedVars() { return [] }

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
            return `You created this ${this.genericType} ${dateCreated} and viewed it ${views} ${views == 1 ? "time" : "times"} and edited it ${edits} ${edits == 1 ? "time" : "times"} over the past ${timeSinceCreated}`
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
                if (prop == propName) {
                    return true
                }
                let haystack = this[prop];
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
        DatabaseController.write(this.realm, () => {
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
            .filtered(`deleted = false AND targetItemID = ${this.uid} AND type = '${edgeType}'`)
    }

    reverseEdge(edgeType: string) {
        if (this.realm && !this.uid) {
            return null;
        }

        // TODO: collection support
        //#warning("Not implemented fully yet")

        // Should this create a temporary edge for which item() is source() ?
        return this.realm?.objects("Edge") //TODO:
            .filtered(`deleted = false AND targetItemID = ${this.uid} AND type = '${edgeType}'`)[0]
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

        DatabaseController.write(this.realm, function () {
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
                DatabaseController.write(this.realm, () => {
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
                DatabaseController.write(this.realm,() => {
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
            if (item[fieldName] != undefined && !this.isEqualProperty(fieldName, item)) {
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
        DatabaseController.background(true, undefined,() => {
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
        if (this._action != "create") {
            // Make sure that in between updates to this item are processed correctly
            DatabaseController.write(this.realm, ()=> {
                for (let field of updatedFields) {
                    if (!this._updated.contains(field)) {
                        this._updated.append(field)
                    }
                }
                this._action = "update"
            })
        }

        let safeSelf = new ItemReference(this) //TODO:
        DatabaseController.background(true, undefined, (realm: Realm) => {
            let item = safeSelf.resolve();
            if (!item) {
                return
            }

            let previousModified = item.dateModified
            item.dateModified = new Date()
            if (!item["_updated"]) {
                item["_updated"] = [];
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

            var dict = new MemriDictionary()
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
            let strType = dir == Direction.target ? this[0]?.targetItemType : this[0]?.sourceItemType;
            let itemType = ItemFamily[strType];
            if (strType && itemType) {
                listType = strType;
            }
        }
        let finalType = listType;
        if (!finalType) {
            return undefined;
        }

        try {
            return DatabaseController.tryCurrent(false,(realm) => {
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

export enum Direction {
    source, target
}

export class first {
    value;
    type;

    constructor() {
        this.type = "first";
    }
}

export class last {
    value;
    type;

    constructor() {
        this.type = "last";
    }
}

export class before {
    value;
    type = "before";

    constructor(value) {
        this.value = value;
    }
}

export class after {
    value;
    type = "after";

    constructor(value) {
        this.value = value;
    }
}

export class numberOne {
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
        return this.target(type)
    }

    target() {
        try {
            return DatabaseController.tryCurrent(false,(item) => {
                let itemType = this.targetType;
                if (itemType) {
                    return item.objectForPrimaryKey(itemType.name, this.targetItemID);
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
            return DatabaseController.tryCurrent(false,(item) => {
                let itemType = this.sourceType;
                if (itemType) {
                    return item.objectForPrimaryKey(itemType.name, this.sourceItemID);
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

        //let realm = DatabaseController.getRealmSync()
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

//----------------------------------------------------schema.ts

//
//  WARNING: THIS FILE IS AUTOGENERATED; DO NOT CHANGE.
//  Visit https://gitlab.memri.io/memri/schema to learn more.
//
//  schema.ts
//
//  Copyright © 2020 memri. All rights reserved.
//

// The family of all data item classes
enum ItemFamily {
    typeAccount = "Account",
    typeAuditItem = "AuditItem",
    typeCreativeWork = "CreativeWork",
    typeGame = "Game",
    typeHowTo = "HowTo",
    typeDiet = "Diet",
    typeExercisePlan = "ExercisePlan",
    typeRecipe = "Recipe",
    typeMovingImage = "MovingImage",
    typePerformingArt = "PerformingArt",
    typeRecording = "Recording",
    typeVisualArt = "VisualArt",
    typeWrittenWork = "WrittenWork",
    typeArticle = "Article",
    typeComment = "Comment",
    typeMessage = "Message",
    typeEmailMessage = "EmailMessage",
    typeNote = "Note",
    typeNoteList = "NoteList",
    typeReview = "Review",
    typeCryptoKey = "CryptoKey",
    typeCVUStateDefinition = "CVUStateDefinition",
    typeCVUStoredDefinition = "CVUStoredDefinition",
    typeDatasource = "Datasource",
    typeDevice = "Device",
    typeDownloader = "Downloader",
    typeEdge = "Edge",
    typeEvent = "Event",
    typeFile = "File",
    typeFrequency = "Frequency",
    typeGenericAttribute = "GenericAttribute",
    typeImporter = "Importer",
    typeImporterRun = "ImporterRun",
    typeIndexer = "Indexer",
    typeIndexerRun = "IndexerRun",
    typeIndustry = "Industry",
    typeInvoice = "Invoice",
    typeLabel = "Label",
    typeLead = "Lead",
    typeLocation = "Location",
    typeAddress = "Address",
    typeCountry = "Country",
    typeMaterial = "Material",
    typeMeasure = "Measure",
    typeMediaObject = "MediaObject",
    typeAudio = "Audio",
    typePhoto = "Photo",
    typeVideo = "Video",
    typeMedicalCondition = "MedicalCondition",
    typeMessageChannel = "MessageChannel",
    typeModeOfTransport = "ModeOfTransport",
    typeNavigationItem = "NavigationItem",
    typeNetwork = "Network",
    typeOffer = "Offer",
    typeOpeningHours = "OpeningHours",
    typeOption = "Option",
    typeOrganization = "Organization",
    typePerson = "Person",
    typePhoneNumber = "PhoneNumber",
    typePhysicalEntity = "PhysicalEntity",
    typeProduct = "Product",
    typeProductCode = "ProductCode",
    typeReceipt = "Receipt",
    typeReservation = "Reservation",
    typeResource = "Resource",
    typeRoute = "Route",
    typeSetting = "Setting",
    typeSpan = "Span",
    typeTimeFrame = "TimeFrame",
    typeTransaction = "Transaction",
    typeTrip = "Trip",
    typeUnit = "Unit",
    typeUserState = "UserState",
    typeViewArguments = "ViewArguments",
    typeVote = "Vote",
    typeVoteAction = "VoteAction",
    typeWebsite = "Website",
}

//export var discriminator = Discriminator._type

export var backgroundColor = function(name) {
    switch (name) {
        case ItemFamily.typeAccount: return new Color("#93c47d")
        case ItemFamily.typeAuditItem: return new Color("#93c47d")
        case ItemFamily.typeCreativeWork: return new Color("#93c47d")
        case ItemFamily.typeGame: return new Color("#93c47d")
        case ItemFamily.typeHowTo: return new Color("#93c47d")
        case ItemFamily.typeDiet: return new Color("#37af1c")
        case ItemFamily.typeExercisePlan: return new Color("#93c47d")
        case ItemFamily.typeRecipe: return new Color("#93c47d")
        case ItemFamily.typeMovingImage: return new Color("#93c47d")
        case ItemFamily.typePerformingArt: return new Color("#93c47d")
        case ItemFamily.typeRecording: return new Color("#93c47d")
        case ItemFamily.typeVisualArt: return new Color("#93c47d")
        case ItemFamily.typeWrittenWork: return new Color("#93c47d")
        case ItemFamily.typeArticle: return new Color("#93c47d")
        case ItemFamily.typeComment: return new Color("#93c47d")
        case ItemFamily.typeMessage: return new Color("#93c47d")
        case ItemFamily.typeEmailMessage: return new Color("#93c47d")
        case ItemFamily.typeNote: return new Color("#93c47d")
        case ItemFamily.typeNoteList: return new Color("#93c47d")
        case ItemFamily.typeReview: return new Color("#93c47d")
        case ItemFamily.typeCryptoKey: return new Color("#93c47d")
        case ItemFamily.typeCVUStateDefinition: return new Color("#93c47d")
        case ItemFamily.typeCVUStoredDefinition: return new Color("#93c47d")
        case ItemFamily.typeDatasource: return new Color("#93c47d")
        case ItemFamily.typeDevice: return new Color("#93c47d")
        case ItemFamily.typeDownloader: return new Color("#93c47d")
        case ItemFamily.typeEdge: return new Color("#93c47d")
        case ItemFamily.typeEvent: return new Color("#93c47d")
        case ItemFamily.typeFile: return new Color("#93c47d")
        case ItemFamily.typeFrequency: return new Color("#93c47d")
        case ItemFamily.typeGenericAttribute: return new Color("#93c47d")
        case ItemFamily.typeImporter: return new Color("#93c47d")
        case ItemFamily.typeImporterRun: return new Color("#93c47d")
        case ItemFamily.typeIndexer: return new Color("#93c47d")
        case ItemFamily.typeIndexerRun: return new Color("#93c47d")
        case ItemFamily.typeIndustry: return new Color("#93c47d")
        case ItemFamily.typeInvoice: return new Color("#93c47d")
        case ItemFamily.typeLabel: return new Color("#93c47d")
        case ItemFamily.typeLead: return new Color("#93c47d")
        case ItemFamily.typeLocation: return new Color("#93c47d")
        case ItemFamily.typeAddress: return new Color("#93c47d")
        case ItemFamily.typeCountry: return new Color("#93c47d")
        case ItemFamily.typeMaterial: return new Color("#3d57e2")
        case ItemFamily.typeMeasure: return new Color("#3d57e2")
        case ItemFamily.typeMediaObject: return new Color("#93c47d")
        case ItemFamily.typeAudio: return new Color("#93c47d")
        case ItemFamily.typePhoto: return new Color("#93c47d")
        case ItemFamily.typeVideo: return new Color("#93c47d")
        case ItemFamily.typeMedicalCondition: return new Color("#3dc8e2")
        case ItemFamily.typeMessageChannel: return new Color("#93c47d")
        case ItemFamily.typeModeOfTransport: return new Color("#93c47d")
        case ItemFamily.typeNavigationItem: return new Color("#93c47d")
        case ItemFamily.typeNetwork: return new Color("#93c47d")
        case ItemFamily.typeOffer: return new Color("#93c47d")
        case ItemFamily.typeOpeningHours: return new Color("#93c47d")
        case ItemFamily.typeOption: return new Color("#93c47d")
        case ItemFamily.typeOrganization: return new Color("#93c47d")
        case ItemFamily.typePerson: return new Color("#3a5eb2")
        case ItemFamily.typePhoneNumber: return new Color("#eccf23")
        case ItemFamily.typePhysicalEntity: return new Color("#93c47d")
        case ItemFamily.typeProduct: return new Color("#93c47d")
        case ItemFamily.typeProductCode: return new Color("#93c47d")
        case ItemFamily.typeReceipt: return new Color("#93c47d")
        case ItemFamily.typeReservation: return new Color("#93c47d")
        case ItemFamily.typeResource: return new Color("#93c47d")
        case ItemFamily.typeRoute: return new Color("#93c47d")
        case ItemFamily.typeSetting: return new Color("#93c47d")
        case ItemFamily.typeSpan: return new Color("#93c47d")
        case ItemFamily.typeTimeFrame: return new Color("#93c47d")
        case ItemFamily.typeTransaction: return new Color("#3a5eb2")
        case ItemFamily.typeTrip: return new Color("#93c47d")
        case ItemFamily.typeUnit: return new Color("#93c47d")
        case ItemFamily.typeUserState: return new Color("#93c47d")
        case ItemFamily.typeViewArguments: return new Color("#93c47d")
        case ItemFamily.typeVote: return new Color("#93c47d")
        case ItemFamily.typeVoteAction: return new Color("#93c47d")
        case ItemFamily.typeWebsite: return new Color("#3d57e2")
    }
}

export var foregroundColor = function(name) {
    switch (name) {
        case ItemFamily.typeAccount: return new Color("#ffffff")
        case ItemFamily.typeAuditItem: return new Color("#ffffff")
        case ItemFamily.typeCreativeWork: return new Color("#ffffff")
        case ItemFamily.typeGame: return new Color("#ffffff")
        case ItemFamily.typeHowTo: return new Color("#ffffff")
        case ItemFamily.typeDiet: return new Color("#ffffff")
        case ItemFamily.typeExercisePlan: return new Color("#ffffff")
        case ItemFamily.typeRecipe: return new Color("#ffffff")
        case ItemFamily.typeMovingImage: return new Color("#ffffff")
        case ItemFamily.typePerformingArt: return new Color("#ffffff")
        case ItemFamily.typeRecording: return new Color("#ffffff")
        case ItemFamily.typeVisualArt: return new Color("#ffffff")
        case ItemFamily.typeWrittenWork: return new Color("#ffffff")
        case ItemFamily.typeArticle: return new Color("#ffffff")
        case ItemFamily.typeComment: return new Color("#ffffff")
        case ItemFamily.typeMessage: return new Color("#ffffff")
        case ItemFamily.typeEmailMessage: return new Color("#ffffff")
        case ItemFamily.typeNote: return new Color("#ffffff")
        case ItemFamily.typeNoteList: return new Color("#ffffff")
        case ItemFamily.typeReview: return new Color("#ffffff")
        case ItemFamily.typeCryptoKey: return new Color("#ffffff")
        case ItemFamily.typeCVUStateDefinition: return new Color("#ffffff")
        case ItemFamily.typeCVUStoredDefinition: return new Color("#ffffff")
        case ItemFamily.typeDatasource: return new Color("#ffffff")
        case ItemFamily.typeDevice: return new Color("#ffffff")
        case ItemFamily.typeDownloader: return new Color("#ffffff")
        case ItemFamily.typeEdge: return new Color("#ffffff")
        case ItemFamily.typeEvent: return new Color("#ffffff")
        case ItemFamily.typeFile: return new Color("#ffffff")
        case ItemFamily.typeFrequency: return new Color("#ffffff")
        case ItemFamily.typeGenericAttribute: return new Color("#ffffff")
        case ItemFamily.typeImporter: return new Color("#ffffff")
        case ItemFamily.typeImporterRun: return new Color("#ffffff")
        case ItemFamily.typeIndexer: return new Color("#ffffff")
        case ItemFamily.typeIndexerRun: return new Color("#ffffff")
        case ItemFamily.typeIndustry: return new Color("#ffffff")
        case ItemFamily.typeInvoice: return new Color("#ffffff")
        case ItemFamily.typeLabel: return new Color("#ffffff")
        case ItemFamily.typeLead: return new Color("#ffffff")
        case ItemFamily.typeLocation: return new Color("#ffffff")
        case ItemFamily.typeAddress: return new Color("#ffffff")
        case ItemFamily.typeCountry: return new Color("#ffffff")
        case ItemFamily.typeMaterial: return new Color("#ffffff")
        case ItemFamily.typeMeasure: return new Color("#ffffff")
        case ItemFamily.typeMediaObject: return new Color("#ffffff")
        case ItemFamily.typeAudio: return new Color("#ffffff")
        case ItemFamily.typePhoto: return new Color("#ffffff")
        case ItemFamily.typeVideo: return new Color("#ffffff")
        case ItemFamily.typeMedicalCondition: return new Color("#ffffff")
        case ItemFamily.typeMessageChannel: return new Color("#ffffff")
        case ItemFamily.typeModeOfTransport: return new Color("#ffffff")
        case ItemFamily.typeNavigationItem: return new Color("#ffffff")
        case ItemFamily.typeNetwork: return new Color("#ffffff")
        case ItemFamily.typeOffer: return new Color("#ffffff")
        case ItemFamily.typeOpeningHours: return new Color("#ffffff")
        case ItemFamily.typeOption: return new Color("#ffffff")
        case ItemFamily.typeOrganization: return new Color("#ffffff")
        case ItemFamily.typePerson: return new Color("#ffffff")
        case ItemFamily.typePhoneNumber: return new Color("#ffffff")
        case ItemFamily.typePhysicalEntity: return new Color("#ffffff")
        case ItemFamily.typeProduct: return new Color("#ffffff")
        case ItemFamily.typeProductCode: return new Color("#ffffff")
        case ItemFamily.typeReceipt: return new Color("#ffffff")
        case ItemFamily.typeReservation: return new Color("#ffffff")
        case ItemFamily.typeResource: return new Color("#ffffff")
        case ItemFamily.typeRoute: return new Color("#ffffff")
        case ItemFamily.typeSetting: return new Color("#ffffff")
        case ItemFamily.typeSpan: return new Color("#ffffff")
        case ItemFamily.typeTimeFrame: return new Color("#ffffff")
        case ItemFamily.typeTransaction: return new Color("#ffffff")
        case ItemFamily.typeTrip: return new Color("#ffffff")
        case ItemFamily.typeUnit: return new Color("#ffffff")
        case ItemFamily.typeUserState: return new Color("#ffffff")
        case ItemFamily.typeViewArguments: return new Color("#ffffff")
        case ItemFamily.typeVote: return new Color("#ffffff")
        case ItemFamily.typeVoteAction: return new Color("#ffffff")
        case ItemFamily.typeWebsite: return new Color("#ffffff")
    }
}

export var getPrimaryKey = function(name) {
    return (new getItemType(name))().primaryKey() ?? ""
}

export var getItemType = function(name) {
    switch (name) {
        case ItemFamily.typeAccount: return Account
        case ItemFamily.typeAuditItem: return AuditItem
        case ItemFamily.typeCreativeWork: return CreativeWork
        case ItemFamily.typeGame: return Game
        case ItemFamily.typeHowTo: return HowTo
        case ItemFamily.typeDiet: return Diet
        case ItemFamily.typeExercisePlan: return ExercisePlan
        case ItemFamily.typeRecipe: return Recipe
        case ItemFamily.typeMovingImage: return MovingImage
        case ItemFamily.typePerformingArt: return PerformingArt
        case ItemFamily.typeRecording: return Recording
        case ItemFamily.typeVisualArt: return VisualArt
        case ItemFamily.typeWrittenWork: return WrittenWork
        case ItemFamily.typeArticle: return Article
        case ItemFamily.typeComment: return Comment
        case ItemFamily.typeMessage: return Message
        case ItemFamily.typeEmailMessage: return EmailMessage
        case ItemFamily.typeNote: return Note
        case ItemFamily.typeNoteList: return NoteList
        case ItemFamily.typeReview: return Review
        case ItemFamily.typeCryptoKey: return CryptoKey
        case ItemFamily.typeCVUStateDefinition: return CVUStateDefinition
        case ItemFamily.typeCVUStoredDefinition: return CVUStoredDefinition
        case ItemFamily.typeDatasource: return Datasource
        case ItemFamily.typeDevice: return Device
        case ItemFamily.typeDownloader: return Downloader
        case ItemFamily.typeEdge: return Edge
        case ItemFamily.typeEvent: return Event
        case ItemFamily.typeFile: return File
        case ItemFamily.typeFrequency: return Frequency
        case ItemFamily.typeGenericAttribute: return GenericAttribute
        case ItemFamily.typeImporter: return Importer
        case ItemFamily.typeImporterRun: return ImporterRun
        case ItemFamily.typeIndexer: return Indexer
        case ItemFamily.typeIndexerRun: return IndexerRun
        case ItemFamily.typeIndustry: return Industry
        case ItemFamily.typeInvoice: return Invoice
        case ItemFamily.typeLabel: return Label
        case ItemFamily.typeLead: return Lead
        case ItemFamily.typeLocation: return Location
        case ItemFamily.typeAddress: return Address
        case ItemFamily.typeCountry: return Country
        case ItemFamily.typeMaterial: return Material
        case ItemFamily.typeMeasure: return Measure
        case ItemFamily.typeMediaObject: return MediaObject
        case ItemFamily.typeAudio: return Audio
        case ItemFamily.typePhoto: return Photo
        case ItemFamily.typeVideo: return Video
        case ItemFamily.typeMedicalCondition: return MedicalCondition
        case ItemFamily.typeMessageChannel: return MessageChannel
        case ItemFamily.typeModeOfTransport: return ModeOfTransport
        case ItemFamily.typeNavigationItem: return NavigationItem
        case ItemFamily.typeNetwork: return Network
        case ItemFamily.typeOffer: return Offer
        case ItemFamily.typeOpeningHours: return OpeningHours
        case ItemFamily.typeOption: return Option
        case ItemFamily.typeOrganization: return Organization
        case ItemFamily.typePerson: return Person
        case ItemFamily.typePhoneNumber: return PhoneNumber
        case ItemFamily.typePhysicalEntity: return PhysicalEntity
        case ItemFamily.typeProduct: return Product
        case ItemFamily.typeProductCode: return ProductCode
        case ItemFamily.typeReceipt: return Receipt
        case ItemFamily.typeReservation: return Reservation
        case ItemFamily.typeResource: return Resource
        case ItemFamily.typeRoute: return Route
        case ItemFamily.typeSetting: return Setting
        case ItemFamily.typeSpan: return Span
        case ItemFamily.typeTimeFrame: return TimeFrame
        case ItemFamily.typeTransaction: return Transaction
        case ItemFamily.typeTrip: return Trip
        case ItemFamily.typeUnit: return Unit
        case ItemFamily.typeUserState: return UserState
        case ItemFamily.typeViewArguments: return ViewArguments
        case ItemFamily.typeVote: return Vote
        case ItemFamily.typeVoteAction: return VoteAction
        case ItemFamily.typeWebsite: return Website
    }
}

/// An account or subscription, for instance for some online service, or a bank account or wallet.
export class Account extends Item {
    /// A handle.
    handle
    /// The name to display, for Persons this could be a first or last name, both, or a
    /// phonenumber.
    displayName
    /// The name quality used by Synapse.
    nameQuality
    /// Whether the Item should be displayed in the interfaces.
    enablePresence: boolean = false
    /// Whether you retrieve Messages from this Person.
    enableReceipts: boolean = false
    /// A service of any kind.
    service
    /// The type or (sub)category of some Item.
    type

    /// The Person this Item belongs to.
    get belongsTo() {
        return this.edges("belongsTo")?.items(Person)
    }

    /// The price or cost of an Item, typically for one instance of the Item or the
    /// defaultQuantity.
    get price() {
        return this.edges("price")?.items(Measure)
    }

    /// The location of for example where the event is happening, an organization is located, or
    /// where an action takes place.
    get location() {
        return this.edges("location")?.items(Location)
    }

    /// An organization, for instance an NGO, company or school.
    get organization() {
        return this.edges("organization")?.items(Organization)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// TBD
export class AuditItem extends Item {
    /// The date related to an Item.
    date: Date
    /// The content of an Item.
    content
    /// Some action that can be taken by some Item.
    action

    /// The Item this Item applies to.
    get appliesTo() {
        return this.edges("appliesTo")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// The most generic kind of creative work, including books, movies, photographs, software programs,
/// etc.
export class CreativeWork extends Item {
    /// The title of an Item.
    title
    /// An abstract is a short description that summarizes an Items content.
    abstract
    /// Date of first broadcast/publication.
    datePublished: Date
    /// Keywords or tags used to describe this content. Multiple entries in a keywords list are
    /// typically delimited by commas.
    keyword
    /// The content of an Item.
    content
    /// The plain text content of an Item, without styling or syntax for Markdown, HTML, etc.
    textContent
    /// If this MediaObject is an AudioObject or VideoObject, the transcript of that object.
    transcript
    /// The type or (sub)category of some Item.
    type

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

    /// The location where the Item was created, which may not be the same as the location
    /// depicted in the Item.
    get locationCreated() {
        return this.edges("locationCreated")?.items(Location)
    }

    /// A video object.
    get video() {
        return this.edges("video")?.items(Video)
    }

    /// The author of this Item.
    get writtenBy() {
        return this.edges("writtenBy")?.items(Person)
    }

    /// Any type of file that can be stored on disk.
    get file() {
        return this.edges("file")?.items(File)
    }

    /// The event where something is recorded.
    get recordedAt() {
        return this.edges("recordedAt")?.items(Event)
    }

    /// A review of the Item.
    get review() {
        return this.edges("review")?.items(Review)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Any kind of (video) game, typically rule-governed recreational activities.
export class Game extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// Instructions that explain how to achieve a result by performing a sequence of steps.
export class HowTo extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// A strategy of regulating the intake of food to achieve or maintain a specific health-related
/// goal.
export class Diet extends Item {
    /// The duration of an Item, for instance an event or an Audio file.
    duration

    /// An included Product.
    get includedProduct() {
        return this.edges("includedProduct")?.items(Product)
    }

    /// An excluded Product.
    get excludedProduct() {
        return this.edges("excludedProduct")?.items(Product)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Fitness-related activity designed for a specific health-related purpose, including defined
/// exercise routines as well as activity prescribed by a clinician.
export class ExercisePlan extends Item {
    /// The duration of an Item, for instance an event or an Audio file.
    duration
    /// The number of times something is repeated.
    repetitions

    /// The amount of energy something takes.
    get workload() {
        return this.edges("workload")?.items(Measure)
    }

    /// The frequency of an Item.
    get frequency() {
        return this.edges("frequency")?.items(Frequency)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A set of instructions for preparing a particular dish, including a list of the ingredients
/// required.
export class Recipe extends Item {
    /// The duration of an Item, for instance an event or an Audio file.
    duration
    /// A set of steps to reach a certain goal.
    instructions

    /// An ingredient of an Item.
    get ingredient() {
        return this.edges("ingredient")?.items(Product)
    }

    /// The price or cost of an Item, typically for one instance of the Item or the
    /// defaultQuantity.
    get price() {
        return this.edges("price")?.items(Measure)
    }

    /// The amount produced or financial return.
    get yields() {
        return this.edges("yields")?.items(Measure)
    }

    /// Some tool required by an Item.
    get toolRequired() {
        return this.edges("toolRequired")?.items(Product)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Any type of video, for instance a movie, TV show, animation etc.
export class MovingImage extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// A work of performing art, for instance dance, theater, opera or musical.
export class PerformingArt extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// A audio performance or production. Can be a single, album, radio show, podcast etc.
export class Recording extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// A work of visual arts, for instance a painting, sculpture or drawing.
export class VisualArt extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// A written work, for instance a book, article or note. Doesn't have to be published.
export class WrittenWork extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// An article, for instance from a journal, magazine or newspaper.
export class Article extends Item {
    /// A comment on this Item.
    get comment() {
        return this.edges("comment")?.items(Comment)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A comment.
export class Comment extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// A single message.
export class Message extends Item {
    /// The subject of some Item.
    subject
    /// Datetime when Item was sent.
    dateSent: Date
    /// Datetime when Item was received.
    dateReceived: Date

    /// A message channel this Item belongs to, for instance a WhatsApp chat.
    get messageChannel() {
        return this.edges("messageChannel")?.items(MessageChannel)
    }

    /// The sender of an Item.
    get sender() {
        return this.edges("sender")?.items(Account)
    }

    /// The account that received, or is to receive, this Item.
    get receiver() {
        return this.edges("receiver")?.items(Account)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A single email message.
export class EmailMessage extends Item {
    /// Accounts this Message is sent to beside the receiver.
    get cc() {
        return this.edges("cc")?.items(Account)
    }

    /// Accounts this Message is sent to beside the receiver, without showing this to the
    /// primary receiver.
    get bcc() {
        return this.edges("bcc")?.items(Account)
    }

    /// The Account that is replied to.
    get replyTo() {
        return this.edges("replyTo")?.items(Account)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A file containing a note.
export class Note extends Item {
    /// A comment on this Item.
    get comment() {
        return this.edges("comment")?.items(Comment)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A list in a note.
export class NoteList extends Item {
    /// Category of this item.
    category

    /// List occurs in Note.
    get noteList() {
        return this.edges("noteList")?.items(NoteList)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A review of an Item, for instance a Organization, CreativeWork, or Product.
export class Review extends Item {
    /// A rating is an evaluation using some Measure, for instance 1 to 5 stars.
    get rating() {
        return this.edges("rating")?.items(Measure)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A key used in an cryptography protocol.
export class CryptoKey extends Item {
    /// The type or (sub)category of some Item.
    type
    /// A role describes the function of the item in their context.
    role
    /// A piece of information that determines the functional output of a cryptographic
    /// algorithm.
    key
    /// Whether the item is active.
    active: boolean = false
    /// The name of the item.
    name

    constructor(decoder) {
        super(decoder)
    }
}

/// A business corporation.
export class Device extends Item {
    /// The Device ID, used for smartphones and tablets.
    deviceID
    /// The make number of a device, for instance a mobile phone.
    make
    /// The manufacturer of the Item
    manufacturer
    /// The model number or name of an Item, for instance of a mobile phone.
    model
    /// The name of the item.
    name
    /// The date this item was acquired.
    dateAcquired: Date
    /// The date this Item was lost.
    dateLost: Date

    constructor(decoder) {
        super(decoder)
    }
}

/// A Downloader is used to download data from an external source, to be imported using an Importer.
export class Downloader extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// Any kind of event, for instance a music festival or a business meeting.
export class Event extends Item {
    /// Intended group that would consume or receive this Item.
    audience
    /// The startTime of something. For a reserved event or service, the time that it is
    /// expected to start. For actions that span a period of time, when the action was performed. e.g.
    /// John wrote a book from January to December. For media, including audio and video, it's the time
    /// offset of the start of a clip within a larger file.
    startTime: Date
    /// The endTime of something. For a reserved event or service, the time that it is expected
    /// to end. For actions that span a period of time, when the action was performed. e.g. John wrote a
    /// book from January to December. For media, including audio and video, it's the time offset of the
    /// end of a clip within a larger file.
    endTime: Date
    /// The duration of an Item, for instance an event or an Audio file.
    duration
    /// The status of an event, for instance cancelled.
    eventStatus

    /// The location of for example where the event is happening, an organization is located, or
    /// where an action takes place.
    get location() {
        return this.edges("location")?.items(Location)
    }

    /// A review of the Item.
    get review() {
        return this.edges("review")?.items(Review)
    }

    /// Another (smaller) organization that is part of this Organization.
    get subEvent() {
        return this.edges("subEvent")?.items(Organization)
    }

    /// The capacity of an Item, for instance the maximum number of attendees of an Event.
    get capacity() {
        return this.edges("capacity")?.items(Measure)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Any type of file that can be stored on disk.
export class File extends Item {
    /// The blake2b hash of a resource.
    blake2b
    /// The sha256 hash of a resource.
    sha256
    /// The filename of a resource.
    filename

    /// A universal resource location
    get resource() {
        return this.edges("resource")?.items(Resource)
    }

    /// An Item this Item is used by.
    get usedBy() {
        return this.edges("usedBy")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// The number of occurrences of a repeating event per measure of time.
export class Frequency extends Item {
    /// The number of occurrences.
    occurrences

    constructor(decoder) {
        super(decoder)
    }
}

/// A generic attribute that can be referenced by an Item.
export class GenericAttribute extends Item {
    /// The name of the item.
    name
    /// A boolean value.
    boolValue: boolean = false
    /// A datetime value.
    datetimeValue: Date
    /// A floating point value.
    floatValue
    /// An integer value.
    intValue
    /// A string value.
    stringValue

    constructor(decoder) {
        super(decoder)
    }
}

/// An Importer is used to import data from an external source to the Pod database.
export class Importer extends Item {
    /// The name of the item.
    name
    /// The type of the data this Item acts on.
    dataType
    /// A graphic symbol to represent some Item.
    icon
    /// An image in the Xcode bundle.
    bundleImage

    /// A run of a certain Importer, that defines the details of the specific import.
    get importerRun() {
        return this.edges("importerRun")?.items(ImporterRun)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A run of a certain Importer, that defines the details of the specific import.
export class ImporterRun extends Item {
    /// The name of the item.
    name
    /// The type of the data this Item acts on.
    dataType

    /// An Importer is used to import data from an external source to the Pod database.
    get importer() {
        return this.edge("importer")?.target(Importer)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// An indexer enhances your personal data by inferring facts over existing data and adding those to
/// the database.
export class Indexer extends Item {
    /// The name of the item.
    name
    /// A graphic symbol to represent some Item.
    icon
    /// A Memri query that retrieves a set of Items from the Pod database.
    query
    /// An image in the Xcode bundle.
    bundleImage
    /// The destination of a run.
    runDestination
    /// The type of an Indexer.
    indexerClass

    /// A run of a certain Indexer, that defines the details of the specific indexing.
    get indexerRun() {
        return this.edges("indexerRun")?.items(IndexerRun)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A run of a certain Indexer.
export class IndexerRun extends Item {
    /// The name of the item.
    name
    /// A Memri query that retrieves a set of Items from the Pod database.
    query
    /// The progress an Item made. The number could be a (rounded) percentage or a count of a
    /// (potentially unknown) total.
    progress
    /// The type of data this Item targets.
    targetDataType

    /// An Indexer is used to enrich data in the Pod database.
    get indexer() {
        return this.edge("indexer")?.target(Indexer)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A sector that produces goods or related services within an economy.
export class Industry extends Item {
    /// The type or (sub)category of some Item.
    type

    constructor(decoder) {
        super(decoder)
    }
}

/// A Receipt is a confirmation of a transaction.
export class Invoice extends Item {
    /// Any type of file that can be stored on disk.
    get file() {
        return this.edge("file")?.target(File)
    }

    /// An agreement between a buyer and a seller to exchange an asset for payment.
    get transaction() {
        return this.edge("transaction")?.target(Transaction)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Attached to an Item, to mark it to be something.
export class Label extends Item {
    /// The color of this Item.
    color
    /// The name of the item.
    name

    /// A comment on this Item.
    get comment() {
        return this.edges("comment")?.items(Comment)
    }

    /// The Item this Item applies to.
    get appliesTo() {
        return this.edges("appliesTo")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A potential offer.
export class Lead extends Item {
    /// A potential offer.
    get offer() {
        return this.edges("offer")?.items(Offer)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// The location of something.
export class Location extends Item {
    /// The latitude of a location in WGS84 format.
    latitude
    /// The longitude of a location in WGS84 format.
    longitude

    constructor(decoder) {
        super(decoder)
    }
}

/// A postal address.
export class Address extends Item {
    /// A city or town.
    city
    /// The postal code. For example, 94043.
    postalCode
    /// A state or province of a country.
    state
    /// The street address. For example, 1600 Amphitheatre Pkwy.
    street
    /// The type or (sub)category of some Item.
    type
    /// A location with a automatic lookup hash.
    locationAutoLookupHash

    /// A country.
    get country() {
        return this.edge("country")?.target(Country)
    }

    /// The location of for example where the event is happening, an organization is located, or
    /// where an action takes place.
    get location() {
        return this.edge("location")?.target(Location)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A country.
export class Country extends Item {
    /// The name of the item.
    name

    /// The flag that represents some Item, for instance a Country.
    get flag() {
        return this.edge("flag")?.target(Photo)
    }

    /// The location of for example where the event is happening, an organization is located, or
    /// where an action takes place.
    get location() {
        return this.edge("location")?.target(Location)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A material that an Item is (partially) made from, for instance cotton, paper, steel, etc.
export class Material extends Item {
    /// The name of the item.
    name
    /// The default quantity, for instance 1 g or 0.25 L
    defaultQuantity

    /// The price or cost of an Item, typically for one instance of the Item or the
    /// defaultQuantity.
    get price() {
        return this.edges("price")?.items(Measure)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A measure consists of a definition, symbol, unit and value (int, float, string, bool, or
/// datetime).
export class Measure extends Item {
    /// The definition of an Item.
    definition
    /// A symbol, for instance to represent a Unit or Measure.
    symbol
    /// An integer value.
    intValue
    /// A floating point value.
    floatValue
    /// A string value.
    stringValue
    /// A datetime value.
    datetimeValue: Date
    /// A boolean value.
    boolValue: boolean = false

    /// A unit, typically from International System of Units (SI).
    get unit() {
        return this.edge("unit")?.target(Unit)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A media object, such as an image, video, or audio object embedded in a web page or a
/// downloadable dataset i.e. DataDownload. Note that a creative work may have many media objects
/// associated with it on the same web page. For example, a page about a single song (MusicRecording)
/// may have a music video (VideoObject), and a high and low bandwidth audio stream (2 AudioObject's).
export class MediaObject extends Item {
    /// The bitrate of a media object.
    bitrate
    /// The duration of an Item, for instance an event or an Audio file.
    duration
    /// The endTime of something. For a reserved event or service, the time that it is expected
    /// to end. For actions that span a period of time, when the action was performed. e.g. John wrote a
    /// book from January to December. For media, including audio and video, it's the time offset of the
    /// end of a clip within a larger file.
    endTime: Date
    /// Location of the actual bytes of a File.
    fileLocation
    /// The startTime of something. For a reserved event or service, the time that it is
    /// expected to start. For actions that span a period of time, when the action was performed. e.g.
    /// John wrote a book from January to December. For media, including audio and video, it's the time
    /// offset of the start of a clip within a larger file.
    startTime: Date

    /// Any type of file that can be stored on disk.
    get file() {
        return this.edge("file")?.target(File)
    }

    /// Items included within this Item. Included Items can be of any type.
    get includes() {
        return this.edges("includes")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// An audio file.
export class Audio extends Item {
    /// The caption for this object. For downloadable machine formats (closed caption, subtitles
    /// etc.) use MediaObject and indicate the encodingFormat.
    caption
    /// If this MediaObject is an AudioObject or VideoObject, the transcript of that object.
    transcript

    constructor(decoder) {
        super(decoder)
    }
}

/// An image file.
export class Photo extends Item {
    /// The caption for this object. For downloadable machine formats (closed caption, subtitles
    /// etc.) use MediaObject and indicate the encodingFormat.
    caption
    /// Exif data of an image file.
    exifData
    /// The name of the item.
    name

    /// Thumbnail image for an Item, typically an image or video.
    get thumbnail() {
        return this.edge("thumbnail")?.target(File)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A video file.
export class Video extends Item {
    /// The caption for this object. For downloadable machine formats (closed caption, subtitles
    /// etc.) use MediaObject and indicate the encodingFormat.
    caption
    /// Exif data of an image file.
    exifData
    /// The name of the item.
    name

    /// Thumbnail image for an Item, typically an image or video.
    get thumbnail() {
        return this.edges("thumbnail")?.items(File)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Any condition of the human body that affects the normal functioning of a person, whether
/// physically or mentally. Includes diseases, injuries, disabilities, disorders, syndromes, etc.
export class MedicalCondition extends Item {
    /// The type or (sub)category of some Item.
    type
    /// The name of the item.
    name

    constructor(decoder) {
        super(decoder)
    }
}

/// A chat is a collection of messages.
export class MessageChannel extends Item {
    /// The name of the item.
    name
    /// The topic of an item, for instance a Chat.
    topic
    /// Whether the item is encrypted.
    encrypted: boolean = false

    /// A photo object.
    get photo() {
        return this.edges("photo")?.items(Photo)
    }

    /// The account that received, or is to receive, this Item.
    get receiver() {
        return this.edges("receiver")?.items(Account)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A way of transportation, for instance a bus or airplane.
export class ModeOfTransport extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// TBD
export class NavigationItem extends Item {
    /// The title of an Item.
    title
    /// Name of a Session.
    sessionName
    /// Used to define position in a sequence, enables ordering based on this number.
    sequence
    /// The type or (sub)category of some Item.
    type

    constructor(decoder) {
        super(decoder)
    }
}

/// A group or system of interconnected people or things, for instance a social network.
export class Network extends Item {
    /// The name of the item.
    name

    /// An organization, for instance an NGO, company or school.
    get organization() {
        return this.edge("organization")?.target(Organization)
    }

    /// A universal resource location
    get resource() {
        return this.edges("resource")?.items(Resource)
    }

    /// A WebSite is a set of related web pages and other items typically served from a single
    /// web domain and accessible via URLs.
    get website() {
        return this.edges("website")?.items(Website)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// An offer for some transaction, for instance to buy something or to get some service.
export class Offer extends Item {
    /// An agreement between a buyer and a seller to exchange an asset for payment.
    get transaction() {
        return this.edges("transaction")?.items(Transaction)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Hours that an organization is open.
export class OpeningHours extends Item {
    /// A timeframe.
    get timeFrame() {
        return this.edges("timeFrame")?.items(TimeFrame)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// An option for some choice, for instance a Vote.
export class Option extends Item {
    constructor(decoder) {
        super(decoder)
    }
}

/// An organization, for instance an NGO, company or school.
export class Organization extends Item {
    /// The name of the item.
    name
    /// Date that the Item was founded.
    dateFounded: Date
    /// The area that this Item operates in.
    areaServed
    /// A fiscal identifier.
    taxId

    /// Physical address of the event or place.
    get address() {
        return this.edges("address")?.items(Address)
    }

    /// The place where the Item was founded.
    get foundingLocation() {
        return this.edges("foundingLocation")?.items(Location)
    }

    /// A logo that belongs to an Item
    get logo() {
        return this.edges("logo")?.items(Photo)
    }

    /// A review of the Item.
    get review() {
        return this.edges("review")?.items(Review)
    }

    /// Another (smaller) Event that takes place at this Event
    get subOrganization() {
        return this.edges("subOrganization")?.items(Event)
    }

    /// The Event this Item organizes.
    get performsAt() {
        return this.edges("performsAt")?.items(Event)
    }

    /// The Event this Item attends.
    get attends() {
        return this.edges("attends")?.items(Event)
    }

    /// The Event this Item attends.
    get organizes() {
        return this.edges("organizes")?.items(Event)
    }

    /// Hours that an organization is open.
    get openingHours() {
        return this.edges("openingHours")?.items(OpeningHours)
    }

    /// A sector that produces goods or related services within an economy.
    get industry() {
        return this.edges("industry")?.items(Industry)
    }

    /// The buying party in a transaction.
    get buyer() {
        return this.edges("buyer")?.items(Transaction)
    }

    /// The buying party in a transaction.
    get seller() {
        return this.edges("seller")?.items(Transaction)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A person (alive, dead, undead, or fictional).
export class SchemaPerson extends Item {
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
    /// Gender of something, typically a Person, but possibly also fictional characters,
    /// animals, etc.
    gender
    /// The sexual orientation of a person.
    sexualOrientation
    /// The name to display, for Persons this could be a first or last name, both, or a
    /// phonenumber.
    displayName
    /// The name quality used by Synapse.
    nameQuality
    /// Whether the Item should be displayed in the interfaces.
    enablePresence: boolean = false
    /// Whether you retrieve Messages from this Person.
    enableReceipts: boolean = false
    /// A role describes the function of the item in their context.
    role

    /// Physical address of the event or place.
    get address() {
        return this.edges("address")?.items(Address)
    }

    /// The place where the person was born.
    get birthPlace() {
        return this.edge("birthPlace")?.target(Location)
    }

    /// The place where someone or something died, typically a Person.
    get deathPlace() {
        return this.edge("deathPlace")?.target(Location)
    }

    /// A photo that corresponds to some Person or other kind of profile.
    get profilePicture() {
        return this.edge("profilePicture")?.target(Photo)
    }

    /// A relation between two persons.
    get relationship() {
        return this.edges("relationship")?.items(Person)
    }

    /// A phone number that belongs to an Item.
    get hasPhoneNumber() {
        return this.edges("hasPhoneNumber")?.items(PhoneNumber)
    }

    /// A WebSite is a set of related web pages and other items typically served from a single
    /// web domain and accessible via URLs.
    get website() {
        return this.edges("website")?.items(Website)
    }

    /// A sector that produces goods or related services within an economy.
    get industry() {
        return this.edges("industry")?.items(Industry)
    }

    /// A crypto key used in a cryptography protocol.
    get cryptoKey() {
        return this.edges("cryptoKey")?.items(CryptoKey)
    }

    /// An account or subscription, for instance for some online service, or a bank account or
    /// wallet.
    get account() {
        return this.edges("account")?.items(Account)
    }

    /// A strategy of regulating the intake of food to achieve or maintain a specific
    /// health-related goal.
    get diet() {
        return this.edges("diet")?.items(Diet)
    }

    /// Any condition of the human body that affects the normal functioning of a person, whether
    /// physically or mentally. Includes diseases, injuries, disabilities, disorders, syndromes, etc.
    get medicalCondition() {
        return this.edges("medicalCondition")?.items(MedicalCondition)
    }

    /// The organization this Item is a member of.
    get memberOf() {
        return this.edges("memberOf")?.items(Organization)
    }

    /// The Event this Item organizes.
    get performsAt() {
        return this.edges("performsAt")?.items(Event)
    }

    /// The Event this Item attends.
    get attends() {
        return this.edges("attends")?.items(Event)
    }

    /// The Event this Item attends.
    get organizes() {
        return this.edges("organizes")?.items(Event)
    }

    /// The Organization this Item has founded.
    get founded() {
        return this.edges("founded")?.items(Organization)
    }

    /// The buying party in a transaction.
    get buyer() {
        return this.edges("buyer")?.items(Transaction)
    }

    /// The buying party in a transaction.
    get seller() {
        return this.edges("seller")?.items(Transaction)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A telephone number.
export class PhoneNumber extends Item {
    /// A phone number with an area code.
    phoneNumber
    /// The type or (sub)category of some Item.
    type

    constructor(decoder) {
        super(decoder)
    }
}

/// Some object that exists in the real world.
export class PhysicalEntity extends Item {
    /// The Person this Item belongs to.
    get belongsTo() {
        return this.edges("belongsTo")?.items(Person)
    }

    /// An instance of an Item, for instance the PhysicalEntity instance of a Book.
    get instanceOf() {
        return this.edges("instanceOf")?.itemsArray()
    }

    /// The location of for example where the event is happening, an organization is located, or
    /// where an action takes place.
    get location() {
        return this.edges("location")?.items(Location)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Any product.
export class Product extends Item {
    /// Intended group that would consume or receive this Item.
    audience
    /// The color of this Item.
    color
    /// The manufacturer of the Item
    manufacturer
    /// The model number or name of an Item, for instance of a mobile phone.
    model
    /// A repeated decorative design.
    pattern
    /// The date this item was acquired.
    dateAcquired: Date
    /// A description of the condition of a product, for instance new.
    productCondition
    /// The date the Item was produced.
    dateProduced: Date
    /// Date of first broadcast/publication.
    datePublished: Date
    /// A service of any kind.
    service

    /// The material the Item is (partially) made of.
    get material() {
        return this.edges("material")?.items(Material)
    }

    /// A type of code related to a Product.
    get productCode() {
        return this.edges("productCode")?.items(ProductCode)
    }

    /// A review of the Item.
    get review() {
        return this.edges("review")?.items(Review)
    }

    /// Product fo which this Item is a spare part or accessory.
    get accessoryOrSparePartFor() {
        return this.edges("accessoryOrSparePartFor")?.items(Product)
    }

    /// Product that consumes this Item, for instance the printer that takes this ink
    /// cartridge.
    get consumableBy() {
        return this.edges("consumableBy")?.items(Product)
    }

    /// The price or cost of an Item, typically for one instance of the Item or the
    /// defaultQuantity.
    get price() {
        return this.edges("price")?.items(Measure)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A code or number used to identify Products, for instance a UPC or GTIN.
export class ProductCode extends Item {
    /// An identifier type for Products, for instance a UPC or GTIN.
    productCodeType
    /// An identifier for Products, for instance a UPC or GTIN.
    productNumber

    constructor(decoder) {
        super(decoder)
    }
}

/// A bill that describes money owed for some Transaction.
export class Receipt extends Item {
    /// The date something is due.
    dateDue: Date

    /// Any type of file that can be stored on disk.
    get file() {
        return this.edge("file")?.target(File)
    }

    /// An agreement between a buyer and a seller to exchange an asset for payment.
    get transaction() {
        return this.edge("transaction")?.target(Transaction)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// Describes a reservation, for instance for a Route or Event, or at a Organization.
export class Reservation extends Item {
    /// Reservation date.
    dateReserved: Date
    /// The status of a reservation, for instance cancelled.
    reservationStatus

    /// An organization, for instance an NGO, company or school.
    get organization() {
        return this.edges("organization")?.items(Organization)
    }

    /// A route from one Location to another, using some ModeOfTransport.
    get route() {
        return this.edges("route")?.items(Route)
    }

    /// The Person who made this reservation.
    get reservedBy() {
        return this.edges("reservedBy")?.items(Person)
    }

    /// A Person for whom this reservation was made.
    get reservedFor() {
        return this.edges("reservedFor")?.items(Person)
    }

    /// The price or cost of an Item, typically for one instance of the Item or the
    /// defaultQuantity.
    get price() {
        return this.edges("price")?.items(Measure)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A universal resource location
export class Resource extends Item {
    /// The url property represents the Uniform Resource Location (URL) of a resource.
    url

    /// An Item this Item is used by.
    get usedBy() {
        return this.edges("usedBy")?.itemsArray()
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A route from one Location to another, using some ModeOfTransport.
export class Route extends Item {
    /// The startTime of something. For a reserved event or service, the time that it is
    /// expected to start. For actions that span a period of time, when the action was performed. e.g.
    /// John wrote a book from January to December. For media, including audio and video, it's the time
    /// offset of the start of a clip within a larger file.
    startTime: Date
    /// The endTime of something. For a reserved event or service, the time that it is expected
    /// to end. For actions that span a period of time, when the action was performed. e.g. John wrote a
    /// book from January to December. For media, including audio and video, it's the time offset of the
    /// end of a clip within a larger file.
    endTime: Date

    /// A way of transportation, for instance a bus or airplane.
    get modeOfTransport() {
        return this.edges("modeOfTransport")?.items(ModeOfTransport)
    }

    /// The location where some Item starts, for instance the start of a route.
    get startLocation() {
        return this.edges("startLocation")?.items(Location)
    }

    /// The location where some Item ends, for instance the destination of a route.
    get endLocation() {
        return this.edges("endLocation")?.items(Location)
    }

    /// The price or cost of an Item, typically for one instance of the Item or the
    /// defaultQuantity.
    get price() {
        return this.edges("price")?.items(Measure)
    }

    /// A Receipt is a confirmation of a transaction.
    get receipt() {
        return this.edges("receipt")?.items(Receipt)
    }

    /// A ticket for an Event or Route.
    get ticket() {
        return this.edges("ticket")?.items(File)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A setting, named by a key, specifications in JSON format.
export class Setting extends Item {
    /// A piece of information that determines the functional output of a cryptographic
    /// algorithm.
    key
    /// A string in JSON (JavaScript Object Notation) format.
    json

    constructor(decoder) {
        super(decoder)
    }
}

/// A class that represents a position of an element in a string.
export class Span extends Item {
    /// Start position of an element.
    startIdx
    /// End position of an element.
    endIdx

    constructor(decoder) {
        super(decoder)
    }
}

/// A specified period of time in which something occurs or is planned to take place.
export class TimeFrame extends Item {
    /// The startTime of something. For a reserved event or service, the time that it is
    /// expected to start. For actions that span a period of time, when the action was performed. e.g.
    /// John wrote a book from January to December. For media, including audio and video, it's the time
    /// offset of the start of a clip within a larger file.
    startTime: Date
    /// The endTime of something. For a reserved event or service, the time that it is expected
    /// to end. For actions that span a period of time, when the action was performed. e.g. John wrote a
    /// book from January to December. For media, including audio and video, it's the time offset of the
    /// end of a clip within a larger file.
    endTime: Date

    constructor(decoder) {
        super(decoder)
    }
}

/// An agreement between a buyer and a seller to exchange an asset for payment.
export class Transaction extends Item {
    /// Whether the Item is deleted.
    orderStatus: boolean = false
    /// Identifier of a transaction.
    orderNumber
    /// Can be used to get a discount.
    discountCode
    /// The date this Item was lost.
    dateOrdered: Date
    /// Date of execution.
    dateExecuted: Date

    /// The location depicted or described in the content. For example, the location in a
    /// photograph or painting.
    get purchaseLocation() {
        return this.edges("purchaseLocation")?.items(Location)
    }

    /// Any Product.
    get product() {
        return this.edges("product")?.items(Product)
    }

    /// The address associated with financial purchases.
    get billingAddress() {
        return this.edges("billingAddress")?.items(Address)
    }

    /// The Account used to pay.
    get payedWithAccount() {
        return this.edges("payedWithAccount")?.items(Account)
    }

    /// A discount or price reduction.
    get discount() {
        return this.edges("discount")?.items(Measure)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A trip or journey, consisting of Routes.
export class Trip extends Item {
    /// The startTime of something. For a reserved event or service, the time that it is
    /// expected to start. For actions that span a period of time, when the action was performed. e.g.
    /// John wrote a book from January to December. For media, including audio and video, it's the time
    /// offset of the start of a clip within a larger file.
    startTime: Date
    /// The endTime of something. For a reserved event or service, the time that it is expected
    /// to end. For actions that span a period of time, when the action was performed. e.g. John wrote a
    /// book from January to December. For media, including audio and video, it's the time offset of the
    /// end of a clip within a larger file.
    endTime: Date

    /// A route from one Location to another, using some ModeOfTransport.
    get route() {
        return this.edges("route")?.items(Route)
    }

    /// The location where some Item starts, for instance the start of a route.
    get startLocation() {
        return this.edges("startLocation")?.items(Location)
    }

    /// The location where some Item ends, for instance the destination of a route.
    get endLocation() {
        return this.edges("endLocation")?.items(Location)
    }

    /// The price or cost of an Item, typically for one instance of the Item or the
    /// defaultQuantity.
    get price() {
        return this.edges("price")?.items(Measure)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A unit, typically from International System of Units (SI).
export class Unit extends Item {
    /// A symbol, for instance to represent a Unit or Measure.
    symbol
    /// The name of the item.
    name

    constructor(decoder) {
        super(decoder)
    }
}

/// An occasion where a choice is made choose between two or more options, for instance an election.
export class Vote extends Item {
    /// The type or (sub)category of some Item.
    type

    /// An option for some choice, for instance a Vote.
    get option() {
        return this.edges("option")?.items(Option)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// The act casting a vote.
export class VoteAction extends Item {
    /// Date of execution.
    dateExecuted: Date

    /// An occasion where a choice is made choose between two or more options, for instance an
    /// election.
    get vote() {
        return this.edges("vote")?.items(Vote)
    }

    /// An Item this Item is used by.
    get usedBy() {
        return this.edges("usedBy")?.itemsArray()
    }

    /// A chosen Option.
    get choice() {
        return this.edges("choice")?.items(Option)
    }

    constructor(decoder) {
        super(decoder)
    }
}

/// A Website is a set of related web pages and other items typically served from a single web
/// domain and accessible via URLs.
export class Website extends Item {
    /// The type or (sub)category of some Item.
    type
    /// The url property represents the Uniform Resource Location (URL) of a resource.
    url

    constructor(decoder) {
        super(decoder)
    }
}

export function dataItemListToArray(object) {
    var collection = []
    if (!Array.isArray(object) || !object.length) return
    if (object[0] instanceof Item) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Account) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof AuditItem) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof CreativeWork) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Game) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof HowTo) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Diet) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof ExercisePlan) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Recipe) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof MovingImage) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof PerformingArt) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Recording) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof VisualArt) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof WrittenWork) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Article) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Comment) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Message) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof EmailMessage) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Note) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof NoteList) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Review) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof CryptoKey) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof CVUStateDefinition) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof CVUStoredDefinition) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Device) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Downloader) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Edge) { return object.itemsArray() }
    else if (object[0] instanceof Event) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof File) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Frequency) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof GenericAttribute) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Importer) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof ImporterRun) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Indexer) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof IndexerRun) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Industry) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Invoice) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Label) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Lead) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Location) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Address) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Country) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Material) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Measure) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof MediaObject) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Audio) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Photo) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Video) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof MedicalCondition) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof MessageChannel) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof ModeOfTransport) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof NavigationItem) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Network) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Offer) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof OpeningHours) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Option) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Organization) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Person) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof PhoneNumber) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof PhysicalEntity) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Product) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof ProductCode) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Receipt) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Reservation) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Resource) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Route) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Setting) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Span) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof TimeFrame) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Transaction) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Trip) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Unit) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Vote) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof VoteAction) { object.forEach(function (item) {collection.push(item)}) }
    else if (object[0] instanceof Website) { object.forEach(function (item) {collection.push(item)}) }

    return collection
}

// Other.swift/ts

Object.assign(Note.prototype,{
    get computedTitle() {
        return `${this.title ?? ""}`
    }
});

Object.assign(PhoneNumber.prototype,{
    get computedTitle() {
        return `${this.phoneNumber ?? ""}`
    }
});

Object.assign(Website.prototype,{
    get computedTitle() {
        return `${this.url ?? ""}`
    }
});

Object.assign(Country.prototype,{
    get computedTitle() {
        return `${this.name ?? ""}`
    }
});

Object.assign(Address.prototype, {
    get computedTitle() {
        return `${this.street ?? ""}
${this.city ?? ""}
${this.postalCode == undefined ? "" : this.postalCode! + ","} ${this.state ?? ""}
${this.edge("country")?.item()?.computedTitle ?? ""}`
    }
});

Object.assign(Organization.prototype,{
    get computedTitle() {
        return `${this.name ?? ""}`
    }
});

Object.assign(Account.prototype,{
    get computedTitle() {
        return `${this.handle ?? ""}`
    }
});

Object.assign(Diet.prototype,{
    get computedTitle() {
        return `${this.itemType ?? ""}`
    }
});

Object.assign(MedicalCondition.prototype,{
    get computedTitle() {
        return `${this.itemType ?? ""}`
    }
});

Object.assign(Network.prototype,{
    get computedTitle() {
        return `${this.name ?? ""}`
    }
});

export class Person extends SchemaPerson {
    get computedTitle(): string {
        return `${this.fullName}`
    }

    get computedVars() {
        return [
            new ComputedPropertyLink("fullName", "string"),
            new ComputedPropertyLink("age", "int")
        ]
    }

    // Full name in western style (first last)
    get fullName(): string {
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
        //functions["fullName"] = { _ in self.fullName }
    }
}

Object.assign(AuditItem.prototype,{
    get computedTitle() {
        return `Logged ${this.action ?? "unknown action"} on ${this.date?.description ?? ""}`
    },
    constructor(date?, content?, action?, appliesTo?) {
        this.date = date ?? this.date
        this.content = content ?? this.content
        this.action = action ?? this.action

        if (appliesTo) {
            for (let item of appliesTo) {
                this.link(item, "appliesTo");
            }
        }
    }
});

Object.assign(Label.prototype,{
    get computedTitle() {
        return `${this.name ?? ""}`
    }
});

Object.assign(Photo.prototype,{
    get computedTitle() {
        return `${this.caption ?? ""}`
    }
});

Object.assign(Video.prototype,{
    get computedTitle() {
        return `${this.caption ?? ""}`
    }
});

Object.assign(Audio.prototype,{
    get computedTitle() {
        return `${this.caption ?? ""}`
    }
});

Object.assign(Importer.prototype,{
    get computedTitle() {
        return `${this.name ?? ""}`
    }
});

Object.assign(Indexer.prototype,{
    get computedTitle() {
        return `${this.name ?? ""}`
    },
    constructor(name?: string, itemDescription?: string, query?: string, icon?: string, bundleImage?: string, runDestination?: string){
        this.name = name ?? this.name
        this.itemDescription = itemDescription ?? this.itemDescription
        this.query = query ?? this.query
        this.icon = icon ?? this.icon
        this.bundleImage = bundleImage ?? this.bundleImage
        this.runDestination = runDestination ?? this.runDestination
    }
});

Object.assign(IndexerRun.prototype,{
    constructor(name?: string, query?: string, indexer?: Indexer, progress?: number){
        this.name = name ?? this.name
        this.query = query ?? this.query
        this.query = query ?? this.query
        this.progress = progress ?? this.progress

        if (indexer) { this.set("indexer", indexer) }
    }
});

export class CVUStoredDefinition extends Item {
    get computedTitle() {
        //#warning("Parse and then create a proper string representation")
        if (this.name && this.name != "") { return this.name }
        return "[No Name]"
    }
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
            "itemType": stored.type
        })
    }

    static fromCVUParsedDefinition(parsed: CVUParsedDefinition) {
        return CacheMemri.createItem("CVUStateDefinition", {
            "definition": parsed.toCVUString(0, "    "),
            "domain": "state",
            "name": parsed.name,
//            "query": stores.query,
            "selector": parsed.selector,
            "itemType": parsed.definitionType
        })
    }

    constructor(objectFromRealm) {
        super(objectFromRealm);
        for (let key in objectFromRealm) {
            this[key] = objectFromRealm[key];
        }
    }
}
