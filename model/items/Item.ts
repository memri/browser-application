import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";
import {Views} from "../../cvu/views/Views";
import {settings} from "../Settings";
import {getItemType, ItemFamily, SchemaItem} from "../schema";
import {realmWriteIfAvailable} from "../../gui/util";
import {ExprInterpreter} from "../../parsers/expression-parser/ExprInterpreter";

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
            + "    " + this.objectSchema.properties
                .filter(item => {
                    return this[item.name] != undefined && item.name != "allEdges"
                        && item.name != "uid" && item.name != "syncState"
                })
                .map(item => {
                    `${item.name}: ${new CVUSerializer().valueToString(this[item.name])}`
                })
                .join("\n    ")
            + `\n    syncState: ${this.syncState?.toString() ?? ""}`;

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
            let dateCreated = new Views().formatDate(this.dateCreated);
            let views = this.changelog?.filter(item => {
                return item.action == "read"
            }).length ?? 0;
            let edits = this.changelog?.filter(item => {
                return item.action == "update"
            }).length ?? 0
            let timeSinceCreated = new Views().formatDateSinceCreated(this.dateCreated);
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
        if (propName == "self") {
            return true
        }
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
        if (name == "self") {
            return this
        } else if (this.objectSchema[name] != undefined) {
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
        realmWriteIfAvailable(realm, function () {
            if (this.objectSchema[name] != undefined) {
                this[name] = value
            } else if (value)/*let obj = value as? Object*/ {
                this.link(value, name, true);
            } else if (Array.isArray(value)) {
                let list = value;
                for (let obj of list) {
                    this.link(obj, name)
                }
            }
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
        return this.realm?.objects(Edge.self) //TODO:
            .filter(`targetItemID = ${this.uid} AND type = '${edgeType}`)
    }

    reverseEdge(edgeType: string) {
        if (this.realm && !this.uid.value) {
            return null;
        }

        // TODO: collection support
        //#warning("Not implemented fully yet")

        // Should this create a temporary edge for which item() is source() ?
        return this.realm?.objects(Edge.self) //TODO:
            .filter(`deleted = false AND targetItemID = ${this.uid} AND type = '${edgeType}`)[0]
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

            return this.allEdges.filter(filter)
        } else {
            if (edgeType == "" && this.realm == undefined) {
                return null;
            }
            let collection = this.edgeCollection(edgeType);
            if (collection) {
                return this.edges(collection)
            }

            return this.allEdges.filter(`deleted = false AND type = '${edgeType}'`)
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

        let edges = this.allEdges.filter(`deleted = false and type = '${edgeType}'`);

        switch (sequence) {
            case EdgeSequencePosition.numberOne:
                orderNumber = sequence.value; //TODO
                break;
            case EdgeSequencePosition.first:
                var sorted = edges.sort("sequence", false) //TODO:
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
                    .filter(`deleted = false AND sequence < ${beforeNumber}`)
                    .sort("sequence", true)[0];

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
                    .filter(`deleted = false AND sequence < ${afterNumber}`)
                    .sort("sequence", true)[0] //TODO:

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
         order?, label?,
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
        var edge = this.allEdges.filter(query)[0] //TODO
        let sequenceNumber = this.determineSequenceNumber(edgeType, order);

        realmWriteIfAvailable(this.realm, function () {
            if (item.realm == undefined && item instanceof Item) {
                item.syncState?.actionNeeded = "create"
                //this.realm?.add(item, .modified) TODO
            }

            if (edge == undefined) {
                /*edge = new Cache.createEdge(
                    this,
                    item,
                    edgeType,
                    label,
                    sequenceNumber
                )*/ //TODO
                if (edge) {
                    this.allEdges.push(edge);
                }
            } else if (overwrite && edge) {
                edge.targetItemID.value = targetID
                edge.targetItemType = item.genericType
                edge.sequence.value = sequenceNumber
                edge.edgeLabel = label

                if (edge.syncState?.actionNeeded == undefined) {
                    edge.syncState.actionNeeded = "update"
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

    unlink(edge: Edge) {
        if (edge.sourceItemID.value == this.uid.value && edge.sourceItemType == this.genericType) {
            realmWriteIfAvailable(this.realm, function () {
                edge.deleted = true;
                edge.syncState?.actionNeeded = "delete"
                this.realm?.delete(edge)//TODO
            })
        } else {
            throw "Exception: Edge does not link from this item"
        }
    }

/*public func unlink(_ item: Item, type edgeType: String? = nil, all: Bool = true) throws {
        guard let targetID: Int = item.get("uid") else {
            return
        }

        guard edgeType != "" else {
            throw "Exception: Edge type is not set"
        }

        let edgeQuery = edgeType != nil ? "type = '\(edgeType!)' and " : ""
		let query = "deleted = false and \(edgeQuery) targetItemID = \(targetID)"
        let results = allEdges.filter(query)

        if results.count > 0 {
            realmWriteIfAvailable(realm) {
                if all {
                    for edge in results {
                        edge.deleted = true
                        edge.syncState?.actionNeeded = "delete"
                    }
                } else if let edge = results.first {
                    edge.deleted = true
                    edge.syncState?.actionNeeded = "delete"
                }
            }
        }
    }*/ //TODO:

    /// Toggle boolean property
    /// - Parameter name: property name
    toggle(name: string) {
        let val = this[name]
        if (typeof val == "boolean") {
            val ? this.set(name, false) : this.set(name, true)
        } else {
            console.log(`tried to toggle property ${name}, but ${name} is not a boolean`)
        }
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
            if (prop.objectClassName != undefined) {
                return false // TODO: implement a list compare and a way to add to updatedFields
            } else {
                let value1 = this[propName]
                let value2 = item[propName]
                let item1 = value1;

                if (typeof item1 == "string" && typeof value2 == "string") {
                    return item1 == value2
                }
                if (typeof item1 == "number" && typeof value2 == "number") {
                    return item1 == value2
                }
                if (typeof item1 == "object" && typeof value2 == "object") {
                    return item1 == value2//TODO
                } else {
                    // TODO: Error handling
                    console.log(`Trying to compare property ${propName} of item ${item} and ${this} " +
                        "but types do not mach`)
                }
            }

            return true
        } else {
            // TODO: Error handling
            console.log(`Tried to compare property ${propName}, but ${this} does not have that property`)
            return false
        }
    }

    /// Safely merges the passed item with the current Item. When there are merge conflicts, meaning that some other process
    /// requested changes for the same properties with different values, merging is not performed.
    /// - Parameter item: item to be merged with the current Item
    /// - Returns: boolean indicating the succes of the merge
safeMerge(item: Item) {
    let syncState = this.syncState;
        if (syncState) {
            // Ignore when marked for deletion
            if (syncState.actionNeeded == "delete") { return true }

            // Do not update when the version is not higher then what we already have
            if (item.version <= this.version) { return false }

            // Make sure to not overwrite properties that have been changed
            let updatedFields = syncState.updatedFields

            // Compare all updated properties and make sure they are the same
            for (let fieldName of updatedFields) {
                if (!this.isEqualProperty(fieldName, item)) { return false }
            }

            // Merge with item
            this.merge(item) //TODO:

            return true
        } else {
            // TODO: Error handling
            console.log("trying to merge, but syncState is nil")
            return false
        }
    }

    /// merges the the passed Item in the current item
    /// - Parameters:
    ///   - item: passed Item
    ///   - mergeDefaults: boolean describing how to merge. If mergeDefault == true: Overwrite only the property values have
    ///    not already been set (nil). else: Overwrite all property values with the values from the passed item, with the exception
    ///    that values cannot be set from a non-nil value to nil.
    merge(item: Item, mergeDefaults: boolean = false) {
        // Store these changes in realm
        let realm = this.realm;
        if (realm) {
            try {
                //realm.write{ this.doMerge(item, mergeDefaults) } TODO
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
            if (prop.name == "SyncState" || prop.name == "uid") {
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
    access() {
        realmWriteIfAvailable(this.realm, function () {
            this.dateAccessed = Date()
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

        let items = new MemriJSONDecoder.decode(ItemFamily, jsonData) //TODO
        return items
    }

    /// Sets syncState .actionNeeded property
    /// - Parameters:
    ///   - action: action name
    setSyncStateActionNeeded(action: string) {
        let syncState = this.syncState
        if (syncState) {
            syncState.actionNeeded = action
        } else {
            console.log(`No syncState available for item ${this}`)
        }
    }

    /// Read Item from string
    /// - Parameter json: string to parse
    /// - Throws: Decoding error
    /// - Returns: Array of deserialized Items
    fromJSONString(json: string) {
        let items: [Item] = new MemriJSONDecoder
            .decode(ItemFamily, Data(json.utf8)) //TODO
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


/*extension memri.Edge {
    override public var description: String {
        "Edge (\(type ?? "")\(label != nil ? ":\(label ?? "")" : "")): \(sourceItemType ?? ""):\(sourceItemID.value ?? 0) -> \(targetItemType ?? ""):\(targetItemID.value ?? 0)"
    }

    var targetType: Object.Type? {
        ItemFamily(rawValue: targetItemType ?? "")?.getType() as? Object.Type
}

    var sourceType: Item.Type? {
        ItemFamily(rawValue: sourceItemType ?? "")?.getType() as? Item.Type
}

    func item<T: Item>(type: T.Type? = T.self) -> T? {
            target(type: type)
        }

        func target<T: Object>(type _: T.Type? = T.self) -> T? {
        do {
            let realm = try Realm()
            if let itemType = targetType {
        return realm.object(ofType: itemType, forPrimaryKey: targetItemID) as? T
} else {
        throw "Could not resolve edge target: \(self)"
    }
} catch {
        debugHistory.error("\(error)")
    }

    return nil
}

    func source<T: Item>(type _: T.Type? = T.self) -> T? {
        do {
            let realm = try Realm()
            if let itemType = sourceType {
        return realm.object(ofType: itemType, forPrimaryKey: sourceItemID) as? T
} else {
        throw "Could not resolve edge source: \(self)"
    }
} catch {
        debugHistory.error("\(error)")
    }

    return nil
}

    convenience init(type: String = "edge", source: (String, Int), target: (String, Int),
        sequence: Int? = nil, label: String? = nil, action: String? = nil) {
        self.init()

        self.type = type
        sourceItemType = source.0
        sourceItemID.value = source.1
        targetItemType = target.0
        targetItemID.value = target.1
        self.sequence.value = sequence
        self.label = label

        if let action = action {
            syncState?.actionNeeded = action
        }
    }
}*/
