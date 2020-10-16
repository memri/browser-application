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

import {Settings} from "../../router";
import {DatabaseController} from "../../router";
import {Realm} from "../../router";

export class MainNavigation {
	items = []

	get filterText(): string {
		return Settings.shared.get("device/navigation/filterText") ?? "";
	}
	set filterText(newFilter){
		Settings.shared.set("device/navigation/filterText", newFilter);
		this.scheduleUIUpdate(true);
	}

	scheduleUIUpdate/*: ((((_ context: MemriContext) -> Bool)?) -> Void)?*/

	realm: Realm

	constructor() {

	}

	getItems() {
		let needle = this.filterText.toLowerCase();
		let items = DatabaseController.sync (false,($0)=> {
			return $0.objects("NavigationItem").sorted("sequence")
		})
		return items.filter(function (item) {
			return needle == "" || item.itemType == "item" && item.title.toLowerCase().indexOf(needle) > -1
		})
	}

	load(callback) {
		this.items = []//TODO??
		// Fetch navigation from realm and sort based on the order property
		let navItems = this.realm.objects("NavigationItem").sorted("order")

		// Add items to the items array
		for (let item of navItems) {
			this.items.push(item)
		}

		callback && callback()
	}

}
