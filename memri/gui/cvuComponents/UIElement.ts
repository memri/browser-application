//
//  UIElement.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

import {
	Alignment, CVU_SizingMode,
	CVUColor,
	CVUFont,
	CVUSerializer,
	dataItemListToArray, debugHistory,
	TextAlignment,
	ViewArguments
} from "../../../router";
import {UUID} from "../../../router";
import {MemriDictionary} from "../../../router";
import {UIElementView} from "./UIElementView";

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

export class UINodeResolver {
	constructor(node: UINode, viewArguments: ViewArguments) {
		this.node = node
		this.viewArguments = viewArguments
	}

	get id() { return this.node.id;	}
	node: UINode
	viewArguments: ViewArguments;

	get item() { return this.viewArguments.get(".") }

	resolve(propertyName, type?) {
		let property = this.node.properties[propertyName];
		if (!property) {
			return
		}

		let propertyExpression = property;
		if (propertyExpression?.constructor?.name == "Expression") {
			try {
				if (type == "[Item]") {
					let x = propertyExpression.execute(this.viewArguments)

					var result = [];
					let list = x; //TODO: x as? Results<Edge>
					if (Array.isArray(list) && list.length > 0 && list[1]?.constructor?.name == "Edge") {
						for (let edge of list) {
							let d = edge.target();
							if (d) {
								result.push(d);
							}
						}
					} else {
						result = dataItemListToArray(x)
					}
					return result;
				} else {
					let x = propertyExpression.execForReturnType(this.viewArguments);
					return x
				}

			} catch (error) {
				console.log(`Expression could not be resolved: ${propertyExpression.code}. ${error}`)
				return;
			}
		} else if (type == "CGFloat" && typeof property == "number") {
			return Number(property);
		} else if (type == "Int" && typeof property == "number") {
			return Number(property);
		} else if (property) {
			return property
		} else {
			return;
		}
	}

	childrenInArray(item?: Item) {
		let newArguments = this.viewArguments;
		if (item)
			newArguments = new ViewArguments(this.viewArguments, item)
		return this.node.children.map(($0) => new UIElementView({nodeResolver: new UINodeResolver($0, newArguments)}).render())
	}

	childrenInForEach(item?: Item) {
		let newArguments = this.viewArguments;
		if (item)
			newArguments = new ViewArguments(this.viewArguments, item)
		let childNodeResolvers = this.node.children.map(($0) => new UIElementView({nodeResolver: new UINodeResolver($0, newArguments)}).render());
		return childNodeResolvers
	}

	fileURI(propertyName: string) {
		let property = this.resolve(propertyName);
		let file
		if (property?.constructor.name == "File") {
			file = property
		} else if (property?.constructor.name == "Photo") {
			let photo = property
			file = photo?.file
		}
		return file?.filename ? "memri/Resources/DemoAssets/" + file.filename + ".jpg" : null
	}

	color(propertyName: string = "color") {
		let colorDef = this.resolve(propertyName, "CVUColor");
		if (colorDef) {
			return colorDef
		} else {
			let colorHex = this.resolve(propertyName, "String");
			if (colorHex) {
				return CVUColor.hex(colorHex)
			}
		}
		return;
	}

	font(propertyName: string = "font", defaultValue = new CVUFont()) {
		let value = this.resolve(propertyName, "[Any]");
		if (value) {
			let name = value[0];
			let size = value[1];
			if (typeof name == "string" && typeof size == "number") {
				return new CVUFont(name, size, value[2] ?? defaultValue.weight);
			} else {
				let size = value[0];
				if (typeof size == "number") {
					return new CVUFont(defaultValue.name, size, value[1] ?? defaultValue.weight);
				}
			}
		} else {
			let size = this.resolve(propertyName, "CGFloat");
			if (size) {
				return new CVUFont(defaultValue.name, size, defaultValue.weight);
			} else {
				let weight = this.resolve(propertyName, "String");
				if (weight) {
					return new CVUFont(defaultValue.name, defaultValue.size, weight);
				}
			}
		}
		return defaultValue
	}

	alignment(propertyName: string = "alignment") {
		switch (this.resolve(propertyName, "String")) {
			case "left":
			case "leading":
				return Alignment.leading
			case "top":
				return Alignment.top
			case "right":
			case "trailing":
				return Alignment.trailing
			case "bottom":
				return Alignment.bottom
			case "center":
				return Alignment.center
			case "lefttop":
			case "topleft":
				return Alignment.topLeading
			case "righttop":
			case "topright":
				return Alignment.topTrailing
			case "leftbottom":
			case "bottomleft":
				return Alignment.bottomLeading
			case "rightbottom":
			case "bottomright":
				return Alignment.bottomTrailing
			default:
				return Alignment.center
		}
	}

	textAlignment(propertyName: string = "textAlign") {
		switch (this.resolve(propertyName, "String")) {
			case "left":
			case "leading":
				return TextAlignment.leading
			case "right":
			case "trailing":
				return TextAlignment.trailing
			case "center":
			case "middle":
				return TextAlignment.center
			default:
				return TextAlignment.leading
		}
	}

