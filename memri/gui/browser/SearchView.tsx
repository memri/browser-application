//
//  Search.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {Color} from "../../../router";
import {font, HStack, MainUI, MemriDivider, MemriImage, MemriText, MemriTextField, padding, VStack} from "../swiftUI";

export class SearchView extends MainUI{
	isActive//TODO

	init() {
		this.context = this.props.context;
		this.isActive = this.props.isActive
	}

	render() {
		this.init()
		return (
			<div className="SearchView" style={{position: "absolute", bottom: 0}}>
			{this.isActive && <VStack spacing={0}
					 background={new Color("systemBackground").toLowerCase()}/*TODO .edgesIgnoringSafeArea(.all)*/
				// modifier={new KeyboardModifier(null)}
					 transition={"opacity"}
			>
				<MemriDivider/>
				<HStack padding={padding({horizontal: 15, vertical: 6})}>
					<MemriImage foregroundColor={new Color("systemFill").toLowerCase()}>
						search
					</MemriImage>
					<MemriTextField value={this.context.currentView?.filterText ?? ""}
									placeholder={this.context.currentView?.searchHint ?? ""}
									clearButtonMode={"always"}
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