//
//  CVU_MemriButton.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI, MemriRealButton} from "../swiftUI";
import * as React from "react";

export class CVU_Button extends MainUI {
    nodeResolver: UINodeResolver

    render() {
        return <MemriRealButton
            action={() => {
                let press = this.nodeResolver.resolve("press")
                if (press) {
                    this.context.executeAction(
                        press,
                        this.nodeResolver.item,
                        this.nodeResolver.viewArguments
                    )
                }
            }}
            buttonStyle={Style}
        >
            {this.nodeResolver.childrenInForEach}
        </MemriRealButton>
    }
}

class Style/*: ButtonStyle*/ {
    makeBody(configuration: Configuration) {
        return <configuration label shadow={shadow({radius: configuration.isPressed ? 4 : 0})}/>
    }
}
