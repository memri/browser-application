//
//  MemriFileThumbnailView.swift
//  memri
//
//  Created by T Brennan on 11/11/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI, MemriImageView} from "../swiftUI";
import {CGSize} from "../cvuComponents/UINodeResolver";
import * as React from "react";

export class MemriFileThumbnailView extends MainUI {
    fileURL: URL
    thumbnailDimensions: CGSize = new CGSize(80, 80)
    
    makeCoordinator() {
        return new Coordinator()
    }

    render(){
        this.fileURL = this.props.fileURL;

        return (
            <MemriImageView image={this.fileURL}/>
        )
    }

    /*func makeUIView(context: Context) -> UIImageView {
        let imageView = UIImageView()
        context.coordinator.imageView = imageView
        context.coordinator.fileURL = fileURL
        context.coordinator.thumbSize = thumbnailDimensions
        imageView.contentMode = .scaleAspectFit
        imageView.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        imageView.setContentCompressionResistancePriority(.defaultLow, for: .vertical)
        return imageView
    }
    
    func updateUIView(_ uiView: UIImageView, context: Context) {
        context.coordinator.fileURL = fileURL
    }*/
    

}

class Coordinator {
    imageView: UIImageView

    thumbSize: CGSize = new CGSize(80, 80)

    get fileURL() {
        //if fileURL != oldValue {
        return this.generateThumbnail()
    }

    thumbnailRequest
    thumbnailCancellable

    generateThumbnail() {

        //this.imageView.image = image
    }
}
