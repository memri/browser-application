//
//  CVU_MemriButton.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVU_UI, MainUI} from "../../swiftUI";
import * as React from "react";
import {MemriButton} from "../../common/MemriButton";

export class CVU_MemriButton extends CVU_UI {
    render() {
        this.nodeResolver = this.props.nodeResolver;
        return (
            <MemriButton item={this.nodeResolver.resolve("item")}
                         edge={this.nodeResolver.resolve("edge")} {...this.props}
            />
        )
    }
}
