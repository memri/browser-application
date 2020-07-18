//
//  ContentView.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {Alignment, Color} from "../../parsers/cvu-parser/CVUParser";
import {MemriContext} from "../../context/MemriContext";
import {VStack, ZStack} from "../swiftUI";
import {TopNavigation} from "./TopNavigation";
import {Hello} from "../Application";

interface BrowserProps { context?: MemriContext; allRenderers?}
export class Browser extends React.Component<BrowserProps, {}> {
	context: MemriContext

	init() {
		this.context = this.props.context;
	}

	get activeRenderer() {
		return this.props.allRenderers?.allViews[this.context.cascadingView?.activeRenderer ?? ""] ?? Hello//Spacer
	}

	render() {
		this.init()
		return (
			<ZStack>
				<VStack alignment={Alignment.center} spacing={0}>
					{/*<TopNavigation background={new Color("systemBackground").toLowerCase()}/>*/}
					<this.activeRenderer fullHeight layoutPriority={1} text={"Browser"}/>
					{/*<Search/>*/}
					{/*{this.context.currentSession?.showFilterPanel && <FilterPanel/>}*/}
				</VStack>
				{/*<ContextPane/>*/}
			</ZStack>
		);
	}
}
/*
struct Browser_Previews: PreviewProvider {
	static var previews: some View {
		Browser().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
