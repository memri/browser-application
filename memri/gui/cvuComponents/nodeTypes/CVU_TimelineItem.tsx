//
//  CVU_TimelineItem.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVU_UI, MainUI, MemriImage} from "../../swiftUI";
import * as React from "react";
import {backgroundColor, ItemFamily} from "../../../model/schemaExtensions/Item";
import {TimelineItemView} from "../../renderers/TimelineRenderer/TimelineItemView";

export class CVU_TimelineItem extends CVU_UI {

    render() {
        return (<TimelineItemView icon={<MemriImage>{this.nodeResolver.string("icon") ?? "arrow_right"}</MemriImage>}
                                  title={this.nodeResolver.string("title") ?? "-"}
                                  subtitle={this.nodeResolver.string("text")}
                                  backgroundColor={backgroundColor(ItemFamily[this.nodeResolver.item.genericType]) ?? "gray"}
                                  {...this.props}

            />
        );
    }
}
