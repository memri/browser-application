//
//  CVU_Shape.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//



import {Circle, MainUI, RoundedRectangle} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";
import {Color} from "../../cvu/newWIP/CVUColor";

export class CVU_ShapeCircle extends MainUI {
    nodeResolver: UINodeResolver
    render() {
        return (
            <Circle fill={this.nodeResolver.color()?.color ?? new Color("clear").toLowerCase()}/>
        )
    }
}

export class CVU_ShapeRectangle extends MainUI {
    nodeResolver: UINodeResolver
    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
            <RoundedRectangle cornerRadius={this.nodeResolver.cornerRadius} fill={this.nodeResolver.color()?.color ?? new Color("clear").toLowerCase()}/>
        )
    }
}
