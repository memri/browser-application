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
	MemriButton,
	MemriImage,
	MemriText,
	padding, SectionHeader, Spacer,
	VStack
} from "../swiftUI";
import {Icon} from "@material-ui/core";
import {UUID} from "../../model/items/Item";

export class FilterPanel extends MainUI {
	toggleAscending() {
		let ds = this.context.currentView?.datasource
		ds?.sortAscending = !(ds?.sortAscending ?? true)
		this.context.scheduleCascadableViewUpdate()
	}

	changeOrderProperty(fieldName: string) {
		this.context.currentView?.datasource.sortProperty = fieldName
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

		let properties = Object.keys(item)

		return properties.map((prop) => {
			if (!excludeList.includes(prop) && !prop.startsWith("_")) {
					return prop
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
		let context = this.context
		let cascadableView = this.context.currentView
		let renderers = this.getRendererCategories()
		let segmentedRendererCategories = []
		let rendererCategories = []

		for (let i = 0; i < renderers.length; i++) {
			rendererCategories.push(renderers[i])
			if (rendererCategories.length == 5) {
				segmentedRendererCategories.push(rendererCategories)
				rendererCategories = []
			}
		}
		if (rendererCategories.length) segmentedRendererCategories.push(rendererCategories)
		// let segmentedRendererCategories = this.getRendererCategories().segments(ofSize: 5).indexed()
		//TODO segments function?

		let currentSortProperty = cascadableView?.datasource.sortProperty ?? ""//TODO

		return (
			<div className="FilterPanel">
			<HStack alignment={Alignment.top} spacing={0}
					frame={frame({maxWidth: ".infinity", alignment: Alignment.topLeading, height: 240})}
					background={"#eee"}
			>
				<VStack alignment={Alignment.leading} spacing={0} padding={padding({bottom: 1})}>
					<VStack spacing={3}
							frame={frame({maxWidth: ".infinity", alignment: Alignment.leading})}
							padding={padding({leading: 12, top: 1})}
							background={"white"}
					>
						{segmentedRendererCategories.map((categories) =>
							<HStack alignment={Alignment.top} spacing={3}
									frame={frame({maxWidth: ".infinity", alignment: Alignment.leading})}
									padding={padding({leading: 12, top: 1})}
									background={new Color("white").toLowerCase()}
							>
								{categories.map((renderer) =>
									<MemriButton
										onClick={() => context.executeAction(renderer[1])} key={renderer[0]}>
										<MemriImage fixedSize=""
													padding={padding({horizontal: 5, vertical: 5})}
													frame={frame({width: 35, height: 40, alignment: Alignment.center})}
													foregroundColor={this.isActive(renderer[1])
														? renderer[1].getColor("activeColor").toLowerCase()
														: renderer[1].getColor("inactiveColor").toLowerCase()}
													background={this.isActive(renderer[1])
														? renderer[1].getColor("activeBackgroundColor").toLowerCase()
														: renderer[1].getColor("inactiveBackgroundColor").toLowerCase()}
										>
											{renderer[1].getString("icon")}
										</MemriImage>
									</MemriButton>
								)}
							</HStack>
						)}
					</VStack>

					<ASTableView>
						{this.getRenderersAvailable(this.currentRendererCategory).map((item) =>
							<MemriButton onClick={() => this.context.executeAction(item[1])}>
								<Group padding={padding({horizontal: 6, vertical: 6})}>
									{cascadableView?.activeRenderer == item[1].rendererName ?
										<MemriText foregroundColor={"#6aa84f"}
												   font={font({size: 16, weight: Font.Weight.semibold})}
										>
											{item[1].getString("title")}
										</MemriText>
										:
										<MemriText foregroundColor={"#434343"}
												   font={font({size: 16, weight: Font.Weight.regular})}
										>
											{item[1].getString("title")}
										</MemriText>
									}
								</Group>
							</MemriButton>
						)}
					</ASTableView>
				</VStack>

				<ASTableView>
					<SectionHeader background={"white"}
								   padding={padding({vertical: 1, leading: 1})}
					>
						<MemriText padding={4}
								   frame={frame({maxWidth: "infinity", alignment: Alignment.leading})}
								   font={font({size: 14, weight: Font.Weight.semibold})}
								   foregroundColor={"#434343"}
								   background={new Color("secondarySystemBackground").toLowerCase()}
						>
							Sort on:
						</MemriText>

					</SectionHeader>
					<MemriButton onClick={() => this.toggleAscending()}>
						<HStack>
							<MemriText foregroundColor={"#6aa84f"}
									   font={font({size: 16, weight: Font.Weight.semibold,
										   design: "default"})}
									   frame={frame({
										   minWidth: 0,
										   maxWidth: "infinity",
										   alignment: Alignment.leading
									   })}
							>
								{currentSortProperty}
							</MemriText>
							<Spacer/>
							<MemriImage resizable={"true"}//TODO
										// aspectRatio={"fit"}//TODO
										foregroundColor={"#6aa84f"}
										frame={frame({minWidth: 10/*, maxWidth: 10*/})}
							>
								{cascadableView.datasource.sortAscending === false
								? "arrow_downward"
								: "arrow_upward"}
							</MemriImage>
						</HStack>
					</MemriButton>
					{cascadableView?.sortFields.filter (($0) =>
						cascadableView?.datasource.sortProperty != $0
					).map ((fieldName) =>
						<MemriButton onClick={() => this.changeOrderProperty(fieldName)}>
							<MemriText foregroundColor={"#434343"}
									   font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
									   frame={frame({maxWidth: "infinity", alignment: Alignment.leading})}
							>
								{fieldName}
							</MemriText>
						</MemriButton>
					)}
					{this.getRelevantFields().map ((fieldName) =>
						<MemriButton onClick={() => this.changeOrderProperty(fieldName)}>
							<MemriText foregroundColor={"#434343"}
									   font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
									   frame={frame({maxWidth: "infinity", alignment: Alignment.leading})}
							>
								{fieldName}
							</MemriText>
						</MemriButton>
					)}

				</ASTableView>

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
