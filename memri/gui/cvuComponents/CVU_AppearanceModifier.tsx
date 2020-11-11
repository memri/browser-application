//
//  CVU_AppearanceModifier.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {Color} from "../../cvu/newWIP/CVUColor";
import {font, frame, offset, padding} from "../swiftUI";

export class CVU_AppearanceModifier {
    nodeResolver: UINodeResolver
   
    /*var shape: some InsettableShape {
        RoundedRectangle(cornerRadius: nodeResolver.cornerRadius)
    }*/

    constructor(nodeResolver) {
        this.nodeResolver = nodeResolver;

        return this.body(nodeResolver);
    }

    body(nodeResolver) {
        return {
            frame: frame({
                minWidth: nodeResolver.minWidth,
                maxWidth: nodeResolver.maxWidth,
                minHeight: nodeResolver.minHeight,
                maxHeight: nodeResolver.maxHeight
            }),
            foregroundColor: nodeResolver.color(),
            font: font(nodeResolver.font()),
            multilineTextAlignment: nodeResolver.textAlignment(),
            lineLimit: nodeResolver.lineLimit,
            padding: padding(nodeResolver.padding ?? nodeResolver.margin),
            cornerRadius: nodeResolver.cornerRadius,
            background: nodeResolver.backgroundColor?.color ?? new Color("clear"),
            offset: offset(nodeResolver.offset),
            opacity: nodeResolver.opacity,
            zIndex: nodeResolver.zIndex
        }
        /*
            .if(nodeResolver.cornerRadius > 0) { $0.clipShape(shape) }
            .background(
                shape
                    .ifLet(nodeResolver.shadow) { $0.shadow(radius: $1) })
            .overlay(
                shape
                    .strokeBorder(nodeResolver.borderColor?.color ?? .clear)
            )*/
    }
}
