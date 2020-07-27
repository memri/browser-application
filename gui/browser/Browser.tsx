//
//  ContentView.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {Alignment, Color} from "../../parsers/cvu-parser/CVUParser";
import {MemriContext} from "../../context/MemriContext";
import {MainUI, Spacer, VStack, ZStack} from "../swiftUI";
import {TopNavigation} from "./TopNavigation";
import {allRenderers} from "../../cvu/views/Renderers";
import {Search} from "./Search";
import {FilterPanel} from "./FilterPanel";
import {ContextPane} from "../contextpane/ContextPane";
import {CascadableView} from "../../cvu/views/CascadableView";
import {ContextualBottomBar} from "./ContextualBottomBar";

interface BrowserProps { context?: MemriContext; allRenderers?}
export class Browser extends MainUI {
	context: MemriContext

	init() {
		this.context = this.props.context;
	}

	get activeRenderer() {
		return allRenderers?.allViews[this.context.currentView?.activeRenderer ?? ""] ?? new Spacer({})
	}

	render() {
		this.init() //fullHeight layoutPriority={1}

		let currentView = this.context.currentView ?? new CascadableView()
		currentView.showToolbar = true
		currentView.fullscreen = false

		return (
			<ZStack>
				{this.context.currentView == undefined ? "Loading..." :
					<>
						<VStack alignment={Alignment.center} spacing={0}>
							{currentView.showToolbar
								&& !currentView.fullscreen
								&& <TopNavigation background={new Color("systemBackground").toLowerCase()}
												  context={this.context}/>
							}
							{this.activeRenderer.props.context = this.context && this.activeRenderer.render()}
							{/*<this.activeRenderer context={this.context}/>*/}

							<ContextualBottomBar context={this.context}/>

							{currentView.showSearchbar && !currentView.fullscreen &&
								<>
									<Search context={this.context}/>
									{this.context.currentSession?.showFilterPanel ||
										<FilterPanel context={this.context}/>}
								</>
							}
						</VStack>
						{currentView.contextPane ? <ContextPane context={this.context}/> : ""}
					</>
				}
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
