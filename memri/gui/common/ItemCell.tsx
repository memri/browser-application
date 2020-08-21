//
// ItemCell.swift
// Copyright © 2020 memri. All rights reserved.

import {MainUI} from "../swiftUI";
import * as React from "react";

export class ItemCell extends MainUI {
    context: MemriContext

    item
    rendererNames
    argumentsJs
    //    let viewOverride: String // TODO Refactor: implement viewoverride
    render() {
        this.context = this.props.context;
        this.item = this.props.item;
        this.rendererNames = this.props.rendererNames;
        this.argumentsJs = this.props.argumentsJs;
        return (
            <>
                {this.context.views.renderItemCell(this.item, this.rendererNames, undefined, this.argumentsJs)}
            </>
        )
    }
}
