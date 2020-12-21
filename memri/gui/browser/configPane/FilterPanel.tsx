//
//  FilterPanel.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {Alignment, Color} from "../../../../router";
import {Corners, frame, HStack, MainUI, MemriDivider, shadow} from "../../swiftUI";

import {RendererSelectionPanel} from "./RendererSelectionPanel";
import {ConfigPanel} from "./ConfigPanel";

export class FilterPanel extends MainUI {

    render() {
        this.context = this.props.context
        return (
            <div className="FilterPanel">
                <HStack alignment={Alignment.top} spacing={0}
                        frame={frame({maxWidth: "infinity", height: 250})}
                        background={Color.named("systemBackground")} shadow={shadow({radius: 10})} cornerRadius={20} corners={[Corners.topLeft, Corners.topRight]}
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
