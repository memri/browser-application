//
//  CVU_HTMLView.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {CVU_UI, MainUI} from "../swiftUI";
import * as React from "react";
import {EmailView} from "../components/Email/EmailView";

export class CVU_HTMLView extends CVU_UI {
    render() {
        return (
            <EmailView emailHTML={this.nodeResolver.string("content")} {...this.props}/>
        )
    }
}
