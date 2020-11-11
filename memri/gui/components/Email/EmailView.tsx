//
//  EmailView.swift
//  memri
//
//  Created by Toby Brennan on 30/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI} from "../../swiftUI";
import * as React from "react";

export class EmailView extends MainUI {
    emailHTML: string

    render() {
        this.emailHTML = this.props.emailHTML;
        return (
            <div dangerouslySetInnerHTML={{__html: this.emailHTML}} />)
    }
}
