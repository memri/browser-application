//
//  CVU_Shape.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//



import {Circle, CVU_UI, MainUI, RoundedRectangle} from "../../swiftUI";
import * as React from "react";
import {Color} from "../valueTypes/CVUColor";

export class CVU_ShapeCircle extends CVU_UI {
    render() {
        this.nodeResolver = this.props.nodeResolver;
        return (
            <Circle fill={this.nodeResolver.color() ?? new Color("clear").toLowerCase()} {...this.props}/>
        )
    }
}

export class CVU_ShapeRectangle extends CVU_UI {
    render() {
        this.nodeResolver = this.props.nodeResolver;
        return (
            <RoundedRectangle cornerRadius={this.nodeResolver.cornerRadius} fill={this.nodeResolver.color() ?? new Color("clear").toLowerCase()} {...this.props}/>
        )
    }
}
