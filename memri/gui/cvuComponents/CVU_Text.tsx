//
//  CVU_Text.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {CVU_UI, MainUI, MemriText, MemriTextField} from "../swiftUI";
import * as React from "react";
import {MemriSmartTextView} from "../components/Text/MemriSmartTextView";

export class CVU_Text extends CVU_UI {
    get content() {
        return this.nodeResolver.string("text")?.nilIfBlank
    }
    
    render() {
        return (
            <MemriText fixedSize={{horizontal: false, vertical: true}} {...this.props}>
                {this.content}
            </MemriText>
        );
    }
}

export class CVU_SmartText extends CVU_UI {
    get content() {
        return this.nodeResolver.string("text")?.nilIfBlank
    }

    render() {
        return (
                    <MemriSmartTextView string={this.content}
                                        font={this.nodeResolver.font()}
                                        color={this.nodeResolver.color()} {...this.props}
                    />
        );
    }
}

export class CVU_TextField extends CVU_UI {
    editModeBinding

    get hint() {
        return this.nodeResolver.string("hint")?.nilIfBlank
    }

    get contentBinding() {
        return this.nodeResolver.binding("value")?.nilIfBlank
    }

    render() {
        return (<MemriTextField value={this.contentBinding}
                                placeholder={this.hint}
                                textColor={this.nodeResolver.color()?.uiColor}
                                isEditing={this.editModeBinding}
                                isSharedEditingBinding={true} {...this.props}

            />
        );
    }
}