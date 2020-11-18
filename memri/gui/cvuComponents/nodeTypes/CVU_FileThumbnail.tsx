//
// CVU_Image.swift
// Copyright © 2020 memri. All rights reserved.

import {CVU_UI, frame, MemriImage} from "../../swiftUI";
import {CGSize} from "../UINodeResolver";
import * as React from "react";
import {Color} from "../valueTypes/CVUColor";
import {MemriFileThumbnailView} from "../../components/MemriFileThumbnailView";

export class CVU_FileThumbnail extends CVU_UI {

    get fileURL() {
        let fileURI = this.nodeResolver.fileURI("file");
        if (!fileURI) {
            return null;
        } else {
            return fileURI
        }
    }

    get dimensions() {
        return new CGSize(Math.max(30, this.nodeResolver.cgFloat("width") ?? 100),
            Math.max(30, this.nodeResolver.cgFloat("width") ?? 100))
    }

    render(){
        if (this.fileURL) {
            return (
                <MemriFileThumbnailView fileURL={this.fileURL} thumbnailDimensions={this.dimensions}/>
            )
        }
        return (
            <MemriImage renderingMode={"template"}  foregroundColor={Color.named("secondaryLabel")} frame={frame({maxWidth: "infinity", maxHeight: "infinity"})} layoutPriority={-1}>questionmark</MemriImage>
        )
    }
}
