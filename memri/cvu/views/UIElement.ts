//
//  UIElement.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

import {CVUSerializer} from "../../../router";
import {
	Alignment,
	CGFloat,
	Color, Font,
	HorizontalAlignment,
	TextAlignment,
	VerticalAlignment
} from "../../../router";
import {debugHistory} from "../../../router";
import {dataItemListToArray, UUID} from "../../../router";
import {ViewArguments} from "../../../router";
import {MemriDictionary} from "../../../router";
import {CVUPropertyResolver} from "../../../router";

export class UIElement /*extends CVUToString */{
	id = UUID()
	type: UIElementFamily
	children = []
	propertyResolver: CVUPropertyResolver

	constructor(type, children?, properties?) {
		//super()
		this.type = type
		this.children = children ?? this.children
		this.propertyResolver = new CVUPropertyResolver(properties ?? new MemriDictionary())
	}

	has(propName) {
		return this.propertyResolver.properties[propName] != null
	}

	getString(propName, item = null) {
		return this.get(propName, item) ?? ""
	}

	getBool(propName, item = null) {
		return this.get(propName, item) ?? false
	}

	get(propName, item = null, viewArguments?) {
		let args = viewArguments ?? new ViewArguments({".": item});
		let prop = this.propertyResolver.properties[propName]
		if (prop) {
			let propValue = prop

			// Execute expression to get the right value
			let expr = propValue
			if (expr?.constructor?.name == "Expression") {
				try {
					if (propName == "list") {//TODO T.self == [DataItem].self
						let x =  expr.execute(args)

						var result = []
						let list = x
						if (Array.isArray(list) && list.length > 0 && list[0]?.constructor?.name == "Edge") {//TODO
							for (var edge of list) {
								let d = edge.target()
								if (d) {
									result.push(d)
								}
							}
						} else {
							result = dataItemListToArray(x)
						}

						return (result)
					} else {
						let x =  expr.execForReturnType(viewArguments); return x
					}
				} catch (error) {
					// TODO: Refactor error handling
					debugHistory.error(`Could not compute ${propName}\n`
						+ `Arguments: [${args.toString}]\n`
						+ (expr.startInStringMode
							? `Expression: \"${expr.code}\"\n`
							: `Expression: ${expr.code}\n`)
						+ `Error: ${error}`)
					return null
				}
			}
			return (propValue)
		} else {
			// TODO: REfactor: WARN
			//            debugHistory.info(`Property ${propName} not defined for ${type.rawValue}`)
		}

		return null
	}

	getType(propName, item, viewArguments) {
		let prop = this.propertyResolver.properties[propName]
		if (prop) {
			let propValue = prop

			// Execute expression to get the right value
			let expr = propValue
			if (expr?.constructor?.name == "Expression") {
				try { return expr.getTypeOfItem(viewArguments) }
				catch (error) {
					// TODO: Refactor: Error Handling
					debugHistory.error(`could not get type of ${item}`)
				}
			}
		}

		// TODO: Refactor: Error Handling
		return [undefined, item, ""]//TODO
	}

	processText(text) {
		var outText = text
		if (!outText) { return null }
		outText = (this.get("removeWhiteSpace") ?? false) ? this.removeWhiteSpace(outText) : outText
		/*outText = (this.get("maxChar"))?.map(function (item) {
			String(outText.substring(parseInt(item)))//TODO
		}) ?? outText*/
		if (/^\s*$/.test(outText))
			return null; // Return nil if blank
		return [outText]
	}

	removeWhiteSpace(text: string) {//TODO
		return text
			.trim()// Remove whitespace/newLine from start/end of string
			.replace(/\r?\n/g," ") // Replace new-lines with a space
	}

	toCVUString(depth, tab) {
		let tabs = tab.repeat(depth + 1);
		let tabsPlus = tab.repeat(depth + 2);
		let tabsEnd = (depth > 0)? tab.repeat(depth) : ""; //TODO:
		let properties = this.propertyResolver.properties

		let propertiesLength = Object.keys(properties).length ?? 0
		let childrenLength = Object.keys(this.children).length ?? 0
		//TODO: i changed some code here to pass all tests with UIElements in CVUParser; don't know if i right
		return propertiesLength > 0 || childrenLength > 0
			? `${this.type} {\n`
			+ (propertiesLength > 0
				? `${tabs}${CVUSerializer.dictToString(properties, depth + 1, tab, false)}`
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


export enum UIElementFamily {
	VStack = "VStack",
	HStack = "HStack",
	ZStack = "ZStack",
	EditorSection = "EditorSection",
	EditorRow = "EditorRow",
	EditorLabel = "EditorLabel",
	Title = "Title",
	Button = "Button",
	FlowStack = "FlowStack",

	Text = "Text",
	Textfield = "Textfield",
	ItemCell = "ItemCell",
	SubView = "SubView",
	Map = "Map",
	Picker = "Picker",
	SecureField = "SecureField",
	Action = "Action",
	MemriButton = "MemriButton",
	Image = "Image",

	Circle = "Circle",
	HorizontalLine = "HorizontalLine",
	Rectangle = "Rectangle",
	RoundedRectangle = "RoundedRectangle",
	Spacer = "Spacer",
	Divider = "Divider",
	RichTextfield = "RichTextfield",
	Empty = "Empty",
	TimelineItem = "TimelineItem",
	MessageBubble = "MessageBubble",
	EmailContent = "EmailContent",
	EmailHeader = "EmailHeader",
	SmartText = "SmartText",
	Toggle = "Toggle"
}


