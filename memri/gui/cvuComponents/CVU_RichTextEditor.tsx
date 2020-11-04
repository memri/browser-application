//
//  CVU_Text.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {MainUI} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";

export class CVU_RichTextEditor extends MainUI {
    nodeResolver: UINodeResolver
    editModeBinding
    searchTerm: string
    
    
    get fontSize() { return this.nodeResolver.cgFloat("fontSize") ?? 18 }
//    get titleHint() { return this.nodeResolver.string("titleHint")?.nilIfBlank }
    
    get titleBinding() {
        return this.nodeResolver.binding("title")
    }
    
    get contentBinding() {
        return this.nodeResolver.binding("content", "")
    }
    
    render() {
        return (
            <MemriTextEditor model={MemriTextEditorModel(this.titleBinding?.wrappedValue, this.contentBinding.wrappedValue)}
                             onModelUpdate={ (model) => {
                                 this.titleBinding && (this.titleBinding.wrappedValue = model.title)
                                 this.contentBinding.wrappedValue = model.body
                             }}
                             searchTerm={this.searchTerm}
                             isEditing={this.editModeBinding}
                             fontSize={this.fontSize}
            />
        )
    }
    
}
