//
//  CVU_MemriButton.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";
import {MemriButton} from "../common/MemriButton";

export class CVU_MemriButton extends MainUI {
    nodeResolver: UINodeResolver
    
    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
            <MemriButton item={this.nodeResolver.resolve("item")}
                         edge={this.nodeResolver.resolve("edge")}
            />
        )
    }
}
