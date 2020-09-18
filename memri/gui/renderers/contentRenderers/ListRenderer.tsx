//
//  ListRendererView.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {Alignment, Color, Font} from "../../../cvu/parsers/cvu-parser/CVUParser";
import {ActionDelete} from "../../../cvu/views/Action";
import {
	ASTableView,
	font,
	MemriImage,
	MemriRealButton,
	MemriText,
	padding,
	RenderersMemri,
	VStack
} from "../../swiftUI";
import {ListItem} from "@material-ui/core";
import {CascadingRendererConfig} from "../../../cvu/views/CascadingRendererConfig";

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
	static rendererType = {name:"list",icon: "line.horizontal.3", makeController:ListRendererController, makeConfig:ListRendererController.makeConfig}

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

	get selectedIndices() {
		/*Binding<Set<Int>>(
			get: { [] },
			set: {
				self.context.cascadingView?.userState?
					.set("selection", $0.compactMap { self.context.items[safe: $0] })
			}
		)*/ //TODO:
		return
	}

	get hasItems() {
		return !this.context.items.isEmpty //TODO: ?
	}

	get emptyText() {
		return this.context.currentView?.emptyResultText
	}
}

export class ListRendererView extends RenderersMemri {
	controller: ListRendererController

	get sections() { //contextMenuProvider: contextMenuProvider
		let items = this.controller.context.items;
		return items.map((dataItem) => {
			return <><ListItem key={dataItem.uid} onClick={
				this.executeAction(dataItem)
			}>
				{this.controller.view(dataItem)}

			</ListItem><MemriRealButton action={this.deleteItem.bind(this, dataItem)}><MemriImage>delete_forever</MemriImage></MemriRealButton></>
		})
		/*
		.padding(EdgeInsets(top: cellContext.isFirstInSection ? 0 : self.renderConfig.spacing.height / 2,
												leading: self.renderConfig.edgeInset.left,
												bottom: cellContext.isLastInSection ? 0 : self.renderConfig.spacing.height / 2,
												trailing: self.renderConfig.edgeInset.right))
		 */
	}

	deleteItem = (item) => {
		this.context.executeAction(new ActionDelete(this.controller.context), item);
	}

	render() {
		this.controller = this.props.controller;

		return (
			<div className={"ListRendererView"}>
				<VStack>
					{this.controller.hasItems ?
						<ASTableView editMode={this.controller.context.currentSession?.editMode ?? false}
									 background={this.controller.config.backgroundColor?.color ?? new Color("systemBackground")}>
							{this.sections}
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

/*struct ListRendererView_Previews: PreviewProvider {
	static var previews: some View {
		ListRendererView().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
