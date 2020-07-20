//
//  ListRenderer.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import {allRenderers, Renderers} from "../../cvu/views/Renderers";
import * as React from "react";
import {Alignment, Font} from "../../parsers/cvu-parser/CVUParser";
import {ActionDelete} from "../../cvu/views/Action";
import {font, HStack, MainUI, MemriText, padding, Spacer} from "../swiftUI";

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

class CascadingListConfig/*: CascadingRenderConfig, CascadingRendererDefaults */{
	type = "list"

	get longPress() { return this.cascadeProperty("longPress") }
	get press() { return this.cascadeProperty("press") }

	get slideLeftActions() { return this.cascadeList("slideLeftActions") }
	get slideRightActions() { return this.cascadeList("slideRightActions") }

	setDefaultValues(element: UIElement) {
		if (element.properties["padding"] == undefined) {
			element.properties["padding"] = [10, 10, 10, 20]
		}
	}
}

class ListRendererView extends MainUI {
	constructor(props) {
		super(props);
		this.context = props?.context;
	}
	context: MemriContext
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
		return this.context.cascadingView?.renderConfig ?? new CascadingListConfig()
	}

	render() {
		let context = this.context;
		let innerContent;
		let onSwipeToDelete = function (item) {
			context.executeAction(new ActionDelete(context), item)
			return true
		}

		if (context.cascadingView?.resultSet.length == 0) {
			innerContent = (
				<HStack alignment={Alignment.top} padding={padding({"all": 30, "top": 40})}>
					<Spacer/>
					<MemriText multilineTextAlignment={Alignment.center}
						  font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
						  opacity={0.7}>
						{context.cascadingView?.emptyResultText ?? ""}
					</MemriText>
					<Spacer/>
				</HStack>
				);
		} else {//TODO:actions
			innerContent = (
				<ASTableView editMode={context.currentSession?.isEditMode ?? false} onSelectSingle={}>
					<ASSection id={0} data={context.items} dataID={this.uid.value} selectedItems={this.selectedIndices} onSwipeToDelete={onSwipeToDelete} alwaysBounce >

					</ASSection>
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
