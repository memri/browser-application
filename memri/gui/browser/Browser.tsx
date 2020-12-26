//
//  Browser.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {Alignment, Color} from "../../../router";
import {Capsule, ColorArea, frame, MainUI, MemriText, offset, padding, VStack, ZStack} from "../swiftUI";
import {TopNavigation} from "./TopNavigation";
import {FilterPanel} from "./configPane/FilterPanel";
import {ContextPane} from "./contextPane/ContextPane";
import {CascadableView} from "../../../router";
import {ContextualBottomBar} from "./ContextualBottomBar";
import {BottomBarView} from "./BottomBar";
import { SearchView } from './SearchView';
import {geom} from "../../../geom";

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

	get activeRendererController(): RendererController {
		return this.context.currentRendererController
	}

	isSearchActive = false

	get showFilterPanel(): boolean {
		return this.context.currentSession?.showFilterPanel ?? false
	}

	set showFilterPanel(newValue) {
		this.context.currentSession && (this.context.currentSession.showFilterPanel = newValue)
		this.context.scheduleUIUpdate(true)
	}

	filterPanelGestureOffset = 0

	render() {
		this.init() //fullHeight layoutPriority={1}

		let currentView = this.context.currentView ?? new CascadableView()
		this.currentView = currentView

		return (
			<div className={"Browser"} style={this.setStyles()}>
			<ZStack height={"100%"}>
				{this.context.currentView == undefined ? <MemriText padding={padding({})} frame={frame({maxWidth: "infinity"})}>{"Loading..."}</MemriText> :
					<>
						<VStack alignment={Alignment.center} spacing={0} height={"100%"}>
							{currentView.showToolbar
								&& !currentView.fullscreen
								&& <TopNavigation background={new Color("systemBackground").toLowerCase()}
												  context={this.context}
												  inSubView={this.inSubView}
												  showCloseButton={this.showclosebutton}/>
							}
							<ZStack height="100%">
								<VStack alignment={Alignment.center} spacing={0} height={"100%"} justifyContent={"space-between"}>
									{this.activeRendererController != undefined
										? this.activeRendererController.makeView()
										: <MemriText padding={padding({})} frame={frame({maxWidth: "infinity", maxHeight: "infinity"})}>
											{"No active renderer"}
										</MemriText>
									}

									{this.currentView.showBottomBar && <>
										<ContextualBottomBar context={this.context}/>

										{!currentView.fullscreen &&
										<BottomBarView onSearchPressed={() => {
											this.isSearchActive = true;
											this.context.scheduleCascadableViewUpdate();
										}} context={this.context} zIndex={8}/>
										}
									</>}
								</VStack>

								{this.showFilterPanel && this.currentView.showBottomBar &&
									<ColorArea color={"black"}
											   opacity={0.15}
											   onClick={() => {this.showFilterPanel = false; }}
									/>
								}
							</ZStack>
						</VStack>

						<SearchView context={this.context} isActive={this.isSearchActive}/>

						{this.showFilterPanel &&
							<VStack offset={offset({y: this.filterPanelGestureOffset})}
									zIndex={9} alignSelf={"flex-end"}
									// transition={move("bottom")}
							>
								<Capsule fill={new Color("secondarySystemBackground").toLowerCase()}
										 frame={frame({width: 40, height: 5, maxWidth: "infinity"/*, height: 15*/})} alignSelf={"center"}
								/>
								<FilterPanel context={this.context}/>
							</VStack>
						}
						{currentView.contextPane.isSet() &&
							<ContextPane context={this.context}
										 zIndex={15}/>
						}
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
