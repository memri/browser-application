import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";
import {Views} from "../../cvu/views/Views";
import {settings} from "../Settings";
import {getItemType, ItemFamily, SchemaItem} from "../schema";
import {jsonDataFromFile, MemriJSONDecoder, MemriJSONEncoder, realmWriteIfAvailable, unserialize} from "../../gui/util";
import {ExprInterpreter} from "../../parsers/expression-parser/ExprInterpreter";
import {CacheMemri} from "../Cache";
import {debugHistory} from "../../cvu/views/ViewDebugger";
import {DatabaseController} from "../DatabaseController";

enum ItemError {
    cannotMergeItemWithDifferentId
}

export class Item extends SchemaItem {
    /// Title computed by implementations of the Item class
    get computedTitle() {
        return `${this.genericType} [${this.uid.value ?? -1000}]`
    }

    functions = {}

    /// Primary key used in the realm database of this Item
    primaryKey() {
            return "uid"
        }

    get toString() {
        var str = `${this.genericType} ${this.realm == undefined ? "[UNMANAGED] " : ""}{\n`
            + `    uid: ${this.uid.value == undefined ? "null" : String(this.uid.value ?? 0)}\n`
            + `    _updated: ${this["_updated"].length == 0 ? "[]" : `[${this["_updated"].join(", ")}]`}\n`
            + "    " + this.objectSchema.properties
                .filter(item => {
                    return this[item.name] != undefined && item.name != "allEdges"
                        && item.name != "uid" && item.name != "_updated"
                })
                .map(item => {
                    `${item.name}: ${new CVUSerializer().valueToString(this[item.name])}`
                })
                .join("\n    ");


        str += (this.allEdges.length > 0 ? "\n\n    " : "")
            + this.allEdges
                .map(item => {
                    item.toString()
                })
                .join("\n    ")
            + "\n}"

        return str
    }

    get changelog() {
        return this.edges("changelog")?.items(AuditItem.constructor); //TODO:
    }

