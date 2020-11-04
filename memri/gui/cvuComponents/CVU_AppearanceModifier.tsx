//
//  CVU_AppearanceModifier.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import SwiftUI

struct CVU_AppearanceModifier: ViewModifier {
    var nodeResolver: UINodeResolver
   
    var shape: some InsettableShape {
        RoundedRectangle(cornerRadius: nodeResolver.cornerRadius)
    }
    
    func body(content: Content) -> some View {
        content
            .frame(minWidth: nodeResolver.minWidth, maxWidth: nodeResolver.maxWidth, minHeight: nodeResolver.minHeight, maxHeight: nodeResolver.maxHeight)
            .foregroundColor(nodeResolver.color()?.color)
            .font(nodeResolver.font().font)
            .multilineTextAlignment(nodeResolver.textAlignment())
            .lineLimit(nodeResolver.lineLimit)
            .padding(nodeResolver.padding)
            .if(nodeResolver.cornerRadius > 0) { $0.clipShape(shape) }
            .background(
                shape
                    .fill(nodeResolver.backgroundColor?.color ?? .clear)
                    .ifLet(nodeResolver.shadow) { $0.shadow(radius: $1) })
            .overlay(
                shape
                    .strokeBorder(nodeResolver.borderColor?.color ?? .clear)
            )
            .offset(nodeResolver.offset)
            .opacity(nodeResolver.opacity)
            .padding(nodeResolver.margin)
            .ifLet(nodeResolver.zIndex) { $0.zIndex($1) }
    }
}
