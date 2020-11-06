//
//  CVU_TimelineItem.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI, MemriImage} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";
import {ItemFamily} from "../../model/schemaExtensions/Item";

export class CVU_TimelineItem extends MainUI {
    nodeResolver: UINodeResolver

    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (<TimelineItemView icon={<MemriImage>{this.nodeResolver.string("icon") ?? "arrow_right"}</MemriImage>}
                                  title={this.nodeResolver.string("title") ?? "-"}
                                  subtitle={this.nodeResolver.string("text")}
                                  backgroundColor={ItemFamily[this.nodeResolver.item.genericType].backgroundColor ?? "gray"}

            />
        );
    }
}
