//
//  CVU_HStack.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {frame, HStack, MainUI, VStack, ZStack} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";

export class CVU_HStack extends MainUI {
    nodeResolver: UINodeResolver
    
    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
            <HStack alignment={this.nodeResolver.alignment().vertical}
                    spacing={this.nodeResolver.spacing.x}
                    frame={this.nodeResolver.bool("fillWidth", false) && frame({
                        maxWidth: "infinity",
                        alignment: this.nodeResolver.alignment()
                    })}
            >
                {this.nodeResolver.childrenInForEach()}
            </HStack>
        )
    }
}

export class CVU_VStack extends MainUI {
    nodeResolver: UINodeResolver

    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
            <VStack alignment={this.nodeResolver.alignment().horizontal}
                    spacing={this.nodeResolver.spacing.y}
                    frame={this.nodeResolver.bool("fillHeight", false) && frame({
                        maxWidth: "infinity",
                        alignment: this.nodeResolver.alignment()
                    })}
            >
                {this.nodeResolver.childrenInForEach()}
            </VStack>
        )
    }
}

export class CVU_ZStack extends MainUI {
    nodeResolver: UINodeResolver

    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
            <ZStack alignment={this.nodeResolver.alignment()}>
                {this.nodeResolver.childrenInForEach()}
            </ZStack>
        )
    }
}