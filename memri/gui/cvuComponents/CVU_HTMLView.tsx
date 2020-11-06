//
//  CVU_HTMLView.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {MainUI} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";

export class CVU_HTMLView extends MainUI {
    nodeResolver: UINodeResolver
    
    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
            <EmailView emailHTML={this.nodeResolver.string("content")}/>
        )
    }
}
