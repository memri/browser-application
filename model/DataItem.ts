
/// DataItem is the baseclass for all of the data clases, all functions
enum CodingKeys {
	uid, memriID, deleted, starred, dateCreated, dateModified, dateAccessed, changelog,
	labels, syncState
}
enum DataItemError {
	cannotMergeItemWithDifferentId
}

export function UUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

export class DataItem /*extends Object, Codable, Identifiable, ObservableObject*/ {//TODO
	/// name of the DataItem implementation class (E.g. "note" or "person")
	genericType () { return "unknown" }

	/// Title computed by implementations of the DataItem class
	computedTitle() {
		return `${this.genericType} [${this.memriID}]`
	}

	test = DataItem.generateUUID()//TODO
	/// Boolean whether the DataItem has been deleted

	/// uid of the DataItem set by the pod
	uid = 0
	/// memriID of the DataItem
	memriID = DataItem.generateUUID()//TODO
	/// Boolean whether the DataItem has been deleted
	deleted = false
	/// The last version loaded from the server
	version = 0
	/// Boolean whether the DataItem has been starred
	starred = false
	/// Creation date of the DataItem
	dateCreated = new Date()//TODO
	/// Last modification date of the DataItem
	dateModified = new Date()//TODO
	/// Last access date of the DataItem
	dateAccessed = null
	/// Array AuditItems describing the log history of the DataItem
	changelog = []//TODO
	/// Labels assigned to / associated with this DataItem
	labels = []//TODO
	/// Object descirbing syncing information about this object like loading state, versioning, etc.
	// syncState = new SyncState()//TODO

	functions = {}

	/// Primary key used in the realm database of this DataItem
	get primaryKey()  {
		return "memriID"
	}

	cast() {
		return this
	}

	CodingKeys = CodingKeys//TODO
	DataItemError = DataItemError//TODO

	constructor(decoder) {
		//super()

		this.functions["describeChangelog"] = function() {
			let dateCreated = Views.formatDate(this.dateCreated)
			let views = this.changelog.filter ( function (item) {item.action == "read"} ).length
			let edits = this.changelog.filter ( function (item) {item.action == "update"} ).length
			let timeSinceCreated = Views.formatDateSinceCreated(this.dateCreated)
			return `You created this ${this.genericType} ${dateCreated} and viewed it ${views} times and edited it ${edits} times over the past ${timeSinceCreated}`
		}.bind(this)//TODO
		this.functions["computedTitle"] = function() {
			return this.computedTitle()
		}.bind(this)//TODO
		this.superDecode(decoder)
	}

	/// Deserializes DataItem from json decoder
	/// - Parameter decoder: Decoder object
	/// - Throws: Decoding error
/*	public required convenience init(from decoder: Decoder) throws {//TODO
		this.init()
		try superDecode(from: decoder)
	}*/

	/// @private
	superDecode(decoder) {//TODO
		return;
		this.uid = decoder.decodeIfPresent("uid") || this.uid
		this.memriID = decoder.decodeIfPresent("memriID") || this.memriID
		this.starred = decoder.decodeIfPresent("starred") || this.starred
		this.deleted = decoder.decodeIfPresent("deleted") || this.deleted
		this.version = decoder.decodeIfPresent("version") || this.version
		this.syncState = decoder.decodeIfPresent("syncState") || this.syncState

		this.dateCreated = decoder.decodeIfPresent("dateCreated") || this.dateCreated
		this.dateModified = decoder.decodeIfPresent("dateModified") || this.dateModified
		this.dateAccessed = decoder.decodeIfPresent("dateAccessed") || this.dateAccessed

		this.decodeIntoList(decoder, "changelog", this.changelog)
		this.decodeIntoList(decoder, "labels", this.labels)
	}

	/// Get string, or string representation (e.g. "true) from property name
	/// - Parameter name: property name
	/// - Returns: string representation
	getString(name) {
		if (this.objectSchema[name] == null) {
			/*#if DEBUG
				print("Warning: getting property that this dataitem doesnt have: \(name) for \(genericType):\(memriID)")
			#endif*/

			return ""
		} else {
			let val = this[name]

			var typeofVal = typeof val;
			if (typeofVal === "string") {
				return val
			} else if (typeofVal === "boolean") {
				return String(val)
			} else if (typeofVal === "number") {
				return String(val)
			// } else if let val = val as? Double {
			// 	return String(val)
			} else if (val instanceof Date) {//TODO ?
				let formatter = new DateFormatter()
				formatter.dateFormat = Settings.get("user/formatting/date") // "HH:mm    dd/MM/yyyy"
				return formatter.string(val)
			} else {
				return ""
			}
		}
	}

