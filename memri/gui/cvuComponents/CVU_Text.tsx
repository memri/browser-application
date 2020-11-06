//
//  CVU_Text.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {MainUI, MemriText, MemriTextField} from "../swiftUI";
import * as React from "react";
import {UINodeResolver} from "./UIElement";
import {MemriSmartTextView} from "../components/Text/MemriSmartTextView";

export class CVU_Text extends MainUI {
    nodeResolver: UINodeResolver
    
    get content() {
        return this.nodeResolver.string("text")?.nilIfBlank
    }
    
    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
            <MemriText fixedSize={{horizontal: false, vertical: true}} >
                {this.content}
            </MemriText>
        );
    }
}

export class CVU_SmartText extends MainUI {
    nodeResolver: UINodeResolver
    
    get content() {
        return this.nodeResolver.string("text")?.nilIfBlank
    }

    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (
                    <MemriSmartTextView string={this.content}
                                        font={this.nodeResolver.font()}
                                        color={this.nodeResolver.color()}
                    />
        );
    }
}

export class CVU_TextField extends MainUI {
    nodeResolver: UINodeResolver
    editModeBinding

    get hint() {
        return this.nodeResolver.string("hint")?.nilIfBlank
    }

    get contentBinding() {
        return this.nodeResolver.binding("value")?.nilIfBlank
    }

    render() {
        this.nodeResolver = this.props.nodeResolver;

        return (<MemriTextField value={this.contentBinding}
                                placeholder={this.hint}
                                textColor={this.nodeResolver.color()?.uiColor}
                                isEditing={this.editModeBinding}
                                isSharedEditingBinding={true}

            />
        );
    }
}