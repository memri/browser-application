//
//  FilterPanel.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {Alignment} from "../../../../router";
import {
    frame,
    HStack,
    MainUI,
    MemriDivider
} from "../../swiftUI";

import {RendererSelectionPanel} from "./RendererSelectionPanel";
import {ConfigPanel} from "./ConfigPanel";

export class FilterPanel extends MainUI {
	/*var clipShape: some Shape {
	RoundedCornerRectangle(radius: 20, corners: [.topLeft, .topRight])
}*/ //TODO:

    render() {
        this.context = this.props.context
/*
.clipShape(clipShape)
                .background(clipShape.fill(Color(.systemBackground)).shadow(radius: 10).edgesIgnoringSafeArea([.bottom]))
 */
        return (
            <div className="FilterPanel" style={{position: "absolute", bottom: 0}}>
                <HStack alignment={Alignment.top} spacing={0}
                        frame={frame({maxWidth: ".infinity", height: 250})}
                        background={"#eee"}
                >
                    <RendererSelectionPanel context={this.context}/>
                    <MemriDivider/>
                    <ConfigPanel context={this.context}
                                 />
                </HStack>
            </div>
        );
    }
}

/*struct FilterPanel_Previews: PreviewProvider {
	static var previews: some View {
		FilterPanel().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
