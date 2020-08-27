//
//  RendererSelectionPanel.swift
//  memri
//
//  Created by Toby Brennan on 28/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {
    ASTableView, font,
    frame,
    Group,
    HStack,
    MainUI,
    MemriImage,
    MemriRealButton,
    MemriText,
    padding,
    VStack
} from "../swiftUI";
import {Alignment, Color, Font} from "../../parsers/cvu-parser/CVUParser";
import {allRenderers} from "../../cvu/views/Renderers";

export class RendererSelectionPanel extends MainUI{
    render() {
        this.context = this.props.context
        return this.render1()
        // GeometryReader { self.body(in: $0) }
    }

    render1(geometry?: GeometryProxy) {
        let rowSize = 5
        // let rowSize = Number(geometry.size.width / 38) // Figure out how many can fit in a row //TODO


        let segmentedRendererCategories = []
        let rendererCategories = []
        let renderers = this.getRendererCategories()

        for (let i = 0; i < renderers.length; i++) {
            rendererCategories.push(renderers[i])
            if (rendererCategories.length == rowSize) {
                segmentedRendererCategories.push(rendererCategories)
                rendererCategories = []
            }
        }
        if (rendererCategories.length) segmentedRendererCategories.push(rendererCategories)
        // let segmentedRendererCategories = this.getRendererCategories().segments(ofSize: rowSize).indexed()
        //TODO segments function?

        return (
            <div className={"RendererSelectionPanel"}>
            <VStack alignment={Alignment.leading} spacing={0}>
                <VStack spacing={3}
                        frame={frame({maxWidth: ".infinity", alignment: Alignment.leading})}
                        padding={padding({leading: 12, top: 1})}
                        background={new Color("white").toLowerCase()}
                >
                    {segmentedRendererCategories.map((categories) =>
                        <HStack alignment={Alignment.top} spacing={3}>
                            {categories.map((renderer) =>
                                <MemriRealButton
                                    onClick={() => context.executeAction(renderer[1])} key={renderer[0]}>
                                    <MemriImage fixedSize=""
                                                padding={padding({horizontal: 5, vertical: 5})}
                                                frame={frame({width: 35, height: 40, alignment: Alignment.center})}
                                                foregroundColor={this.isActive(renderer[1])
                                                    ? renderer[1].getColor("activeColor").toLowerCase()
                                                    : renderer[1].getColor("inactiveColor").toLowerCase()}
                                                background={this.isActive(renderer[1])
                                                    ? renderer[1].getColor("activeBackgroundColor").toLowerCase()
                                                    : renderer[1].getColor("inactiveBackgroundColor").toLowerCase()}
                                    >
                                        {renderer[1].getString("icon")}
                                    </MemriImage>
                                </MemriRealButton>
                            )}
                        </HStack>
                    )}
                </VStack>

                <ASTableView>
                    {this.getRenderersAvailable(this.currentRendererCategory).map((item) =>
                        <MemriRealButton onClick={() => this.context.executeAction(item[1])}>
                            <Group padding={padding({horizontal: 6, vertical: 6})}>
                                {this.context.currentView?.activeRenderer == item[1].rendererName ?
                                    <MemriText foregroundColor={"#6aa84f"}
                                               font={font({size: 16, weight: Font.Weight.semibold})}
                                    >
                                        {item[1].getString("title")}
                                    </MemriText>
                                    :
                                    <MemriText foregroundColor={"#434343"}
                                               font={font({size: 16, weight: Font.Weight.regular})}
                                    >
                                        {item[1].getString("title")}
                                    </MemriText>
                                }
                            </Group>
                        </MemriRealButton>
                    )}
                </ASTableView>

            </VStack>
            </div>
        )
    }

	getRendererCategories() {
        return Object.entries(allRenderers.tuples)
            .map ((item) => [
                item[0],
                item[1](this.context),
            ])
            .filter ((item) =>
                !item[0].includes(".") && item[1].canDisplayResults(this.context.items)
            )
            .sort((item1, item2) => item1[1].order - item2[1].order)
	}

    get currentRendererCategory() {
        return this.context.currentView?.activeRenderer.split(".")[0]//TODO .map(String.init)
    }

    getRenderersAvailable(category) {
        if (!category) { return [] }
        return Object.entries(allRenderers.all)
            .map ((arg0) => {//TODO
                let [key, value] = arg0
                return [key, value(this.context)]
            })
            .filter ( (renderer) =>
                renderer[1].rendererName.split(".")[0] == category
            )
            .sort((item1, item2) => item1[1].order - item2[1].order )
    }

    isActive(renderer: FilterPanelRendererButton) {
        return this.context.currentView?.activeRenderer.split(".")[0] ?? "" == renderer.rendererName
    }
}
