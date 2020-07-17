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
import {VStack} from "./swiftUI";

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

export class Application extends React.Component<ApplicationProps, {}> {
	constructor(props) {
		super(props);
	}

	render() {
		this.context = this.props.context;

		return (
			<ScreenSizer background={new Color("systemBackground").toLowerCase()} colorScheme="light">
				<VStack spacing={0}>
					<NavigationWrapper isVisible={this.context.showNavigationBinding}>
						{(this.context.showSessionSwitcher) ? <SessionSwitcher/>: <Browser/>}
					</NavigationWrapper>
					<Spacer/>
				</VStack>
			</ScreenSizer>
			);
	}
}



/*struct Application_Previews: PreviewProvider {
	static var previews: some View {
		let context = try! RootContext(name: "", key: "").mockBoot()
		return Application().environmentObject(context)
	}
}*/
