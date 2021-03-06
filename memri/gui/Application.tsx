//
//  ContentView.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {CacheMemri, Color, Datasource, getItem} from "../../router";
import {ScreenSizer} from "../extensions/SwiftUI/ScreenSize";
import {NavigationWrapper} from "./browser/navigationPane/NavigationView";
import {MainUI, VStack} from "./swiftUI";
import {Browser} from "./browser/Browser";
import {SessionSwitcher} from "./browser/SessionSwitcher";
import {geom} from "../../geom";
import {RecoveryWizard} from "../install/RecoveryWizard";
import {SetupScreen} from "../install/SetupScreen";

export var memri_shouldUseLargeScreenLayout = typeof window != "undefined" ? window.outerWidth > 414 + 300 : false;

export class Application extends MainUI {
	constructor(props) {
		super(props);
		this.state = {isVisible: this.props.context.showNavigation};
		this.updateSize();
	}

	showNavigationBinding = () => {
		this.setState({isVisible: this.context.showNavigation});
	}

	updateSize = () => {
		geom.size.height = window.innerHeight - 4;
		geom.size.width = window.innerWidth;
		memri_shouldUseLargeScreenLayout = window.innerWidth > 414 + 300;
		this.context && this.context.scheduleCascadableViewUpdate();
	}

	render() {
		this.context = this.props.context;
		this.context.showNavigationBinding = this.showNavigationBinding;

		window.onresize = this.updateSize

		window.updateCVU = () => {
			this.context.cache.podAPI.query(new Datasource("CVUStoredDefinition"), false, (error, items) => {
				if (error) {
					return
				}
				else if (items) {
					try {
						var changes = [];
						for (let i = 0; i < items.length; i++) {
							let item = items[i]
							let uid = item.uid;
							if (uid) {
								let cachedItem = getItem(item.genericType, uid)
								if (cachedItem) {
                                    if (item.version <= cachedItem.version) {
										continue
                                    }
                                }
								cachedItem = CacheMemri.addToCache(items[i])
								changes.push(cachedItem)
							}
						}

					}
					catch {
						return
					}
				}
				this.context.scheduleCascadableViewUpdate();
			})
		};

		return (
			<div className="Application">
			<ScreenSizer background={new Color("systemBackground").toLowerCase()} colorScheme="light">
				<VStack spacing={0} height={"100%"}>
					{(this.context.installer.isInstalled && !this.context.installer.debugMode)
						?
						<NavigationWrapper isVisible={this.state.isVisible} context={this.context}>
							{this.context.showSessionSwitcher
								? <SessionSwitcher context={this.context}/>
								: <Browser context={this.context} height={"100%"}/>
							}
						</NavigationWrapper>
						:
						this.context.installer.debugMode
							?
							<RecoveryWizard context={this.context}/>
							:
							<SetupScreen context={this.context}/>
					}
				</VStack>
			</ScreenSizer>
			</div>
			);
	}
}