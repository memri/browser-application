//
//  ConfigPanelModel.swift
//  memri
//
//  Created by Toby Brennan on 28/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

require("../../extension/common/string");

export class ConfigItem {
	displayName: string
	propertyName: string
	type: ConfigItemType|SpecialTypes//TODO
	isItemSpecific: boolean
}

export enum ConfigItemType {
	any = "any",
	bool = "bool",
	string = "string",
	number = "number",
	special = "special",//TODO "special(SpecialTypes)"

	chartType = "chartType",
	timeLevel = "timeLevel"
}



export var getSupportedRealmTypes = function (configItemType) {//TODO
	switch (configItemType) {
		case ConfigItemType.any: return ["bool", "data", "date", "double", "float", "int", "object", "string"]
		case ConfigItemType.bool: return ["bool"]
		case ConfigItemType.string: return ["date", "double", "float", "int", "string"]
		case ConfigItemType.number: return ["double", "float", "int"]
		case ConfigItemType.special: return []
	}
};


export class PossibleExpression {
	propertyName: string
	isComputed: boolean

	constructor(propertyName, isComputed?) {
		this.propertyName = propertyName
		this.isComputed = isComputed ?? false
	}

	get displayName(): string {
		return this.propertyName.camelCaseToWords()
	}

	get expressionString(): String {
		return `.${this.propertyName}${this.isComputed ? "()" : ""}`
	}
}

export enum SpecialTypes {
	chartType = "chartType",
	timeLevel = "timeLevel"
}
