//
//  FIlterpannel.swift
//  memri
//
//  Created by Koen van der Veen on 25/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from "react";
import {Alignment, Color, Font} from "../../parsers/cvu-parser/CVUParser";
import {UUID} from "../../model/DataItem";
import {allRenderers, FilterPanelRendererButton} from "../../cvu/views/Renderers";
import {frame, HStack, MainUI, MemriButton, padding, VStack} from "../swiftUI";
import {Icon} from "@material-ui/core";

class BrowseSetting/* extends Identifiable*/ {
	id = UUID()
	name: string
	selected: boolean
	get color() { return this.selected ? new Color("#6aa84f") : new Color("#434343") }
	get fontWeight() { return this.selected ? Font.Weight.semibold : Font.Weight.regular }

	constructor(name, selected) {
		// super()

		this.name = name
		this.selected = selected
	}
}

export class FilterPanel extends MainUI {
	browseSettings = [new BrowseSetting("Default", true),
		new BrowseSetting("Year-Month-Day view", false)]

	allOtherFields() {
		var list = []
		let item = this.context.cascadingView?.resultSet.items[0]

		if (item) {
			var excludeList = this.context.cascadingView?.sortFields
			excludeList?.push(this.context.cascadingView?.datasource.sortProperty ?? "")
			excludeList?.push("uid")
			excludeList?.push("deleted")

			let properties = item.objectSchema.properties
			for (var prop of properties) {
				if (!(excludeList?.includes(prop.name) ?? false) && prop.type != ".object" && prop.type != ".linkingObjects") {
					list.push(prop.name)
				}
			}
		}

		return list
	}

/*	toggleAscending() {
		realmWriteIfAvailable(this.context.realm, function() {
			this.context.currentSession?.currentView?.datasource?.sortAscending.value
				= !(this.context.cascadingView?.datasource.sortAscending ?? true)
		}.bind(this))
		this.context.scheduleCascadingViewUpdate()
	}

	changeOrderProperty(fieldName: string) {
		realmWriteIfAvailable(this.context.realm, function() {
			this.context.currentSession?.currentView?.datasource?.sortProperty = fieldName
		}.bind(this))

		this.context.scheduleCascadingViewUpdate()
	}*/

	rendererCategories() {
		let rendererCategories = Object.entries(allRenderers.tuples)
			.map ((item) => [
				item[0],
				item[1](this.context),
			])
			.filter ((item) =>
				!item[0].includes(".") && item[1].canDisplayResults(this.context.items)//TODO
			)
			.sort((item1, item2) => item1[1].order - item2[1].order)

		return rendererCategories
	}

	renderersAvailable() {
		let currentCategory = this.context.cascadingView?.activeRenderer.split(".")[0]

		if (currentCategory) {
			return this.context.renderers.all
				.map ((arg0) => {//TODO
					let [key, value] = arg0
					return [key, value(this.context)]
				})
				.filter ( (renderer) =>
					renderer.rendererName.split(".")[0] == currentCategory
				)
				.sort((item1, item2) => item1.order - item2.order )
		}
		return []
	}

	isActive(renderer: FilterPanelRendererButton) {
		return this.context.cascadingView?.activeRenderer.split(".")[0] ?? "" == renderer.rendererName
	}

	render() {
		this.context = this.props.context
		let context = this.context
		let cascadingView = this.context.cascadingView

		return (
			<div className="FilterPanel">
			<HStack alignment={Alignment.top} spacing={0}
					frame={frame({maxWidth: ".infinity", alignment: Alignment.topLeading, height: 240})}
					background={"#eee"}
			>
				<VStack alignment={Alignment.leading} spacing={0} padding={padding({bottom: 1})}>
					<HStack alignment={Alignment.top} spacing={3}
							frame={frame({maxWidth: ".infinity", alignment: Alignment.leading})}
							padding={padding({leading: 12, top: 1})}
							background={new Color("white").toLowerCase()}
					>
						{this.rendererCategories().map((renderer) => <MemriButton
							action={context.executeAction(renderer[1])} key={renderer[0]}>
							<Icon>{renderer[1].getString("icon")}</Icon>
						</MemriButton>)}
					</HStack>

					{/*<ASTableView>
						<ASSection id={0} data={this.renderersAvailable()} dataID={} >

						</ASSection>
					</ASTableView>*/}
				</VStack>

				{/*<ASTableView>
					<ASSection id={0} container={} >

					</ASSection>
				</ASTableView>*/}
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
