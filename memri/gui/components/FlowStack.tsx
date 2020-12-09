//
// FlowStack.swift
// Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {frame, HStack, MainUI, VStack, ZStack} from "../swiftUI";
import {CGSize} from "../cvuComponents/UINodeResolver";

export class FlowStack extends MainUI {
    init() {
        this.data = this.props.data
        this.spacing = this.props.spacing
        this.alignment = this.props.alignment
        this.content = this.props.content
    }
    
    
    data
    spacing
    alignment
    content
    
    availableWidth = 0

    render() {
        this.init()
        return (
            <div className={"FlowStack"}>
            <ZStack /*alignment={alignment({horizontal: alignment, vertical: .center})}*/>
                <InnerView
                    availableWidth={this.availableWidth}
                    data={this.data}
                    spacing={this.spacing}
                    alignment={this.alignment}
                    content={this.content}
                />

            </ZStack>
            </div>
        )
        /*ZStack(alignment: Alignment(horizontal: alignment, vertical: .center)) {
            Color.clear
                .frame(height: 1)
                .readSize { size in
                    availableWidth = size.width
                }
            
            InnerView(
                availableWidth: availableWidth,
                data: data,
                spacing: spacing,
                alignment: alignment,
                content: content
            )
        }*/
    }
}

// This implementation is by Frederico @ https://fivestars.blog/swiftui/flexible-swiftui.html
export class InnerView extends MainUI {
    availableWidth
    data
    spacing
    alignment
    content
    elementsSize = {}

    render() {
        this.availableWidth = this.props.availableWidth
        this.data = this.props.data
        this.spacing = this.props.spacing
        this.alignment = this.props.alignment
        this.content = this.props.content
        return (
            <VStack alignment={this.alignment} spacing={this.spacing.y} frame={frame({maxWidth: this.availableWidth})}>
                {this.computeRows().map((rowElements) => <HStack spacing={this.spacing.x}>
                    {rowElements.map((element) => this.content(element))}
                {/*    .fixedSize()*/}
                {/*    .readSize { size in*/}
                {/*elementsSize[element] = size*/}
                {/*}*/}
                </HStack>)}

            </VStack>
        )
    }

    computeRows() {
        var rows = []
        var currentRow = 0
        var remainingWidth = this.availableWidth

        for (let element of this.data) {
            let elementSize = this.elementsSize[element.uid] ?? new CGSize(this.availableWidth, 1)

            if (remainingWidth - (elementSize.width + this.spacing.x) >= 0) {
                rows[currentRow].push(element)
            } else {
                currentRow = currentRow + 1
                rows.push([element])
                remainingWidth = this.availableWidth
            }

            remainingWidth = remainingWidth - (elementSize.width + this.spacing.x)
        }

        return rows
    }
}