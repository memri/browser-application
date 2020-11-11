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

    get currentFilter(): string {
        return this.context.currentView?.filterText?.nilIfBlankOrSingleLine
    }

    render() {
        this.context = this.props.context
        this.onSearchPressed = this.props.onSearchPressed
        let filter = this.currentFilter
        return (
            <div className={"BottomBarView"}>
                <VStack spacing={0}>
                    <MemriDivider/>
                    <HStack spacing={4}>
                        <HStack spacing={4}
                                padding={padding({horizontal: 10})}
                                font={font({family: "system", size: 20, weight: Font.Weight.medium})}
                                background={new Color("secondarySystemBackground").toLowerCase()} /*TODO edgesIgnoringSafeArea(.bottom)*/
                        >
                            <MemriRealButton action={this.onSearchPressed}>
                                <HStack spacing={0}
                                        padding={padding({leading: 10, vertical: 10})}
                                        contentShape={"Rectangle"}
                                >

                                </HStack>
                                <MemriImage padding={padding({trailing: 7})}>
                                    search
                                </MemriImage>
                                {filter && <MemriText font={font({family: "caption"})}
                                                      foregroundColor={new Color("label").toLowerCase()}
                                >
                                    {filter}
                                </MemriText>}
                            </MemriRealButton>
                            {(filter != undefined) && <MemriRealButton action={() =>
                                this.context.currentView && (this.context.currentView.filterText = "")
                            }>
                                <MemriImage foregroundColor={new Color("label").toLowerCase()}
                                            font={font({family: "caption"})}
                                >
                                    clear
                                </MemriImage>
                            </MemriRealButton>}
                        </HStack>
                        <Spacer/>
                        {(this.context.currentView?.filterButtons ?? []).map(filterButton =>
                            <ActionButton key={filterButton.transientUID} action={filterButton} context={this.context}/>)}
                    </HStack>
                </VStack>
            </div>
        )
    }
}
