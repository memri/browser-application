//
//  SwiftUIView.swift
//  memri
//
//  Created by Koen van der Veen on 20/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//

/*extension StringProtocol {
	var firstUppercased: String { prefix(1).uppercased() + dropFirst() }
	var firstCapitalized: String { prefix(1).capitalized + dropFirst() }
}*/

import {settings} from "../../model/Settings";
import {jsonDataFromFile, jsonErrorHandling, MemriJSONDecoder, realmWriteIfAvailable} from "../util";
import {DatabaseController} from "../../model/DatabaseController";

export class MainNavigation {
	items = []

	get filterText(): string {
		return settings.get("device/navigation/filterText") ?? "";
	}
	set filterText(newFilter){
		settings.set("device/navigation/filterText", newFilter);
		this.scheduleUIUpdate(undefined);
	}

	scheduleUIUpdate/*: ((((_ context: MemriContext) -> Bool)?) -> Void)?*/

	realm: Realm

	constructor() {
		 DatabaseController.read((realm) => {
			 this.items = realm.objects("NavigationItem").sorted("sequence");
		});
	}

	getItems() {
		let needle = this.filterText.toLowerCase();
		return this.items.filter(function (item) {
			return needle == "" || item.type == "item" && item.title.toLowerCase().indexOf(needle) < -1
		})
	}

	load(callback) {
		// Fetch navigation from realm and sort based on the order property
		let navItems = this.realm.objects(NavigationItem.constructor)
		//.sorted(byKeyPath: "order")

		// Add items to the items array
		for (let item of navItems) {
			this.items.push(item)
		}

		callback()
	}

	install() {
		// Load default navigation items from pacakge
		try {
			let jsonData = jsonDataFromFile("default_navigation")
			this.items = MemriJSONDecoder(jsonData)

			realmWriteIfAvailable(this.realm, function f() {
				for (let item of this.items){
					console.log(item.title);
					this.realm.add(item)
				}
			}.bind(this))
		} catch {
			console.log("Failed to install MainNavigation")
		}
	}
}

class NavigationItem {
	/// Used as the caption in the navigation
	title: string = ""
	/// Name of the view it opens
	view?: string
	/// Defines the position in the navigation
	order: number = 0

	///     0 = Item
	///     1 = Heading
	///     2 = Line
	type: string = "item"

	constructor(decoder: Decoder) {
		jsonErrorHandling(function () {
			this.title = decoder.decodeIfPresent("title") ?? this.title
			this.view = decoder.decodeIfPresent("view") ?? this.view
			this.order = decoder.decodeIfPresent("order") ?? this.order
			this.type = decoder.decodeIfPresent("type") ?? this.type
		}.bind(this))
	}
}
