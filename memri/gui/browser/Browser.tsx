//
//  Browser.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {Alignment, Color} from "../../cvu/parsers/cvu-parser/CVUParser";
import {MemriContext} from "../../context/MemriContext";
import {Capsule, ColorArea, frame, MainUI, MemriText, offset, padding, VStack, ZStack} from "../swiftUI";
import {TopNavigation} from "./TopNavigation";
import {FilterPanel} from "./configPane/FilterPanel";
import {ContextPane} from "./contextPane/ContextPane";
import {CascadableView} from "../../cvu/views/CascadableView";
import {ContextualBottomBar} from "./ContextualBottomBar";
import {BottomBarView} from "./BottomBar";
import { SearchView } from './SearchView';

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
		currentView.showToolbar = true
		currentView.fullscreen = false

		this.currentView = currentView

		return (
			<div className={"Browser"}>
			<ZStack>
				{this.context.currentView == undefined ? <MemriText padding={padding({})} frame={frame({maxWidth: "infinity"})}>{"Loading..."}</MemriText> :
					<>
						<VStack alignment={Alignment.center} spacing={0}>
							{currentView.showToolbar
								&& !currentView.fullscreen
								&& <TopNavigation background={new Color("systemBackground").toLowerCase()}
												  context={this.context}
												  inSubView={this.inSubView}
												  showCloseButton={this.showclosebutton}/>
							}
							<ZStack>
								<VStack alignment={Alignment.center} spacing={0}>
									{this.activeRendererController != undefined
										? this.activeRendererController.makeView()
										: <MemriText padding={padding({})} frame={frame({maxWidth: "infinity", maxHeight: "infinity"})}>
											{"No active renderer"}
										</MemriText>
									}

									<ContextualBottomBar context={this.context}/>

									{!currentView.fullscreen &&
										<BottomBarView onSearchPressed={() => {
											this.isSearchActive = true
										}} context={this.context} zIndex={8}/>
									}
								</VStack>

								{this.showFilterPanel &&
									<ColorArea color={"black"}
											   opacity={0.15}
											   click={() => {this.showFilterPanel = false}}
									/>
								}
							</ZStack>
						</VStack>

						<SearchView context={this.context} isActive={this.isSearchActive}/>

						{this.showFilterPanel &&
							<VStack offset={offset({y: this.filterPanelGestureOffset})}
									zIndex={9}
									// transition={move("bottom")}
							>
								<Capsule fill={new Color("secondarySystemBackground").toLowerCase()}
										 frame={frame({width: 40, height: 5, maxWidth: "infinity"/*, height: 15*/})}
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
