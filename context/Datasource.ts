//
//  Datasource.swift
//  memri
//
//  Created by Koen van der Veen on 25/05/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {SchemaItem} from "../model/schema";
import {CVUParsedDatasourceDefinition} from "../parsers/cvu-parser/CVUParsedDefinition";
import {Expression} from "../parsers/expression-parser/Expression";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {Cascadable} from "../cvu/views/Cascadable";

interface UniqueString {
	uniqueString
}

export class Datasource extends SchemaItem implements UniqueString {
	/// Primary key used in the realm database of this Item
	get primaryKey() {
		return "uid"
	}

	/// Retrieves the query which is used to load data from the pod
	query?: string

	/// Retrieves the property that is used to sort on
	sortProperty?: string

	/// Retrieves whether the sort direction
	/// - false sort descending
	/// - true sort ascending
	sortAscending = {};
	/// Retrieves the number of items per page
	pageCount = [] // Todo move to ResultSet

	pageIndex = [] // Todo move to ResultSet
	/// Returns a string representation of the data in QueryOptions that is unique for that data
	/// Each QueryOptions object with the same data will return the same uniqueString
	get uniqueString() {
		var result = []

		result.push((this.query ?? "")) //TODO: .sha256()
		result.push(this.sortProperty ?? "")

		let sortAsc = this.sortAscending.value ?? true
		result.push(String(sortAsc))

		return result.join(":")
	}

	constructor(query?: string) {
		super();
		this.query = query
	}

	fromCVUDefinition(def: CVUParsedDatasourceDefinition,
										viewArguments?) {
		var getValue = function (name: string) {
			let expr = def[name];
			if (expr instanceof Expression) {
				try {
					let x = expr.execForReturnType(viewArguments);
					return x
				} catch (error) {
					debugHistory.warn(`${error}`)
					return null;
				}
			}
			return def[name]
		}

		/*return Cache.createItem(Datasource.self, values: [
			"selector": def.selector ?? "[datasource]",
			"query": try getValue("query") ?? "",
			"sortProperty": try getValue("sortProperty") ?? "",
			"sortAscending": try getValue("sortAscending") ?? true,
		])*/ //TODO:
	}
}

export class CascadingDatasource extends Cascadable implements UniqueString {
	/// Retrieves the query which is used to load data from the pod
	get query() {
		return this.datasource.query ?? this.cascadeProperty("query")
	}

	/// Retrieves the property that is used to sort on
	get sortProperty() {
		return this.datasource.sortProperty ?? this.cascadeProperty("sortProperty")
	}

	/// Retrieves whether the sort direction
	/// false sort descending
	/// true sort ascending
	get sortAscending() {
		return this.datasource.sortAscending.value ?? this.cascadeProperty("sortAscending")
	}

	datasource: Datasource

	/// Returns a string representation of the data in QueryOptions that is unique for that data
	/// Each QueryOptions object with the same data will return the same uniqueString
	get uniqueString() {
		var result = []

		result.push((this.query ?? "")) //TODO: .sha256()
		result.push(this.sortProperty ?? "")

		let sortAsc = this.sortAscending.value ?? true
		result.push(String(sortAsc))

		return result.join(":")
	}

	flattened(): Datasource {
		return new Datasource({
			"query": this.query,
			"sortProperty": this.sortProperty,
			"sortAscending": this.sortAscending,
		}) //TODO:
	}

	constructor(cascadeStack: CVUParsedDatasourceDefinition[],
				viewArguments?: ViewArguments,
				datasource: Datasource) {
		super(cascadeStack, viewArguments)
		this.datasource = datasource
	}

	getSubscript(propName: string) {
		switch (propName) {
			case "query":
				return this.query
			case "sortProperty":
				return this.sortProperty
			case "sortAscending":
				return this.sortAscending
			default:
				return null
		}
	}

	setSubscript(propName: string, value) {
		switch (propName) {
			case "query":
				return this.datasource.query = value ?? ""
			case "sortProperty":
				return this.datasource.sortProperty = String(value) ?? ""
			case "sortAscending":
				return this.datasource.sortAscending.value = Boolean(value) ?? true
			default:
				return
		}
	}
}
