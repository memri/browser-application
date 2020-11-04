//
//  CVU_Text.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {EmptyView, MainUI, Toggle} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";

export class CVU_Toggle extends MainUI {
    nodeResolver: UINodeResolver
    
    get binding() {
        return this.nodeResolver.binding("value", false)
    }

    render() {
        return (
            <Toggle isOn={this.binding} labelsHidden>
                <EmptyView/>
            </Toggle>
        )
    }
}
