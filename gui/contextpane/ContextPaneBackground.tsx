//
//  BackgroundPane.swift
//  memri
//
//  Created by Jess Taylor on 3/21/20.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from "react";
import {MemriContext} from "../../context/MemriContext";
import {ColorArea} from "../swiftUI";

export class ContextPaneBackground extends React.Component {
	context: MemriContext

	render() {
		return (<ColorArea color={"gray"}></ColorArea>)
	}
}

/*struct BackgroundPane_Previews: PreviewProvider {
	static var previews: some View {
		ContextPaneBackground()
	}
}*/
