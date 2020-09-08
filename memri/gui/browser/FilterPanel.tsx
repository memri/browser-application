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
