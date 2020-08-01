//
//  ScreenSize.swift
//  memri
//
//  Created by Toby Brennan on 21/6/20.
//  Copyright © 2020 memri. All rights reserved.
//

/*extension EnvironmentValues {
	struct ScreenSize: EnvironmentKey {
		static var defaultValue: CGSize? = nil
	}

	var screenSize: CGSize? {
		get { self[ScreenSize.self] }
		set { self[ScreenSize.self] = newValue }
	}
}*/

import * as React from 'react';
import {frame, MainUI} from "../../gui/swiftUI";
import {geom} from "../../../demo-react";
interface ScreenSizerProps { background?: string; colorScheme?: string; content? }

export class ScreenSizer extends MainUI {

	render() {
		let styles = {}
		Object.assign(styles, this.setStyles(), {width: geom.size.width, height: geom.size.height})
		return (
			<div className="ScreenSizer" style={styles}>
				{this.props.children}
			</div>
		)
	} //TODO:

	/*var body: some View {
		GeometryReader { geometry in
			self.content()
				.padding(geometry.safeAreaInsets)
				.environment(\.screenSize, geometry.size)
		}
		.edgesIgnoringSafeArea(.all)
	}*/
}
