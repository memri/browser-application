//
//  ListRendererView.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {Alignment, Color, Font} from "../../../../router";
import {ActionDelete} from "../../../../router";
import {
	ASSection,
	ASTableView,
	font, frame, MemriDivider,
	MemriImage,
	MemriRealButton,
	MemriText,
	padding,
	RenderersMemri,
	VStack
} from "../../swiftUI";
import {CascadingRendererConfig} from "../../../../router";

export class ListRendererConfig extends CascadingRendererConfig {
	get longPress() { return this.cascadeProperty("longPress") }
	set longPress(value) { this.setState("longPress", value) }

	get press() { return this.cascadeProperty("press") }
	set press(value) { this.setState("press", value) }

	get slideLeftActions() { return this.cascadeList("slideLeftActions") }
	set slideLeftActions(value) { this.setState("slideLeftActions", value) }

	get slideRightActions() { return this.cascadeList("slideRightActions") }
	set slideRightActions(value) { this.setState("slideRightActions", value) }

	defaultEdgeInset = {top: 8, left: 15, bottom: 8, right: 15}
	defaultSpacing = {width: 0, height: 10}
}

export class ListRendererController {
	static rendererType = {name:"list",icon: "list"/*line.horizontal.3*/, makeController:ListRendererController, makeConfig:ListRendererController.makeConfig}

	constructor(context: MemriContext, config?: CascadingRendererConfig) {
		this.context = context
		this.config = config ?? new ListRendererConfig()
	}

	context: MemriContext
	config: ListRendererConfig

	makeView() {
		return new ListRendererView({controller: this, context: this.context}).render();
	}

	update() {
		/*objectWillChange.send()*/
		return
	}

	static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
		return new ListRendererConfig(head, tail, host)
	}

	view(item: Item) {
		return this.config.render(item)
	}

	get isEditing(): boolean {
		return this.context.editMode
	}

	get hasItems() {
		return this.context.items.length != 0
	}

	get emptyText() {
		return this.context.currentView?.emptyResultText
	}
}

export class ListRendererView extends RenderersMemri {
	controller: ListRendererController

	deleteItem = (item) => {
		this.controller.context.executeAction(new ActionDelete(this.controller.context), item);
	}

	componentDidMount() {
		this.updateHeight()
	}

	componentDidUpdate() {
		this.updateHeight()
	}

	render() {
		this.controller = this.props.controller;
		let items = this.controller.context.items;

		return (
			<div className={"ListRendererView"}>
				<VStack>
					{this.controller.hasItems ?
						<ASTableView
									 background={this.controller.config.backgroundColor ?? new Color("systemBackground")}
									 spacing={this.controller.config.spacing}
									 contentInsets={padding({
										 top: this.controller.config.edgeInset.top,
										 left: 0,
										 bottom: this.controller.config.edgeInset.bottom,
										 right: 0
									 })}>
							<ASSection editMode={this.controller.isEditing}
									   selectionMode={this.selectionMode}
									   selectedIndices={this.controller.context.selectedIndicesBinding}
									   direction={"column"}
									   data={items}
									   dataID={"uid"}
									   deleteIconFn={(dataItem, index) => <VStack textAlign={"right"}>
										   <MemriRealButton action={this.deleteItem.bind(this, dataItem)}>
											   <MemriImage font={font({size:14})}>delete_forever</MemriImage>
										   </MemriRealButton>
										   {(index != items.length - 1) && <MemriDivider/>}
									   </VStack>}
									   callback={(dataItem, index) =>
										   <VStack key={dataItem.uid}
												   padding={padding({
													   top: (index == 0) ? 0 : this.controller.config.spacing / 2,
													   leading: this.controller.config.edgeInset.left,
													   bottom: (index == items.length - 1) ? 0 : this.controller.config.spacing / 2,
													   trailing: this.controller.config.edgeInset.right,
												   })}
										   >
										   {this.controller.view(dataItem)}
									   </VStack>}
							/>
						</ASTableView> :
						<MemriText multilineTextAlignment={Alignment.center}
								   font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
								   opacity={0.7} padding={padding(30)} /*frame={fra}*/>
							{this.controller.emptyText}
						</MemriText>
					}
				</VStack>
			</div>
		)
	}

	selectionMode(dataItem) {
		if (this.controller.isEditing) {
			return this.selectedIndicesBinding
		} else {
			return this.executeAction(dataItem)
			/*return .selectSingle { index in
		if let press = self.controller.config.press {
			self.controller.context.executeAction(press, with: self.controller.context.items[safe: index])
		}
	}*/ //TODO:
		}
	}
	selectionMode = this.selectionMode.bind(this)

	/*func contextMenuProvider(index: Int, item: Item) -> UIContextMenuConfiguration? {
	UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { [weak context] (suggested) -> UIMenu? in
		let children: [UIMenuElement] = self.renderConfig.contextMenuActions.map { [weak context] action in
		UIAction(title: action.getString("title"),
			image: nil) { [weak context] (_) in
		context?.executeAction(action, with: item)
		}
		}
		return UIMenu(title: "", children: children)
	}
}*/
}