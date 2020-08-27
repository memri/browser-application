//
//  FilterPanel.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {Alignment, Color, Font} from "../../parsers/cvu-parser/CVUParser";
import {allRenderers} from "../../cvu/views/Renderers";
import {
	ASTableView, font,
	frame,
	Group,
	HStack,
	MainUI,
	MemriRealButton,
	MemriImage,
	MemriText,
	padding, SectionHeader, Spacer,
	VStack, MemriDivider
} from "../swiftUI";
import {Icon} from "@material-ui/core";
import {UUID} from "../../model/items/Item";
import {RendererSelectionPanel} from "./RendererSelectionPanel";
import {ConfigPanel} from "./ConfigPanel";

export class FilterPanel extends MainUI {
	toggleAscending() {
		let ds = this.context.currentView?.datasource
		if (ds)
			ds.sortAscending = !(ds?.sortAscending ?? true)
		this.context.scheduleCascadableViewUpdate()
	}

	changeOrderProperty(fieldName: string) {
		if (this.context.currentView)
			this.context.currentView.datasource.sortProperty = fieldName
		this.context.scheduleCascadableViewUpdate()
	}

	getRendererCategories() {
		let rendererCategories = Object.entries(allRenderers.tuples)
			.map ((item) => [
				item[0],
				item[1](this.context),
			])
			.filter ((item) =>
				!item[0].includes(".") && item[1].canDisplayResults(this.context.items)
			)
			.sort((item1, item2) => item1[1].order - item2[1].order)

		return rendererCategories
	}

	get currentRendererCategory() {
		return this.context.currentView?.activeRenderer.split(".")[0]//TODO .map(String.init)
	}

	getRenderersAvailable(category) {
		if (!category) { return [] }
		return Object.entries(allRenderers.all)
			.map ((arg0) => {//TODO
				let [key, value] = arg0
				return [key, value(this.context)]
			})
			.filter ( (renderer) =>
				renderer[1].rendererName.split(".")[0] == category
			)
			.sort((item1, item2) => item1[1].order - item2[1].order )
	}

	getRelevantFields(type?: PropertyType) {
		let item = this.context.currentView?.resultSet.items[0]
		if (!item) { return [] }

		var excludeList = []
		Object.assign(excludeList, this.context.currentView?.sortFields ?? [])
		excludeList.push(this.context.currentView?.datasource.sortProperty ?? "")
		excludeList.push("uid", "deleted", "externalId")

		let properties = Object.entries(item)

		return properties.map((prop) => {
			if (!excludeList.includes(prop[0]) && !prop[0].startsWith("_") && typeof prop[1] !== "object") {
				return prop[0]
			}
			else {
				return undefined
			}
		}).filter((item) => item != undefined)
	}

	isActive(renderer: FilterPanelRendererButton) {
		return this.context.currentView?.activeRenderer.split(".")[0] ?? "" == renderer.rendererName
	}

	render() {
		this.context = this.props.context

		return (
			<div className="FilterPanel">
			<HStack alignment={Alignment.top} spacing={0}
					frame={frame({maxWidth: ".infinity", alignment: Alignment.topLeading, height: 240})}
					background={"#eee"}
			>
				<RendererSelectionPanel context={this.context}/>
				<MemriDivider/>
				<ConfigPanel  context={this.context}
							  frame={frame({width: 200})}/>
			</HStack>
			</div>
		);
	}
}

/*struct FilterPanel_Previews: PreviewProvider {
	static var previews: some View {
		FilterPanel().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
