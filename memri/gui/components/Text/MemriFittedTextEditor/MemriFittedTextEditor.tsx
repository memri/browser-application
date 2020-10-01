//
// MemriFittedTextEditor.swift
// Copyright © 2020 memri. All rights reserved.

// Intended for use in message composer. Will self-adjust size as needed
import {frame, MainUI, MemriText, MemriTextField, padding} from "../../../swiftUI";
import {Color} from "../../../../../router";
import * as React from "react";

export class MemriFittedTextEditor extends MainUI {
    contentBinding
    placeholder: string
    
    fontSize = 18
    backgroundColor
    isEditing
    
    
    preferredHeight = 0


    get displayHeight() {
        let minHeight: CGFloat = 30
        let maxHeight: CGFloat = 150

        return Math.min(Math.max(minHeight, this.preferredHeight), maxHeight)
    }

    render() {
        this.contentBinding = this.props.contentBinding;
        this.fontSize = this.props.fontSize ?? this.fontSize;
        this.isEditing = this.props.isEditing;
        this.preferredHeight = this.props.preferredHeight ?? this.preferredHeight;
        this.backgroundColor = this.props.backgroundColor;
        this.placeholder = this.props.placeholder;

        return (
            <MemriFittedTextEditor_Inner textContent={this.contentBinding} fontSize={this.fontSize}
                                         isEditing={this.isEditing} preferredHeight={this.preferredHeight}
                                         onTextChanged={(newText) => {
                                             //DispatchQueue.main.async {
                                             this.contentBinding = newText
                                             //}
                                         }} background={this.backgroundColor?.color ?? new Color("systemBackground")}
                                         frame={frame({height: this.displayHeight})}
                                         placeholder={this.placeholder}
            />
        )
    }

    /*public var body: some View {

            .background(placeholderView)

            .clipShape(RoundedRectangle(cornerRadius: 5))

    }*/

    get placeholderView() {
        if (this.contentBinding == undefined) {
            return (
                <MemriText foregroundColor={new Color("secondaryLabel")}
                           padding={padding({horizontal: 10})}>{this.placeholder}</MemriText>
            )
            /* .frame(maxWidth: .infinity, alignment: .leading)*/
        }
    }
}


export class MemriFittedTextEditor_Inner extends MainUI {

    textContent
    fontSize
    isEditing
    preferredHeight
    onTextChanged
    placeholder

    render(){
        this.textContent = this.props.contentBinding;
        this.fontSize = this.props.fontSize;
        this.isEditing = this.props.isEditing;
        this.preferredHeight = this.props.preferredHeight;
        this.onTextChanged = this.props.onTextChanged;
        this.placeholder = this.props.placeholder
        //TODO:
        return (
            <MemriTextField value={this.textContent} onChange={this.onTextChanged} placeholder={this.placeholder}/>
        )
    }

    /*public func makeUIView(context _: Context) -> MemriFittedTextEditorWrapper_UIKit {
        MemriFittedTextEditorWrapper_UIKit(
            MemriFittedTextEditor_UIKit(textContent: textContent,
                                  fontSize: fontSize,
                                  backgroundColor: ColorDefinition.system(.clear))
        )
    }
    
    public func updateUIView(_ wrapper: MemriFittedTextEditorWrapper_UIKit, context _: Context) {
        wrapper.textEditor.updateTextIfNotEditing(textContent)
        wrapper.textEditor.preferredHeightBinding = preferredHeight
        wrapper.textEditor.onTextChanged = onTextChanged
        wrapper.textEditor.fontSize = fontSize
        wrapper.textEditor.isEditingBinding = isEditing
    }*/
}
