//
//  ResultSet.swift
//  memri
//
//  Created by Ruben Daniels on 5/22/20.
//  Copyright © 2020 memri. All rights reserved.
//


/// This class wraps a query and its results, and is responsible for loading a the result and possibly applying clienside filtering
import {CacheMemri} from "../../router";
import {ItemFamily} from "../../router";

export class ResultSet {
	/// Object describing the query and postprocessing instructions
	datasource: Datasource
	/// Resulting Items
	items: Item[] = []
	/// Nr of items in the resultset
	count = 0
	/// Boolean indicating whether the Items in the result are currently being loaded
	isLoading = false

	/// Unused, Experimental
	pages = []
	cache: CacheMemri
	_filterText: String;
	_unfilteredItems?

	/// Computes the type of the data items being requested via the query
	/// Returns "mixed" when data items of multiple types can be returned
	get determinedType() {
		// TODO: implement (more) proper query language (and parser)
		let query = this.datasource.query

		if (query && query != "") {
			let typeName = query.split(" ")[0]
			if (typeName) {
				return String(typeName == "*" ? "mixed" : typeName)
			}
		}
		return null
	}

	/// Boolean indicating whether the resultset is a collection of items or a single item
	get isList() {
		// TODO: change this to be a proper query parser
		// TODO: this is called very often, needs caching

		let [typeName, filter] = this.cache.parseQuery(this.datasource.query ?? "")
		let type = ItemFamily[typeName]

		if (type) {
			if ((filter ?? "").match("^AND uid = .*?$")?.length > 0) {//TODO match
				return false
			}
		}

		return true
	}

	/// Get the only item from the resultset if the set has size 1, else return nil. Note that
	///  [singleton](https://en.wikipedia.org/wiki/Singleton_(mathematics)) is here in the mathematical sense.
	get singletonItem() {
		if (!this.isList && this.count > 0) { return this.items[0] }
		else { return null }
	}

	set singletonItem(newValue) {}

	/// Text used to filter queries
	get filterText() {
		return this._filterText
	}

	set filterText(newValue) {
		if (this._filterText != newValue) {
			this._filterText = newValue?.nilIfBlankOrSingleLine;
			this.filter()
		}
	}


	constructor(ch: CacheMemri, datasource: Datasource) {
		this.cache = ch
		this.datasource = datasource
	}

	/// Executes a query given the current QueryOptions, filters the result client side and executes the callback on the resulting
	///  Items
	/// - Parameter callback: Callback with params (error: Error, result: [Item]) that is executed on the returned result
	/// - Throws: empty query error
    load(syncWithRemote: boolean = true, callback) {
		if (!this.isLoading) {
			if (this.datasource.query == "") {
				throw "Exception: No query specified when loading result set"
			}

			this.isLoading = true

			this.updateUI()

            this.cache.query(this.datasource, syncWithRemote, (error, result) => {
				if (result) {
					this.items = result
					this.count = this.items.length

					if (this._unfilteredItems != undefined) {
						this._unfilteredItems = null
						this.filter()
					}

					// We've successfully loaded page 0
					this.setPagesLoaded(0) // TODO: This is not used at the moment

					this.isLoading = false

					// Done
					callback(null)
				} else if (error != undefined) {
					this.isLoading = false

					callback(error)
				}

				this.updateUI()
			})
		}
	}

	/// Force update the items property, recompute the counts and reapply filters
	/// - Parameter result: the new items
	reload() {
        this.load(false, function(){})
	}

	updateUI() {
		//this.objectWillChange.send() // TODO: create our own publishers
	}

	/// Apply client side filter using the FilterText , with a fallback to the server
	filter() {
		// Cancel filtering
		let filter = this._filterText;
		if (filter) {
			// Filter using _filterText
			var filterResult = []

			// Filter through items
			let searchSet = this._unfilteredItems ?? this.items
			if (searchSet.length > 0) {
				for (var i = 0; i < searchSet.length - 1; i++) {
					if (searchSet[i].hasProperty(filter)) {
						filterResult.push(searchSet[i])
					}
				}
			}

			// Store the items of this resultset
			if (this._unfilteredItems == undefined) { this._unfilteredItems = this.items }

			// Set the filtered result
			this.items = filterResult
			this.count = filterResult.length
		}


		else {
			// If we filtered before...
			if (this._unfilteredItems) {
				// Put back the items of this resultset
				this.items = this._unfilteredItems
				this.count = this._unfilteredItems.length
			}
		}

		//this.objectWillChange.send() // TODO: create our own publishers
	}

	/// Executes the query again
	// reload(_: ResultSet) {//TODO
		// Reload all pages
		//        for (page, _) in searchResult.pages {
		//            let _ = self.loadPage(searchResult, page, { (error) in })
		//        }
	// }

	/// - Remark: currently unused
	/// - Todo: Implement
	/// - Parameter options:
	resort() {}

	/// Mark page with pageIndex as index as loaded
	/// - Parameter pageIndex: index of the page to mark as loaded
	setPagesLoaded(pageIndex) {
		if (!this.pages.includes(pageIndex)) {
			this.pages.push(pageIndex)
		}
	}
}
