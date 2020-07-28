//
//  Datasource.swift
//  Copyright © 2020 memri. All rights reserved.

import {Cascadable} from "../cvu/views/Cascadable";

interface UniqueString {
	uniqueString
}

export class Datasource implements UniqueString {
	/*public static func == (lhs: Datasource, rhs: Datasource) -> Bool {//TODO
		lhs.uniqueString == rhs.uniqueString
	}*/
	/// Retrieves the query which is used to load data from the pod
	query?: string

	/// Retrieves the property that is used to sort on
	sortProperty?: string

	/// Retrieves whether the sort direction
	/// - false sort descending
	/// - true sort ascending
	sortAscending: boolean;
	/// Retrieves the number of items per page
	pageCount: number

	pageIndex: number
	/// Returns a string representation of the data in QueryOptions that is unique for that data
	/// Each QueryOptions object with the same data will return the same uniqueString
	get uniqueString() {
		var result = []

		result.push((this.query ?? "")) //TODO: .sha256()
		result.push(this.sortProperty ?? "")

		let sortAsc = this.sortAscending ?? true
		result.push(String(sortAsc))

		return result.join(":")
	}

	constructor(query?: string, sortProperty?: string, sortAscending?: boolean) {
		this.query = query
		this.sortProperty = sortProperty
		this.sortAscending = sortAscending
	}

	/*fromCVUDefinition(def: CVUParsedDatasourceDefinition,
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

		/!*return Cache.createItem(Datasource.self, values: [
			"selector": def.selector ?? "[datasource]",
			"query": try getValue("query") ?? "",
			"sortProperty": try getValue("sortProperty") ?? "",
			"sortAscending": try getValue("sortAscending") ?? true,
		])*!/ //TODO:
	}*/
}

export class CascadingDatasource extends Cascadable/*  implements UniqueString, Subscriptable*/ {
	/// Retrieves the query which is used to load data from the pod
	get query() {
		return this.cascadeProperty("query")
	}

	set query(value) {
		this.setState("query", value)
	}

	/// Retrieves the property that is used to sort on
	get sortProperty() {
		return this.cascadeProperty("sortProperty")
	}

	set sortProperty(value) {
		this.setState("sortProperty", value)
	}

	/// Retrieves whether the sort direction
	/// false sort descending
	/// true sort ascending
	get sortAscending() {
		return this.cascadeProperty("sortAscending")
	}

	set sortAscending(value) {
		this.setState("sortAscending", value)
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
		return new Datasource(
			this.query,
			this.sortProperty,
			this.sortAscending,
		) //TODO:
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
				return this.query = value ?? ""
			case "sortProperty":
				return this.sortProperty = String(value)
			case "sortAscending":
				return this.sortAscending = Boolean(value)
			default:
				return
		}
	}
}
