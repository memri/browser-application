//
//  RendererSelectionPanel.swift
//  memri
//
//  Created by Toby Brennan on 28/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {
    font,
    frame,
    HStack,
    MainUI, MemriImage, MemriRealButton, MemriText, Spacer,
} from "../../swiftUI";
import {SelectorType} from "../../../../router";
import {ListItem} from "@material-ui/core";
import {Renderers} from "../../../../router";
import {Font} from "../../../../router";


export class RendererSelectionPanel extends MainUI {

    render() {
        this.context = this.props.context

        return (
            <div className={"RendererSelectionPanel"} style={{width: "50%"}}>
                {this.getSupported().map((rendererName) => {
                    let rendererType = Renderers.rendererTypes[rendererName];
                    if (rendererType) {
                        return (

                                <MemriRealButton action={() => this.activateRenderer(rendererType.name)}>
                                    <HStack>
                                        <MemriImage frame={frame({width: 30})}>
                                            {rendererType.icon}
                                        </MemriImage>
                                        <MemriText
                                            font={font(this.isActive(rendererType.name) ? {family: "body", weight: Font.Weight.bold} : {family: "body", weight: Font.Weight.regular})}>
                                            {rendererType.name.titleCase()}
                                        </MemriText>
                                        <Spacer/>
                                    </HStack>
                                </MemriRealButton>
                            )
                    }
                })}
            </div>
        )
    }

    activateRenderer(name: String) {
        if (this.context.currentView?.activeRenderer == name) {//TODO @anijanyan
            return
        }
        if (this.props.context.resetNavigationProps) {//TODO @anijanyan
            this.props.context.resetNavigationProps()
        }

        if (this.context.currentView) {
            this.context.currentView.activeRenderer = name
        }
        this.context.scheduleCascadableViewUpdate()
    }

    isActive(renderer: string) {
        if (this.context.currentView)
           return this.context.currentView.activeRenderer == renderer
    }

    getSupported() {
        let renderDefinitions: CVUParsedDefinition[] = this.context.currentView?.cascadeList("rendererDefinitions", SelectorType.list) ?? []
        return renderDefinitions.map(($0) => $0.name).filter(($0) => $0 != undefined && $0 != "generalEditor")
    }

	// getRendererCategories() {
    //     return Object.entries(allRenderers.tuples)
    //         .map ((item) => [
    //             item[0],
    //             item[1](this.context),
    //         ])
    //         .filter ((item) =>
    //             !item[0].includes(".") && item[1].canDisplayResults(this.context.items)
    //         )
    //         .sort((item1, item2) => item1[1].order - item2[1].order)
	// }
    //
    // get currentRendererCategory() {
    //     return this.context.currentView?.activeRenderer.split(".")[0]//TODO .map(String.init)
    // }
    //
    // getRenderersAvailable(category) {
    //     if (!category) { return [] }
    //     return Object.entries(allRenderers.all)
    //         .map ((arg0) => {//TODO
    //             let [key, value] = arg0
    //             return [key, value(this.context)]
    //         })
    //         .filter ( (renderer) =>
    //             renderer[1].rendererName.split(".")[0] == category
    //         )
    //         .sort((item1, item2) => item1[1].order - item2[1].order )
    // }
    //
    // isActive(renderer: FilterPanelRendererButton) {
    //     return this.context.currentView?.activeRenderer.split(".")[0] ?? "" == renderer.rendererName
    // }
}
