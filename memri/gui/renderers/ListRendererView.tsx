//
//  ListRendererView.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {allRenderers, CascadingListConfig} from "../../cvu/views/Renderers";
import {Alignment, Color, Font} from "../../parsers/cvu-parser/CVUParser";
import {ActionDelete, ActionOpenView} from "../../cvu/views/Action";
import {ASTableView, font, HStack, MainUI, MemriText, padding, RenderersMemri, Spacer, VStack} from "../swiftUI";
import {ListItem} from "@material-ui/core";

export var registerListRenderer = function () {
	if (allRenderers) {
		allRenderers.register(
			"list",
			"Default",
			0,
			"dehaze",
			new ListRendererView(),
			CascadingListConfig,
			function(items){return true})
		allRenderers.register(
			"list.alphabet",
			"Alphabet",
			10,
			undefined,
			new ListRendererView(),
			CascadingListConfig,
			function(items){return true}
		)
	}
}

//CascadingListConfig moved to Renderers.ts

export class ListRendererView extends RenderersMemri {
	constructor(props) {
		super(props);

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

	name = "list"

	get renderConfig() {
		return this.context.currentView?.renderConfig ?? new CascadingListConfig()
	}

	get sections() { //contextMenuProvider: contextMenuProvider
		let items = this.context.items;
		return items.map((dataItem) => {
			return <ListItem key={dataItem.uid} onClick={
				this.executeAction(dataItem)
			}>
				{this.renderConfig.render(dataItem)}
			</ListItem>
		})
		/*
		.padding(EdgeInsets(top: cellContext.isFirstInSection ? 0 : self.renderConfig.spacing.height / 2,
												leading: self.renderConfig.edgeInset.left,
												bottom: cellContext.isLastInSection ? 0 : self.renderConfig.spacing.height / 2,
												trailing: self.renderConfig.edgeInset.right))
		 */
	}

	render() {
		this.context = this.props?.context;
		let context = this.context;
		let innerContent;
		let onSwipeToDelete = function (item) {
			context.executeAction(new ActionDelete(context), item)
			return true
		}

		if (context.currentView?.resultSet.count == 0) {
			innerContent = (
				<HStack alignment={Alignment.top} padding={padding({"all": 30, "top": 40})}>
					<Spacer/>
					<MemriText multilineTextAlignment={Alignment.center}
						  font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
						  opacity={0.7}>
						{context.currentView?.emptyResultText ?? ""}
					</MemriText>
					<Spacer/>
				</HStack>
				);
		} else {//TODO:actions
			innerContent = (
				<ASTableView editMode={context.currentSession?.editMode ?? false} background={this.renderConfig.backgroundColor?.color ?? new Color("systemBackground")}>
					{this.sections}
				</ASTableView>
			);
		}


		return (
			<div className={"ListRendererView"}>
				<VStack>
					{innerContent}
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
