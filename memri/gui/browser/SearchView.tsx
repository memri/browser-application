//
//  Search.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {Color} from "../../cvu/parsers/cvu-parser/CVUParser";
import {font, HStack, MainUI, MemriDivider, MemriText, MemriTextField, padding, VStack} from "../swiftUI";
import {ActionButton} from "../ActionView";

export class SearchView extends MainUI{
	isActive//TODO

	init() {
		this.context = this.props.context;
		this.isActive = this.props.isActive
	}

	render() {
		this.init()
		return (
			<div className="SearchView">
			{this.isActive && <VStack spacing={0}
					 background={new Color("white").toLowerCase()}/*TODO .edgesIgnoringSafeArea(.all)*/
				// modifier={new KeyboardModifier(null)}
					 transition={"opacity"}
			>
				<MemriDivider/>
				<HStack padding={padding({horizontal: 15, vertical: 6})}>
					<MemriTextField value={this.context.currentView?.filterText ?? ""}
									placeholder={this.context.currentView?.searchHint ?? ""}
									showPrevNextButtons={false}
									layoutPriority={-1}
									onChange={(e) => this.context.currentView.filterText = e.target.value}
									/*TODO isEditing*/
					>
					</MemriTextField>
				</HStack>
			</VStack>}
			</div>
		);
	}
}