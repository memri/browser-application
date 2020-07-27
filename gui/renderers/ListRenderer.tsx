//
//  ListRenderer.swift
//  memri
//
//  Created by Koen van der Veen on 10/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//


import {ActionFamily} from "../../cvu/views/Action";
import {DataItem} from "../../model/DataItem";
import * as React from "react";
import {font, frame, MainUI, MemriList, MemriText, NavigationView, VStack, ZStack} from "../swiftUI";
import {Alignment} from "../../parsers/cvu-parser/CVUParser";

class ListConfig/* extends RenderConfig*/ {
	cascadeOrder = []
	slideLeftActions: ActionDescription[] = []
	slideRightActions: ActionDescription[] = []
	press?: ActionDescription
	type: string = "list"
	browse: string = ""
	sortProperty: string = ""
	sortAscending: number = 0
	itemRenderer: string = ""
	longPress?: ActionDescription

	constructor(name?: string, icon?: string, category?: string, items?: ActionDescription[], options1?: [ActionDescription],
		 options2?: ActionDescription[], cascadeOrder?: string[], slideLeftActions?: ActionDescription[],
		 slideRightActions?: ActionDescription[], type?: string, browse?: string, sortProperty?: string,
		 sortAscending?: number, itemRenderer?: string, longPress?: ActionDescription, press?: ActionDescription) {
		// super.init()
		this.cascadeOrder = cascadeOrder ?? this.cascadeOrder
		this.slideLeftActions = slideLeftActions ?? this.slideLeftActions
		this.slideRightActions = slideRightActions ?? this.slideRightActions
		this.type = type ?? this.type
		this.browse = browse ?? this.browse
		this.sortProperty = sortProperty ?? this.sortProperty
		this.sortAscending = sortAscending ?? this.sortAscending
		this.itemRenderer = itemRenderer ?? this.itemRenderer
		this.longPress = longPress ?? this.longPress
		this.press = press ?? this.press
	}

	/*required init(from _: Decoder) throws {
		fatalError("init(from:) has not been implemented")
	}

	required init() {
		super.init()
	}*/
}

export class ListRenderer extends MainUI {
	main: Main

	name: string = "list"
	icon: string = ""
	category: string = ""
	renderModes: ActionDescription[] = []
	options1: ActionDescription[] = []
	options2: ActionDescription[] = []
	editMode: boolean = false
	isEditMode: EditMode
	abc: boolean = false

	//    renderConfig: RenderConfig = RenderConfig()
	renderConfig: RenderConfig = new ListConfig(/*press:*/
		new ActionDescription(undefined, undefined, ActionFamily.openView, []))

	deleteAction = new ActionDescription("", "", ActionFamily.delete, [], ".none")

	// setState(_: RenderState) -> boolean { false }

	getState()  { return new RenderState() }
	// setCurrentView(_: Session, _: (_ error: Error, _ success: boolean) -> Void) {}

	generatePreview(item: DataItem): string {
		let content = item.getString("content")
		return content
	}

	render() {
		return (
			<VStack>
				<NavigationView>
					<MemriList navigationBarTitle="" navigationBarHidden={true}>
						{main.computedView.resultSet.items.map((dataItem) =>
							<VStack>
								<MemriText frame={frame({maxWidth: "infinity", alignment: Alignment.leading})}
										   font={font({weight: "bold"})}
								>
									{dataItem.getString("title")}
								</MemriText>
								<MemriText frame={frame({maxWidth: "infinity", alignment: Alignment.leading})}>
									{this.generatePreview(dataItem)}
								</MemriText>
							</VStack>
						)}
					</MemriList>
				</NavigationView>
			</VStack>
		);
	}

	onTap(actionDescription: ActionDescription, dataItem: DataItem) {
		this.main.executeAction(actionDescription, dataItem)
	}
}

/*struct ListRenderer_Previews: PreviewProvider {
	static var previews: some View {
		ListRenderer(isEditMode: .constant(.inactive)).environmentObject(Main(name: "", key: "").mockBoot())
	}
}*/

class RenderState {}

export interface Renderer extends React.Component {
	// var name: string { get set }
	// var icon: string { get set }
	// var category: string { get set }
	//
	// var renderModes: [ActionDescription] { get set }
	// var options1: [ActionDescription] { get set }
	// var options2: [ActionDescription] { get set }
	// var editMode: boolean { get set }
	// var renderConfig: RenderConfig { get set }
	//
	// func setState(_ state: RenderState) -> boolean
	// func getState() -> RenderState
	// func setCurrentView(_ session: Session, _ callback: (_ error: Error, _ success: boolean) -> Void)
}
