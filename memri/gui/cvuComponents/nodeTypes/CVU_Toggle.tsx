//
//  CVU_Text.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVU_UI, EmptyView, MainUI, Toggle} from "../../swiftUI";
import * as React from "react";

export class CVU_Toggle extends CVU_UI {
    get binding() {
        return this.nodeResolver.binding("value", false)
    }

    render() {
        this.nodeResolver = this.props.nodeResolver;
        return (
            <Toggle isOn={this.binding} labelsHidden {...this.props}>
                <EmptyView/>
            </Toggle>
        )
    }
}
