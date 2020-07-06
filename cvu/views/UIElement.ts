//
//  UIElement.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


import {Expression} from "../../parsers/expression-parser/Expression";
import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";
import {
	Alignment,
	CGFloat,
	Color, Font,
	HorizontalAlignment,
	TextAlignment,
	VerticalAlignment
} from "../../parsers/cvu-parser/CVUParser";
import {Action} from "./Action";
import {DataItem, Item} from "../../model/DataItem";
import {CVUParsedDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";

export class UIElement /*extends CVUToString */{
	type
	children = []
	properties = {} // TODO: ViewParserDefinitionContext

	constructor(type, children, properties = {}) {
		//super()
		this.type = type
		this.children = children ?? this.children
		this.properties = properties
	}

	has(propName) {
		return this.properties[propName] != null
	}

	getString(propName, item = null) {
		return this.get(propName, item) ?? ""
	}

	getBool(propName, item = null) {
		return this.get(propName, item) ?? false
	}

	get(propName, item = null, viewArguments?) {
		viewArguments = viewArguments || new ViewArguments()
		let prop = this.properties[propName]
		if (prop) {
			let propValue = prop

			// Execute expression to get the right value
			let expr = propValue
			if (expr instanceof Expression) {
				viewArguments.set(".", item) // TODO: Optimization This is called a billion times. Find a better place for this

				try {
					//if (T.self == [DataItem].self) {//TODO
						let x =  expr.execute(viewArguments)

						var result = []
						let list = x
						if (Array.isArray(list)) {//TODO
							for (var edge of list) {
								let d = this.getItem(edge)
								if (d) {
									result.push(d)
								}
							}
						} else {
							result = this.dataItemListToArray(x)
						}

						return (result)
					/*} else {
						let x =  expr.execForReturnType(T.self/!*TODO*!/, viewArguments); return x
					}*/
				} catch (error) {
					// TODO: Refactor error handling
					/*debugHistory.error(`Could note compute ${propName}\n
						Arguments: [${viewArguments.asDict().keys.join(", ")}]\n
						${expr.startInStringMode
							? `Expression: ${expr.code}\n`
							: `Expression: ${expr.code}\n`}
						Error: ${error}`)*/
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
		let prop = this.properties[propName]
		if (prop) {
			let propValue = prop

			// Execute expression to get the right value
			let expr = propValue
			if (expr instanceof Expression) {
				try { return expr.getTypeOfDataItem(viewArguments) }
				catch (error) {
					// TODO: Refactor: Error Handling
					//debugHistory.error(`could not get type of ${item}`)
				}
			}
		}

		// TODO: Refactor: Error Handling
		//return (.any, item, "")//TODO
	}

	processText(text) {
		var outText = text
		if (!outText) { return null }
		outText = (this.get("removeWhiteSpace") ?? false) ? this.removeWhiteSpace(outText) : outText
		outText = (this.get("maxChar")).map(function (item) {
			String(outText.substring(parseInt(item)))//TODO
		}) ?? outText
		if (/\s*/.test(outText))
			return null; // Return nil if blank
		return outText
	}

	removeWhiteSpace(text: string) {//TODO
		return text
			.trim()// Remove whitespace/newLine from start/end of string
			.replace(/\r?\n/g," ") // Replace new-lines with a space
	}

	toCVUString(depth, tab) {
		let tabs = tab.repeat(depth);
		let tabsPlus = tab.repeat(depth + 1);
		let tabsEnd = (depth - 1 > 0)? tab.repeat(depth - 1) : ""; //TODO:

		let propertiesLength = Object.keys(this.properties).length ?? 0
		let childrenLength = Object.keys(this.children).length ?? 0
		//TODO: i changed some code here to pass all tests with UIElements in CVUParser; don't know if i right
		return propertiesLength > 0 || childrenLength > 0
			? `${this.type} {\n`
			+ (propertiesLength > 0
				? `${tabs}${new CVUSerializer().dictToString(this.properties, depth, tab, false)}`
				: "")
			+ (propertiesLength > 0 && childrenLength > 0
				? "\n\n"
				: "")
			+ (childrenLength > 0
				? `${tabs}${new CVUSerializer().arrayToString(this.children, depth, tab, false, true)}`
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
	Empty = "Empty"
}

export enum UIElementProperties {
	resizable = "resizable",
	show = "show",
	alignment = "alignment",
	align = "align",
	textAlign = "textAlign",
	spacing = "spacing",
	title = "title",
	text = "text",
	image = "image",
	nopadding = "nopadding",

	press = "press",
	bold = "bold",
	italic = "italic",
	underline = "underline",
	strikethrough = "strikethrough",
	list = "list",
	viewName = "viewName",
	view = "view",
	arguments = "arguments",
	location = "location",

	address = "address",
	systemName = "systemName",
	cornerRadius = "cornerRadius",
	hint = "hint",
	value = "value",
	datasource = "datasource",
	defaultValue = "defaultValue",
	empty = "empty",
	style = "style",

	frame = "frame",
	color = "color",
	font = "font",
	padding = "padding",
	background = "background",
	rowbackground = "rowbackground",
	cornerborder = "cornerborder",
	border = "border",
	margin = "margin",

	shadow = "shadow",
	offset = "offset",
	blur = "blur",
	opacity = "opacity",
	zindex = "zindex",
	minWidth = "minWidth",
	maxWidth = "maxWidth",
	minHeight = "minHeight",
	maxHeight = "maxHeight"
}

export var validateUIElementProperties = function (key, value) {
	if (value instanceof Expression) {
		return true
	}

	let prop = UIElementProperties[key];
	switch (prop) {
		case UIElementProperties.resizable:
		case UIElementProperties.title:
		case UIElementProperties.text:
		case UIElementProperties.viewName:
		case UIElementProperties.systemName:
		case UIElementProperties.hint:
		case UIElementProperties.empty:
		case UIElementProperties.style:
		case UIElementProperties.defaultValue:
			return typeof value == "string";
		case UIElementProperties.show:
		case UIElementProperties.nopadding:
		case UIElementProperties.bold:
		case UIElementProperties.italic:
		case UIElementProperties.underline:
		case UIElementProperties.strikethrough:
			return typeof value == "boolean";
		case UIElementProperties.alignment:
			return Object.values(VerticalAlignment).includes(value) || Object.values(HorizontalAlignment).includes(value)
		case UIElementProperties.align:
			return Object.values(Alignment).includes(value)
		case UIElementProperties.textAlign:
			return Object.values(TextAlignment).includes(value)
		case UIElementProperties.spacing:
		case UIElementProperties.cornerRadius:
		case UIElementProperties.minWidth:
		case UIElementProperties.maxWidth:
		case UIElementProperties.minHeight:
		case UIElementProperties.maxHeight:
		case UIElementProperties.blur:
		case UIElementProperties.opacity:
		case UIElementProperties.zindex:
			return value instanceof CGFloat || typeof value == "number";
		case UIElementProperties.image: return value instanceof File || typeof value == "string";
		case UIElementProperties.press: return value instanceof Action || Array.isArray(value) && value[0] instanceof Action
		case UIElementProperties.list: return Array.isArray(value) && value[0] instanceof Item
		case UIElementProperties.view: return value instanceof CVUParsedDefinition || typeof value.isCVUObject === "function"
		case UIElementProperties.arguments: return typeof value.isCVUObject === "function"
		case UIElementProperties.location: return value instanceof Location
		case UIElementProperties.address: return value instanceof Address
		case UIElementProperties.value: return true
		case UIElementProperties.datasource: return value instanceof Datasource
		case UIElementProperties.color:
		case UIElementProperties.background:
		case UIElementProperties.rowbackground:
			return value instanceof Color
		case UIElementProperties.font:
			if (Array.isArray(value)) {
			return value[0] instanceof CGFloat || typeof value[0] == "number" || (value[0] instanceof CGFloat || typeof value[0] == "number") && (Object.values(Font.Weight).includes(value[1]))
		} else { return value instanceof CGFloat || typeof value == "number"}
		case UIElementProperties.padding:
		case UIElementProperties.margin:
			if (Array.isArray(value)) {
				return (value[0] instanceof CGFloat || typeof value[0] == "number") && (value[1] instanceof CGFloat || typeof value[1] == "number")
					&& (value[2] instanceof CGFloat || typeof value[2] == "number") && (value[3] instanceof CGFloat || typeof value[3] == "number")
			} else {
				return value instanceof CGFloat || typeof value == "number"
			}
		case UIElementProperties.border:
			if (Array.isArray(value)) {
			return value[0] instanceof Color && (value[1] instanceof CGFloat || typeof value[1] == "number")
		} else { return false }
		case UIElementProperties.shadow:
			if (Array.isArray(value)) {
				return value[0] instanceof Color && (value[1] instanceof CGFloat || typeof value[1] == "number")
					&& (value[2] instanceof CGFloat || typeof value[2] == "number") && (value[3] instanceof CGFloat || typeof value[3] == "number")
			} else {
				return false
			}
		case UIElementProperties.offset:
			if (Array.isArray(value)) {
				return (value[0] instanceof CGFloat || typeof value[0] == "number") && (value[1] instanceof CGFloat || typeof value[1] == "number")
			} else {
				return false
			}
		default:
			return false
	}
}
