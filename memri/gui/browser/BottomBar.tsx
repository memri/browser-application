//
// ContextualBottomBar.swift
// Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {
    font,
    HStack,
    MainUI,
    MemriDivider,
    MemriImage,
    MemriRealButton,
    MemriText,
    padding,
    Spacer,
    VStack
} from "../swiftUI";
import {Color, Font} from "../../../router";
import {ActionButton} from "../ActionView";

export class BottomBarView extends MainUI {
    onSearchPressed() {}

    render() {
        this.context = this.props.context
        this.onSearchPressed = this.props.onSearchPressed
        return (
            <div className={"BottomBarView"}>
                <VStack spacing={0}>
                    <MemriDivider/>
                    <HStack spacing={0}
                            padding={padding({horizontal: 10})}
                            font={font({family: "system", size: 20, weight: Font.Weight.medium})}
                            background={new Color("secondarySystemBackground").toLowerCase()} /*TODO edgesIgnoringSafeArea(.bottom)*/
                    >
                        <MemriRealButton action={this.onSearchPressed}>
                            <MemriImage
                                padding={10}
                                // contentShape={Rectangle()}
                            >search</MemriImage>
                        </MemriRealButton>
                        <Spacer/>
                        {(this.context.currentView?.filterButtons ?? []).map(filterButton =>
                            <ActionButton key={filterButton.transientUID} action={filterButton} context={this.context}/>)}
                    </HStack>
                </VStack>
            </div>
        )
    }
}