	/// Get the type of DataItem
	/// - Returns: type of the DataItem
	getType() {
		let type = new DataItemFamily(this.genericType)
		if (type) {
			let T = DataItemFamily.getType(type)//TODO
			// NOTE: allowed forced downcast
			return (T())
		} else {
			console.log(`Cannot find type ${genericType} in DataItemFamily`)
			return null
		}
	}

	/// Determines whether item has property
	/// - Parameter propName: name of the property
	/// - Returns: boolean indicating whether DataItem has the property
	hasProperty(propName) {
		if (propName == "self") {
			return true
		}
		for (var prop of this.objectSchema.properties) {
			if (prop.name == propName) { return true }
			let haystack = this[prop.name]
			if (typeof haystack === "string") {
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
	get(name, type?) {
		if (name == "self") {
			return this
		}
		return this[name]
	}

	/// Set property to value, which will be persisted in the local database
	/// - Parameters:
	///   - name: property name
	///   - value: value
	set(name, value) {
		/*realmWriteIfAvailable(realm) {//TODO
			this[name] = value
		}*/
	}

	addEdge(propertyName, item) {
		let subjectID = this.get("memriID")
		if (!subjectID) return
		let objectID = item.get("memriID")
		if (!objectID) return

		let edges = this.get(propertyName) ?? []
		if (!edges.map(function(item) { item.objectMemriID }).includes(objectID)) {
			let newEdge = new Edge(subjectID, objectID, "Label", "Note")
			let newEdges = edges.concat([newEdge])
			this.set("appliesTo", newEdges)
		} else {
			throw "Could note create Edge, already exists"
		}

		//        // Check that the property exists to avoid hard crash
		//        guard let schema = this.objectSchema[propertyName] else {
		//            throw "Exception: Invalid property access of \(item) for \(self)"
		//        }
		//        guard let objectID: String = item.get("memriID") else {
		//            throw "no memriID"
		//        }
//
		//        if schema.isArray {
		//            // Get list and append
		//            var list = dataItemListToArray(self[propertyName] as Any)
//
		//            if !list.map{$0.memriID}.contains(objectID){
		//                list.append(item)
		//                print(list)
		//                this.set(propertyName, list as Any)
		//            }
		//            else {
		//                print("Could not set edge, already exists")
		//            }
		//        }
		//        else {
		//            this.set(propertyName, item)
		//        }
	}

	/// Toggle boolean property
	/// - Parameter name: property name
	toggle(name) {
		let val = this[name]
		if (typeof val === "boolean") {
			this.set(name, val)
		} else {
			console.log(`tried to toggle property ${name}, but ${name} is not a boolean`)
		}
	}

	/// Compares value of this DataItems property with the corresponding property of the passed items property
	/// - Parameters:
	///   - propName: name of the compared property
	///   - item: item to compare against
	/// - Returns: boolean indicating whether the property values are the same
	isEqualProperty(propName, item) {
		let prop = this.objectSchema[propName]
		if (prop) {
			// List
			if (prop.objectClassName != null) {
				return false // TODO: implement a list compare and a way to add to updatedFields
			} else {
				let value1 = this[propName]
				let value2 = item[propName]

				let item1 = value1
				if (typeof item1 === "string" && typeof value2 === "string") {
					return item1 == value2
				}
				if (typeof item1 === "number" && typeof value2 === "number") {
					return item1 == value2
				}
				// if let item1 = value1 as? Double, let value2 = value2 as? Double {
				// 	return item1 == value2
				// }
				if (typeof item1 === "object" && typeof value2 === "object") {
					return item1 == value2
				} else {
					// TODO: Error handling
					console.log(`Trying to compare property ${propName} of item ${item} and ${this} 
						but types do not mach`)
				}
			}

			return true
		} else {
			// TODO: Error handling
			console.log(`Tried to compare property ${propName}, but ${this} does not have that property`)
			return false
		}
	}

	/// Safely merges the passed item with the current DataItem. When there are merge conflicts, meaning that some other process
	/// requested changes for the same properties with different values, merging is not performed.
	/// - Parameter item: item to be merged with the current DataItem
	/// - Returns: boolean indicating the succes of the merge
	safeMerge(item) {
		let syncState = this.syncState
		if (syncState) {
			// Ignore when marked for deletion
			if (syncState.actionNeeded == "delete") { return true }

			// Do not update when the version is not higher then what we already have
			if (item.version <= this.version) { return true }

			// Make sure to not overwrite properties that have been changed
			let updatedFields = syncState.updatedFields

			// Compare all updated properties and make sure they are the same
			for (var fieldName of updatedFields) {
				if (!this.isEqualProperty(fieldName, item)) { return false }
			}

			// Merge with item
			this.merge(item)

			return true
		} else {
			// TODO: Error handling
			console.log("trying to merge, but syncState is null")
			return false
		}
	}

	/// merges the the passed DataItem in the current item
	/// - Parameters:
	///   - item: passed DataItem
	///   - mergeDefaults: boolean describing how to merge. If mergeDefault == true: Overwrite only the property values have
	///    not already been set (null). else: Overwrite all property values with the values from the passed item, with the exception
	///    that values cannot be set from a non-null value to null.
	merge(item, mergeDefaults = false) {
		// Store these changes in realm
		let realm = this.realm
		if (realm) {
			try {
				//realm.write { this.doMerge(item, mergeDefaults) }//TODO
			} catch(error) {
				console.log(`Could not write merge of ${item} and ${this} to realm`)
			}
		} else {
			this.doMerge(item, mergeDefaults)
		}
	}

	doMerge(item, mergeDefaults = false) {
		let properties = this.objectSchema.properties
		for (var prop of properties) {
			// Exclude SyncState
			if (prop.name == "SyncState") {
				continue
			}

			// Perhaps not needed:
			// - TODO needs to detect lists which will always be set
			// - TODO needs to detect optionals which will always be set

			// Overwrite only the property values that are not already set
			if (mergeDefaults) {
				if (this[prop.name] == null) {
					this[prop.name] = item[prop.name]
				}
			}
			// Overwrite all property values with the values from the passed item, with the
			// exception, that values cannot be set ot null
			else {
				if (item[prop.name] != null) {
					this[prop.name] = item[prop.name]
				}
			}
		}
	}

	/// update the dateAccessed property to the current date
	access() {
		/*realmWriteIfAvailable(realm) {//TODO
			this.dateAccessed = Date()
		}*/
	}

	/// compare two dataItems
	/// - Parameters:
	///   - lhs: DataItem 1
	///   - rhs: DataItem 2
	/// - Returns: boolean indicating equality
	/*public static func == (lhs: DataItem, rhs: DataItem) -> Bool {//TODO
		lhs.memriID == rhs.memriID
	}*/

	/// Generate a new UUID, which are used by swift to identify objects
	/// - Returns: UUID string with "0xNEW" prepended
	static generateUUID() {//TODO
		return `Memri${UUID()}`
	}

	/// Reads DataItems from file
	/// - Parameters:
	///   - file: filename (without extension)
	///   - ext: extension
	/// - Throws: Decoding error
	/// - Returns: Array of deserialized DataItems
	fromJSONFile(file, ext = "json") {
		let jsonData = jsonDataFromFile(file, ext)//TODO

		let items = MemriJSONDecoder.decode(DataItemFamily.constructor, jsonData)//TODO
		return items
	}

	/// Sets syncState .actionNeeded property
	/// - Parameters:
	///   - action: action name
	setSyncStateActionNeeded(action) {
		let syncState = this.syncState
		if (syncState) {
			syncState.actionNeeded = action
		} else {
			console.log(`No syncState available for item ${self}`)
		}
	}

	/// Read DataItem from string
	/// - Parameter json: string to parse
	/// - Throws: Decoding error
	/// - Returns: Array of deserialized DataItems
	fromJSONString(json) {
		let items = MemriJSONDecoder
			.decode(DataItemFamily.constructor, new Data(json.utf8))//TODO
		return items
	}
}

class Edge/* extends Object*/ {
	objectMemriID = DataItem.generateUUID()//TODO
	subjectMemriID = DataItem.generateUUID()//TODO

	objectType = "unknown"
	subjectType = "unknown"

	// required init() {}//TODO

	constructor(subjectMemriID, objectMemriID, subjectType = "unknown", objectType = "unknown") {
		//super()
		subjectMemriID = subjectMemriID || DataItem.generateUUID()
		objectMemriID = objectMemriID || DataItem.generateUUID()
		this.objectMemriID = objectMemriID
		this.subjectMemriID = subjectMemriID
		this.objectType = objectType
		this.subjectType = subjectType
	}

	// maybe we dont need this
	//    @objc dynamic var objectType:String = DataItem.generateUUID()
	//    @objc dynamic var subectType:String = DataItem.generateUUID()

	/// Deserializes DataItem from json decoder
	/// - Parameter decoder: Decoder object
	/// - Throws: Decoding error
	//    required public convenience init(from decoder: Decoder) throws{
	//        this.init()
	//        objectUid = try decoder.decodeIfPresent("objectUid") ?? objectUid
	//        subjectUid = try decoder.decodeIfPresent("subjectUid") ?? subjectUid
	//    }
}
