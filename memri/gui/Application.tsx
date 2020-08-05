//
//  ContentView.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {Color} from "../parsers/cvu-parser/CVUParser";
import {ScreenSizer} from "../extension/SwiftUI/ScreenSize";
import {NavigationWrapper} from "./navigation/NavigationView";
import {MainUI, Spacer, VStack} from "./swiftUI";
import {Browser} from "./browser/Browser";

/*class View {
	fullHeight(): View {
		frame(0,
			.infinity,
			0, maxHeight: .infinity,
			Alignment.topLeading)
	}

	fullWidth():View {
		frame(0, .infinity, Alignment.topLeading)
	}
}*/

/*var memri_shouldUseLargeScreenLayout: Bool {
	#if targetEnvironment(macCatalyst)
		return true
	#else
		return UIDevice.current.userInterfaceIdiom == .pad
	#endif
}*/
interface ApplicationProps { context?: MemriContext; }

export class Application extends MainUI {
	constructor(props) {
		super(props);
		this.state = {isVisible: this.props.context.showNavigation};
	}

	showNavigationBinding = () => {
		this.setState({isVisible: this.context.showNavigation});
	}

	render() {//(this.context.showSessionSwitcher) ? <SessionSwitcher/>:
		this.context = this.props.context;
		this.context.showNavigationBinding = this.showNavigationBinding;
		return (
			<div className="Application">
			<ScreenSizer background={new Color("systemBackground").toLowerCase()} colorScheme="light">
				<VStack spacing={0}>
					{(this.context.installer.isInstalled && !this.context.installer.debugMode) ?
					<NavigationWrapper isVisible={this.state.isVisible} context={this.context}>
						{<Browser
							context={this.context}/>
						}
					</NavigationWrapper> :
					<SetupWizard/>
					}
				</VStack>
			</ScreenSizer>
			</div>
			);
	}
}


/*struct Application_Previews: PreviewProvider {
	static var previews: some View {
		let context = try! RootContext(name: "", key: "").mockBoot()
		return Application().environmentObject(context)
	}
}*/