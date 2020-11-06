//
//  CVU_Text.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {CVU_UI, MainUI} from "../swiftUI";
import * as React from "react";
import {RichTextEditor} from "../MemriTextEditor/RichTextEditor";

export class CVU_RichTextEditor extends CVU_UI {
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
        this.searchTerm = this.props.searchTerm;
        this.isEditing = this.props.editModeBinding;
        //TODO: this is our way to solve richtextEditor @mkslanc
        return (
            <RichTextEditor htmlContentBinding={this.contentBinding}
                                 titleBinding={this.titleBinding}
                                 fontSize={this.fontSize} searchTerm={this.searchTerm} isEditing={this.editModeBinding} {...this.props}
                 />
        )
    }
    
}
