import * as React from "react";
import {MainUI, MemriTextField, VStack} from "../swiftUI";

export class RichTextEditor extends MainUI {
    render() {
        return (
            <VStack spacing={0}>
                <MemriTextField value={this.props.titleBinding ?? "" }
                                placeholder={this.props.titleHint ?? ""}>

                </MemriTextField>
                <textarea defaultValue={this.props.htmlContentBinding ?? this.props.plainContentBinding ?? ""}>

                </textarea>
            </VStack>
        )
    }
}