    constructor() {
        super();

        this.functions["describeChangelog"] = function () {
            let dateCreated = Views.formatDate(this.dateCreated);
            let views = this.changelog?.filter(item => {
                return item.action == "read"
            }).length ?? 0;
            let edits = this.changelog?.filter(item => {
                return item.action == "update"
            }).length ?? 0
            let timeSinceCreated = Views.formatDateSinceCreated(this.dateCreated);
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
        if (this.objectSchema[name] == undefined) {
            //#if DEBUG
            console.log(`Warning: getting property that this item doesnt have: ${name} for ${this.genericType}:${this.uid.value ?? -1000}`)
            //#endif

            return ""
        } else {
            return new ExprInterpreter().evaluateString(this[name]); //TODO
        }
    }

    /// Get the type of Item
    /// - Returns: type of the Item
    getType() {
        let type = ItemFamily[this.genericType];
        if (type) {
            let T = getItemType(type)
            // NOTE: allowed forced downcast
            return (new T())
        } else {
            console.log(`Cannot find type ${this.genericType} in ItemFamily`)
            return null
        }
    }

    /// Determines whether item has property
    /// - Parameter propName: name of the property
    /// - Returns: boolean indicating whether Item has the property
    hasProperty(propName: string) {
        for (let prop of this.objectSchema.properties) {
            if (prop.name == propName) {
                return true
            }
            let haystack = this[prop.name];
            if (typeof haystack == "string") {
                if (haystack.toLowerCase().indexOf(propName.toLowerCase()) > -1) {
                    return true
                }
            }
        }

        return false
    }

    /// Get property value
    /// - Parameters:
    ///   - name: property name
    get(name: string) {
        if (this.objectSchema[name] != undefined) {
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
        DatabaseController.writeSync(function () {
            let schema = this.objectSchema[name];
            if (schema) {
                if (this.isEqualValue(this[name], value))
                    return;
                switch (schema.type) {
                    case "number":
                        this[name] = Number(value)
                        break;
                    default:
                        this[name] = value
                }

                this.modified([name])
            } else if (value) {
                let obj = value;
                this.link(obj, name, true)
            } else if (Array.isArray(value)) {
                let list = value;
                for (let obj of list) {
                    this.link(obj, name);
                }
            }
            this.dateModified = new Date() // Update DateModified
        }.bind(this))
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
        if (this.realm && !this.uid.value) {
            return null;
        }

        // TODO: collection support
        //#warning("Not implemented fully yet")

        // Should this create a temporary edge for which item() is source() ?
        return this.realm?.objects("Edge") //TODO:
            .filtered(`targetItemID = ${this.uid} AND type = '${edgeType}`)
    }

    reverseEdge(edgeType: string) {
        if (this.realm && !this.uid.value) {
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
            let filter = `deleted = false and (type = '${flattened.join("' or type = '")}')`;

            return this.allEdges.filtered(filter)
        } else {
            if (edgeType == "" && this.realm == undefined) {
                return null;
            }
            let collection = this.edgeCollection(edgeType);
            if (collection) {
                return this.edges(collection)
            }

            return this.allEdges.filtered(`deleted = false AND type = '${edgeType}'`)
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
                orderNumber = sequence.value; //TODO
                break;
            case EdgeSequencePosition.first:
                var sorted = edges.sorted("sequence", false) //TODO:
                let firstOrderNumber = sorted[0]?.sequence.value;
                if (firstOrderNumber) {
                    orderNumber = Math.round(firstOrderNumber / 2) //TODO:

                    if (orderNumber == firstOrderNumber) {
                        // TODO: renumber the entire list
                        throw "Not implemented yet"
                    }
                }
                break;
            case EdgeSequencePosition.last:
                var sorted = edges.sort("sequence", true) //TODO:
                let lastOrderNumber = sorted[0]?.sequence.value;
                if (lastOrderNumber) {
                    orderNumber = lastOrderNumber + 1000
                }
                break;
            case EdgeSequencePosition.before:
                let beforeEdge = sequence.value;
                if (!this.allEdges.indexOf(beforeEdge) > -1 || beforeEdge.type != edgeType) {
                    throw "Edge is not part of this set"
                }
                let beforeNumber = beforeEdge.sequence.value;
                if (!beforeNumber) { //TODO
                    throw "Before edge is not part of an ordered list"
                }

                let beforeBeforeEdge = edges
                    .filtered(`deleted = false AND sequence < ${beforeNumber}`)
                    .sorted("sequence", true)[0];

                let previousNumber = (beforeBeforeEdge?.sequence.value ?? 0)
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
                let afterEdge = sequence.value;
                if (!this.allEdges.indexOf(afterEdge) > -1 || afterEdge.type != edgeType) {
                    throw "Edge is not part of this set"
                }
                let afterNumber = afterEdge.sequence.value;
                if (!afterNumber) {
                    throw "Before edge is not part of an ordered list"
                }

                let afterAfterEdge = edges
                    .filtered(`deleted = false AND sequence < ${afterNumber}`)
                    .sorted("sequence", true)[0] //TODO:

                let nextNumber = (afterAfterEdge?.sequence.value ?? 0)
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
        if (item.objectSchema["uid"] != undefined && typeof targetID == "number") {

        } else {
            throw "Exception: Missing uid on target"
        }

        if (edgeType == "") {
            throw "Exception: Edge type is not set"
        }

        let query = `deleted = false and type = '${edgeType}'`
            + (distinct ? "" : ` and targetItemID = ${targetID}`)
        var edge = this.allEdges.filtered(query)[0] //TODO
        let sequenceNumber = this.determineSequenceNumber(edgeType, sequence);

        DatabaseController.writeSync(function () {
            if (item.realm == undefined && item instanceof Item) {
                item["_action"] = "create"
                this.realm?.add(item, ".modified") //TODO
            }

            if (edge == undefined) {
                edge = new CacheMemri().createEdge(
                    this,
                    item,
                    edgeType,
                    label,
                    sequenceNumber
                )
                if (edge) {
                    this.allEdges.push(edge);
                }
            } else if (overwrite && edge) {
                edge.targetItemID.value = targetID
                edge.targetItemType = item.genericType
                edge.sequence.value = sequenceNumber
                edge.edgeLabel = label

                if (edge["_action"] == undefined) {
                    edge["_action"] = "update"
                }
            } else if (edge == undefined) {
                throw "Exception: Could not create link"
            }
        })

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
        if (edge instanceof Edge) {
            if (edge.sourceItemID.value == this.uid.value && edge.sourceItemType == this.genericType) {
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
        if (this.objectSchema[name]?.type != "boolean") {
            throw `'${name}' is not a boolean property`
        }

        let val = Boolean(this[name]) ?? false
        this.set(name, !val);
    }

    /// Compares value of this Items property with the corresponding property of the passed items property
    /// - Parameters:
    ///   - propName: name of the compared property
    ///   - item: item to compare against
    /// - Returns: boolean indicating whether the property values are the same
    isEqualProperty(propName: string, item: Item) {
        let prop = this.objectSchema[propName];
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
        let properties = this.objectSchema.properties
        for (let prop of properties) {
            // Exclude SyncState
            if (prop.name == "_updated" || prop.name == "_action" || prop.name == "_partial"
                || prop.name == "deleted" || prop.name == "_changedInSession" || prop.name == "uid") {
                continue
            }

            // Perhaps not needed:
            // - TODO needs to detect lists which will always be set
            // - TODO needs to detect optionals which will always be set

            // Overwrite only the property values that are not already set
            if (mergeDefaults) {
                if (this[prop.name] == undefined) {
                    this[prop.name] = item[prop.name]
                }
            }
                // Overwrite all property values with the values from the passed item, with the
            // exception, that values cannot be set ot nil
            else {
                if (item[prop.name] != undefined) {
                    this[prop.name] = item[prop.name]
                }
            }
        }
    }

    /// update the dateAccessed property to the current date
    accessed() {
        let safeSelf = ItemReference(this) //TODO:
        DatabaseController.writeAsync((realm) => {
            let item = safeSelf.resolve();
            if (!item) {
                return
            }
            item.dateAccessed = new Date()

            let auditItem = CacheMemri.createItem(AuditItem.constructor, {"action": "read"});
            item.link(auditItem, "changelog");
        });
    }

    /// update the dateAccessed property to the current date
    modified(updatedFields: string[]) {
        let safeSelf = ItemReference(this) //TODO:
        DatabaseController.writeAsync((realm: Realm) => {
            let item = safeSelf.resolve();
            if (!item) {
                return
            }

            let previousModified = item.dateModified
            item.dateModified = new Date()

            for (let field of updatedFields) {
                if (!item["_updated"].includes(field)) {
                    item["_updated"].push(field)
                }
            }

            if (previousModified?.distance(new Date()) ?? 0 < 300) /* 5 minutes */ {
                //#warning("Test that .last gives the last added audit item")
                let auditItem = item.edges("changelog")?.last?.item(AuditItem.constructor);
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
            }

            var dict = {}
            for (let field of updatedFields) {
                if (item.objectSchema[field] == undefined) {
                    throw "Invalid update call"
                }
                dict[field] = item[field]
            }

            let content = String(MemriJSONEncoder(dict)) ?? ""
            let auditItem = CacheMemri.createItem(
                AuditItem.constructor, {
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
        lhs.uid.value == rhs.uid.value
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

        let itemType = dict["_type"]?.value;
        if (typeof itemType != "string") {
            throw `Invalid JSON, no _type specified for target: ${dict}`
        }

        let type = getItemType(ItemFamily[itemType]);
        if (!type) {//TODO as? Object.Type
            throw `Invalid target item type specificed: ${itemType}`
        }

        var values = {}
        for (let [key, value] of dict) {
            values[key] = value.value
        }

        let item = CacheMemri.createItem(type, values);
        let uid = item["uid"];
        if (typeof uid == "number") {
            this.targetItemType = itemType
            this.targetItemID.value = uid
        } else {
            throw "Unable to create target item in edge"
        }
    }

    constructor(type: string = "edge", source, target,
        sequence?: number, label?: string, action?: string) {

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
