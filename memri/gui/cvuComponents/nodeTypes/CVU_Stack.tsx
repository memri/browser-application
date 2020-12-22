//
//  CVU_HStack.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVU_UI, frame, HStack, MainUI, VStack, ZStack} from "../../swiftUI";
import * as React from "react";

export class CVU_HStack extends CVU_UI {
    render() {
        return (
            <HStack alignment={this.nodeResolver.alignment()}
                    spacing={this.nodeResolver.spacing}
                    frame={this.nodeResolver.bool("fillWidth", false) && frame({
                        maxWidth: "infinity",
                        alignment: this.nodeResolver.alignment()
                    })} {...this.props}
            >
                {this.nodeResolver.childrenInForEach(this.props.context)}
            </HStack>
        )
    }
}

export class CVU_VStack extends CVU_UI {
    render() {
        return (
            <VStack alignment={this.nodeResolver.alignment()}
                    spacing={this.nodeResolver.spacing}
                    frame={this.nodeResolver.bool("fillHeight", false) && frame({
                        maxWidth: "infinity",
                        alignment: this.nodeResolver.alignment()
                    })} {...this.props}
            >
                {this.nodeResolver.childrenInForEach(this.props.context)}
            </VStack>
        )
    }
}

export class CVU_ZStack extends CVU_UI {
    render() {
        return (
            <ZStack alignment={this.nodeResolver.alignment()} {...this.props}>
                {this.nodeResolver.childrenInForEach(this.props.context)}
            </ZStack>
        )
    }
}