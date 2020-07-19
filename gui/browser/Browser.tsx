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
import {allRenderers} from "../../cvu/views/Renderers";
import {Search} from "./Search";
import {FilterPanel} from "./FilterPanel";
import {ContextPane} from "../contextpane/ContextPane";

interface BrowserProps { context?: MemriContext; allRenderers?}
export class Browser extends React.Component<BrowserProps, {}> {
	context: MemriContext

	init() {
		this.context = this.props.context;
	}

	get activeRenderer() {
		return allRenderers?.allViews[this.context.cascadingView?.activeRenderer ?? ""] ?? Hello//Spacer
	}

	render() {
		this.init()
		return (
			<ZStack>
				<VStack alignment={Alignment.center} spacing={0}>
					<TopNavigation background={new Color("systemBackground").toLowerCase()} context={this.context}/>
					<this.activeRenderer fullHeight layoutPriority={1} text={"Browser"}/>
					<Search context={this.context}/>
					{this.context.currentSession?.showFilterPanel && <FilterPanel context={this.context}/>}
				</VStack>
				<ContextPane context={this.context}/>
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
