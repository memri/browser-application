import * as React from "react";
import {MainUI, MemriTextField, VStack} from "../swiftUI";

export class RichTextEditor extends MainUI {
    render() {
        return (
            <VStack spacing={0}>
                <MemriTextField value={this.props.titleBinding ?? "" }
                                placeholder={this.props.titleHint ?? ""} onChange={(e)=>{this.props.item.set("title", e.target.value)}}>

                </MemriTextField>
                <textarea defaultValue={this.props.htmlContentBinding ?? this.props.plainContentBinding ?? ""} onChange={(e)=>{this.props.item.set("content", e.target.value)}}>

                </textarea>
            </VStack>
        )
    }
}