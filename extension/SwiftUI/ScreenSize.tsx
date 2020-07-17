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
interface ScreenSizerProps { background?: string; colorScheme?: string; content? }

export class ScreenSizer extends React.Component<ScreenSizerProps, {}> {
	content;

	constructor(props) {
		super(props);
		this.content = props?.content;
	}
	render() {
		return (
			<div className="ScreenSizer">
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
