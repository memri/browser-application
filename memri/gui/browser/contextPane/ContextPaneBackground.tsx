//
//  BackgroundPane.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {ColorArea, MainUI} from "../../swiftUI";

export class ContextPaneBackground extends MainUI {
	render() {
		return (<div className="ContextPaneBackground"><ColorArea color="gray"></ColorArea></div>)
	}
}

/*struct BackgroundPane_Previews: PreviewProvider {
	static var previews: some View {
		ContextPaneBackground()
	}
}*/