	string(propertyName: string) {
		return this.resolve(propertyName, "String");
	}

	int(propertyName: string) {
		return this.resolve(propertyName, "Int");
	}

	double(propertyName: string) {
		return this.resolve(propertyName, "Double");
	}

	cgFloat(propertyName: string) {
		return this.resolve(propertyName, "CGFloat");
	}

	cgPoint(propertyName: string) {
		let dimensions = this.resolve(propertyName, "[Double]");
		if (dimensions) {
			let x = dimensions[0];
			let y = dimensions[1];
			if (x && y) {
				return new CGPoint(x, y)
			} else {
				let dimension = this.resolve(propertyName, "CGFloat");
				if (dimension) {
					return new CGPoint(dimension, dimension)
				}
			}
		}
		return undefined
	}

	insets(propertyName: string) {
		let insetArray = this.resolve(propertyName, "[Double]")/*?.map(($0) => Number($0));*/
		if (insetArray && insetArray.length > 0) {
			switch (insetArray.length) {
				case 2:
					return new EdgeInsets(
						insetArray[1],
						insetArray[0],
						insetArray[1],
						insetArray[0]
					)
				case 4:
					return new EdgeInsets(
						insetArray[0],
						insetArray[3],
						insetArray[2],
						insetArray[1]
					)
				default:
					return;
			}
		} else {
			let edgeInset = this.resolve(propertyName, "CGFloat");
			if (edgeInset) {
				return new EdgeInsets(
					edgeInset,
					edgeInset,
					edgeInset,
					edgeInset
				)
			} else {
				return null;
			}
		}
	}

	bool(propertyName: string, defaultValue: boolean) {
		return this.resolve(propertyName, "Bool") ?? defaultValue;
	}

	//TODO: this is our way to avoid bindings @mkslanc
	binding(propertyName, defaultValue?) {
		let type = this.getType(propertyName)
		let dataItem = type[1], itemPropertyName = type[2];
		if (dataItem && dataItem.hasProperty(itemPropertyName)) {
			return {
				get: () => {
					return dataItem.get(itemPropertyName) ?? defaultValue;
				},
				set: (value) => {
					dataItem.set(itemPropertyName, value);
				}
			}
		}

		return null;
	}

	getType(propName: string) {
		let prop = this.node.properties[propName];
		if (prop) {
			// Execute expression to get the right value
			let expr = prop;
			if (expr?.constructor?.name == "Expression") {
				try {
					return expr.getTypeOfItem(this.viewArguments)
				} catch (e) {
					// TODO: Refactor: Error Handling
					debugHistory.error(`could not get type of ${String(this.item)}`)
				}
			}
		}
		return ["any", this.item, ""] //TODO:
	}

	get showNode() {
		return this.bool("show", true);
	}

	get opacity() {
		return this.double("opacity") ?? 1
	}

	get cornerRadius() {
		return this.cgFloat("cornerRadius") ?? 0
	}

	get spacing() {
		return this.cgFloat("spacing") ?? 0;
	}

	get backgroundColor() {
		return this.color("background");
	}

	get borderColor() {
		return this.color("border")
	}

	get minWidth() {
		return this.cgFloat("width") ?? this.cgFloat("minWidth")
	}

	get minHeight() {
		return this.cgFloat("height") ?? this.cgFloat("minHeight")
	}

	get maxWidth() {
		return this.cgFloat("width") ?? this.cgFloat("maxWidth")
	}

	get maxHeight() {
		return this.cgFloat("height") ?? this.cgFloat("maxHeight")
	}

	get offset() {
		let value = this.cgPoint("offset");
		if (!value) {
			return 0;
		}
		return new CGSize(value.x, value.y)
	}

	get shadow() {
		let value = this.cgFloat("shadow");
		if (!value || value == 0) {
			return null
		}
		return value
	}

	get sizingMode() {
		return this.string("sizingMode") ?? CVU_SizingMode.fit //TODO:
	}

	get zIndex() {
		return this.double("zIndex");
	}

	get lineLimit() {
		return this.int("lineLimit");
	}

	get forceAspect() {
		return this.bool("forceAspect", false);
	}

	get padding() {
		let uiInsets = this.insets("padding");
		if (!uiInsets) {
			return
		}
		return new EdgeInsets(uiInsets.top, uiInsets.left, uiInsets.bottom, uiInsets.right);
	}

	get margin() {
		let uiInsets = this.insets("margin");
		if (!uiInsets) {
			return
		}
		return new EdgeInsets(uiInsets.top, uiInsets.left, uiInsets.bottom, uiInsets.right);
	}

}

export class EdgeInsets {
	top;
	left;
	bottom;
	right;

	constructor(top, left, bottom, right) {
		this.top = top;
		this.left = left;
		this.bottom = bottom;
		this.right = right;
	}
}

export class CGSize {
	x;
	y;

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

var CGPoint = CGSize;

