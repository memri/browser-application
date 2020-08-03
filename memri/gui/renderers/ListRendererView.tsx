//
//  ListRendererView.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {allRenderers, CascadingListConfig} from "../../cvu/views/Renderers";
import {Alignment, Font} from "../../parsers/cvu-parser/CVUParser";
import {ActionDelete} from "../../cvu/views/Action";
import {ASTableView, font, HStack, MainUI, MemriText, padding, Spacer, VStack} from "../swiftUI";
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

export class ListRendererView extends MainUI {
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

	getItems() {
		let items = this.context.items;
		return items.map((dataItem) => {
			return <ListItem key={dataItem.uid}>
				{this.renderConfig.render(dataItem)}
			</ListItem>
		})
		/*<ASSection id={0} data={context.items} dataID={this.uid.value} selectedItems={this.selectedIndices} onSwipeToDelete={onSwipeToDelete} alwaysBounce >

		</ASSection>*/
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
				<ASTableView editMode={context.currentSession?.editMode ?? false} onSelectSingle={}>
					{this.getItems()}
				</ASTableView>
			);
		}


		return (
			<VStack>
				{innerContent}
			</VStack>
		)
	}
}

/*struct ListRendererView_Previews: PreviewProvider {
	static var previews: some View {
		ListRendererView().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
