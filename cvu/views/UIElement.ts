//
//  UIElement.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


import {Expression} from "../../parsers/expression-parser/Expression";
import {CVUSerializer} from "../../parsers/cvu-parser/CVUToString";

export class UIElement /*extends CVUToString */{
	type
	children = []
	properties = {} // TODO: ViewParserDefinitionContext

	constructor(type, children = null, properties = {}) {
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
		//let tabsEnd = new Array(depth - 1).map(function(){ _ in "" }).join(tab)//TODO

		let propertiesLength = Object.keys(this.properties).length
		let childrenLength = this.children.length

		return propertiesLength > 0 || childrenLength > 0
			? `${this.type} {\n` +
			+ (propertiesLength > 0
				? `${tabsPlus}${new CVUSerializer().dictToString(this.properties, depth, tab, false)}`
				: "")
			+ (propertiesLength > 0 && childrenLength > 0
				? "\n\n"
				: "")
			+ (childrenLength > 0
				? `${tabsPlus}${new CVUSerializer().arrayToString(this.children, depth, tab, false, true)}`
				: "")
			+ `\n${tabs}}`
			: `${this.type}\n`
	}

	toString() {
		return this.toCVUString(0, "    ")
	}
}


export enum UIElementFamily {
	VStack, HStack, ZStack, EditorSection, EditorRow, EditorLabel, Title, Button, FlowStack,
		Text, Textfield, ItemCell, SubView, Map, Picker, SecureField, Action, MemriButton, Image,
		Circle, HorizontalLine, Rectangle, RoundedRectangle, Spacer, Divider, RichTextfield, Empty
}

enum UIElementProperties {
	resizable, show, alignment, align, textAlign, spacing, title, text, image, nopadding,
		press, bold, italic, underline, strikethrough, list, viewName, view, arguments, location,
		address, systemName, cornerRadius, hint, value, datasource, defaultValue, empty, style,
		frame, color, font, padding, background, rowbackground, cornerborder, border, margin,
		shadow, offset, blur, opacity, zindex, minWidth, maxWidth, minHeight, maxHeight

	/*function validate(key, value) {
		if (value is Expression) { return true }

		let prop = UIElementProperties(rawValue: key)
		switch prop {
		case .resizable, .title, .text, .viewName, .systemName, .hint, .empty, .style, .defaultValue:
			return value is String
		case .show, .nopadding, .bold, .italic, .underline, .strikethrough:
			return value is Bool
		case .alignment: return value is VerticalAlignment || value is HorizontalAlignment
		case .align: return value is Alignment
		case .textAlign: return value is TextAlignment
		case .spacing, .cornerRadius, .minWidth, .maxWidth, .minHeight, .maxHeight, .blur, .opacity, .zindex:
			return value is CGFloat
		case .image: return value is File || value is String
		case .press: return value is Action || value is [Action]
		case .list: return value is [DataItem]
		case .view: return value is CVUParsedDefinition || value is [String: Any?]
		case .arguments: return value is [String: Any?]
		case .location: return value is Location
		case .address: return value is Address
		case .value: return true
		case .datasource: return value is Datasource
		case .color, .background, .rowbackground: return value is Color
		case .font:
			if (let list = value as? [Any?]) {
				return list[0] is CGFloat || list[0] is CGFloat && list[1] is Font.Weight
			} else { return value is CGFloat }
		case .padding, .margin:
			if (let list = value as? [Any?]) {
				return list[0] is CGFloat && list[1] is CGFloat
					&& list[2] is CGFloat && list[3] is CGFloat
			} else { return value is CGFloat }
		case .border:
			if (let list = value as? [Any?]) {
				return list[0] is Color && list[1] is CGFloat
			} else { return false }
		case .shadow:
			if (let list = value as? [Any?]) {
				return list[0] is Color && list[1] is CGFloat
					&& list[2] is CGFloat && list[3] is CGFloat
			} else { return false }
		case .offset:
			if (let list = value as? [Any?]) {
				return list[0] is CGFloat && list[1] is CGFloat
			} else { return false }
		default:
			return false
		}
	}*/
}
