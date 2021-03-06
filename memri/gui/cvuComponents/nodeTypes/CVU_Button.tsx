//
//  CVU_MemriButton.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVU_UI, MainUI, MemriRealButton} from "../../swiftUI";
import * as React from "react";

export class CVU_Button extends CVU_UI {
    render() {
        this.context = this.props.context;
        this.nodeResolver = this.props.nodeResolver;
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
            buttonStyle={"Style"} {...this.props}
        >
            {this.nodeResolver.childrenInForEach(this.context)}
        </MemriRealButton>
    }
}

/*
class Style/!*: ButtonStyle*!/ {
    makeBody(configuration: Configuration) {
        return <configuration label shadow={shadow({radius: configuration.isPressed ? 4 : 0})}/>
    }
}*/
