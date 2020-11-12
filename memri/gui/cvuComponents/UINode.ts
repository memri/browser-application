//
//  UINode.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

import {
	CVUSerializer,
} from "../../../router";
import {UUID} from "../../../router";
import {MemriDictionary} from "../../../router";


export class UINode {
	id = UUID()
	type: UIElementFamily
	children = []
	properties;

	constructor(type, children?, properties?) {
		this.type = type
		this.children = children ?? this.children
		this.properties = properties ?? new MemriDictionary()
	}

	toCVUString(depth, tab) {
		let tabs = tab.repeat(depth + 1);
		let tabsPlus = tab.repeat(depth + 2);
		let tabsEnd = (depth > 0)? tab.repeat(depth) : ""; //TODO:

		let propertiesLength = Object.keys(this.properties).length ?? 0
		let childrenLength = Object.keys(this.children).length ?? 0
		//TODO: i changed some code here to pass all tests with UIElements in CVUParser; don't know if i right
		return propertiesLength > 0 || childrenLength > 0
			? `${this.type} {\n`
			+ (propertiesLength > 0
				? `${tabs}${CVUSerializer.dictToString(this.properties, depth + 1, tab, false)}`
				: "")
			+ (propertiesLength > 0 && childrenLength > 0
				? "\n\n"
				: "")
			+ (childrenLength > 0
				? `${tabs}${CVUSerializer.arrayToString(this.children, depth + 1, tab, false, true)}`
				: "")
			+ `\n${tabsEnd}}`
			: `${this.type}\n`
	}

	toString() {
		return this.toCVUString(0, "    ")
	}

}