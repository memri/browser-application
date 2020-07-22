//
//  Other.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

/*extension Object {
	var genericType: String {
		objectSchema.className
	}
}

extension Note {
	override var computedTitle: String {
		"\(title ?? "")"
	}
}

extension PhoneNumber {
	override var computedTitle: String {
		phoneNumber ?? ""
	}
}

extension Website {
	override var computedTitle: String {
		url ?? ""
	}
}

extension Country {
	override var computedTitle: String {
		"\(name ?? "")"
	}
}

extension Address {
	override var computedTitle: String {
		//        \(type ?? "")
		"""
		\(street ?? "")
		\(city ?? "")
		\(postalCode == nil ? "" : postalCode! + ",") \(state ?? "")
		\(edge("country")?.item()?.computedTitle ?? "")
		"""
	}
}

extension Company {
	override var computedTitle: String {
		name ?? ""
	}
}

extension OnlineProfile {
	override var computedTitle: String {
		handle ?? ""
	}
}

extension Diet {
	override var computedTitle: String {
		type ?? ""
	}
}

extension MedicalCondition {
	override var computedTitle: String {
		type ?? ""
	}
}*/

import {SchemaPerson} from "../schema";
import {CacheMemri} from "../Cache";

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

	constructor() {
		super()

		this.functions["age"] = () => { return this.age }
	}
}

/*extension AuditItem {
	override var computedTitle: String {
		"Logged \(action ?? "unknown action") on \(date?.description ?? "")"
	}

	convenience init(date: Date? = nil, contents: String? = nil, action: String? = nil,
					 appliesTo: [Item]? = nil) throws {
		self.init()
		self.date = date ?? self.date
		self.content = content ?? self.content
		self.action = action ?? self.action

		if let appliesTo = appliesTo {
			for item in appliesTo {
				_ = try link(item, type: "appliesTo")
			}
		}
	}
}*/

/*extension Label {
	override var computedTitle: String {
		name ?? ""
	}
}

extension Photo {
	override var computedTitle: String {
		caption ?? ""
	}
}

extension Video {
	override var computedTitle: String {
		caption ?? ""
	}
}

extension Audio {
	override var computedTitle: String {
		caption ?? ""
	}
}

extension Importer {
	override var computedTitle: String {
		name ?? ""
	}
}

extension Indexer {
	override var computedTitle: String {
		name ?? ""
	}

	internal convenience init(name: String? = nil, itemDescription: String? = nil,
							  query: String? = nil, icon: String? = nil,
							  bundleImage: String? = nil, runDestination: String? = nil) {
		self.init()
		self.name = name ?? self.name
		self.itemDescription = itemDescription ?? self.itemDescription
		self.query = query ?? self.query
		self.icon = icon ?? self.icon
		self.bundleImage = bundleImage ?? self.bundleImage
		self.runDestination = runDestination ?? self.runDestination
	}
}

extension IndexerRun {
	internal convenience init(name: String? = nil, query: String? = nil, indexer: Indexer? = nil,
							  progress: Int? = nil) {
		self.init()
		self.name = name ?? self.name
		self.query = query ?? self.query
		self.progress.value = progress ?? self.progress.value

		if let indexer = indexer { set("indexer", indexer) }
	}
}*/

export class CVUStateDefinition {
	static fromCVUStoredDefinition(stored: CVUStoredDefinition) {
		return CacheMemri.createItem(CVUStateDefinition.constructor, {
			"definition": stored.definition,
			"domain": "state",
			"name": stored.name,
			"query": stored.query,
			"selector": stored.selector,
			"type": stored.type
		})
	}

	static fromCVUParsedDefinition(parsed: CVUParsedDefinition) {
		return CacheMemri.createItem(CVUStateDefinition.constructor, {
			"definition": parsed.toCVUString(0, "    "),
			"domain": "state",
			"name": parsed.name,
//            "query": stores.query,
			"selector": parsed.selector,
			"type": parsed.definitionType
		})
	}
}
/*
extension CVUStoredDefinition {
    override var computedTitle: String {
        #warning("Parse and then create a proper string representation")
        if let value = name, value != "" { return value }
        return "[No Name]"
    }
}*/
