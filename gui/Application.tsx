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
		this.context.showNavigation = !this.context.showNavigation
		this.setState({isVisible: this.context.showNavigation});
	}

	render() {
		this.context = this.props.context;
		this.context.showNavigationBinding = this.showNavigationBinding;
		return (
			<div className="Application">
			<ScreenSizer background={new Color("systemBackground").toLowerCase()} colorScheme="light">
				<VStack spacing={0}>
					<NavigationWrapper isVisible={this.state.isVisible} context={this.context}>
						{(this.context.showSessionSwitcher) ? <SessionSwitcher/>: <Browser
							context={this.context}/>
						}
					</NavigationWrapper>
					<Spacer/>
				</VStack>
			</ScreenSizer>
			</div>
			);
	}
}



export class Hello extends React.Component {
	render() {
		return (
			"Hello " + (this.props.text ?? "World") + "!"
		)
	}
}

/*struct Application_Previews: PreviewProvider {
	static var previews: some View {
		let context = try! RootContext(name: "", key: "").mockBoot()
		return Application().environmentObject(context)
	}
}*/
