//
//  Browser.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {Alignment, Color} from "../../cvu/parsers/cvu-parser/CVUParser";
import {MemriContext} from "../../context/MemriContext";
import {MainUI, Spacer, VStack, ZStack} from "../swiftUI";
import {TopNavigation} from "./TopNavigation";
import {allRenderers} from "../renderers/Renderers";
import {Search} from "./Search";
import {FilterPanel} from "./configPane/FilterPanel";
import {ContextPane} from "../contextpane/ContextPane";
import {CascadableView} from "../../cvu/views/CascadableView";
import {ContextualBottomBar} from "./ContextualBottomBar";

interface BrowserProps { context?: MemriContext; allRenderers?}
export class Browser extends MainUI {
	inSubView: boolean
	showCloseButton: boolean

	currentView

	init() {
		this.context = this.props.context;
		this.inSubView = this.props.inSubView ?? false;
		this.showCloseButton = this.props.showCloseButton ?? false;
	}

	get activeRenderer() {
		let activeRenderer = allRenderers?.allViews[this.context.currentView?.activeRenderer ?? ""] ?? new Spacer({})
		activeRenderer.props = activeRenderer.props ?? {}
		activeRenderer.props.context = this.context
		activeRenderer.props.background = this.currentView.fullscreen ? "black" : "clear"//TODO
		return activeRenderer
	}

	render() {
		this.init() //fullHeight layoutPriority={1}

		let currentView = this.context.currentView ?? new CascadableView()
		currentView.showToolbar = true
		currentView.fullscreen = false

		this.currentView = currentView

		return (
			<div className={"Browser"}>
			<ZStack>
				{this.context.currentView == undefined ? "Loading..." :
					<>
						<VStack alignment={Alignment.center} spacing={0}>
							{currentView.showToolbar
								&& !currentView.fullscreen
								&& <TopNavigation background={new Color("systemBackground").toLowerCase()}
												  context={this.context}
												  inSubView={this.inSubView}
												  showCloseButton={this.showclosebutton}/>
							}
							{this.activeRenderer.render()}

							<ContextualBottomBar context={this.context}/>

							{currentView.showSearchbar && !currentView.fullscreen &&
								<>
									<Search context={this.context}/>
									{this.context.currentSession?.showFilterPanel &&
										<FilterPanel context={this.context}/>}
								</>
							}
						</VStack>
						{currentView.contextPane ? <ContextPane context={this.context}/> : ""}
					</>
				}
			</ZStack>
			</div>
		);
	}
}
/*
struct Browser_Previews: PreviewProvider {
	static var previews: some View {
		Browser().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
