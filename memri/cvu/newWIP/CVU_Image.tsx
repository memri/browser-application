import {MainUI, MemriImage, MemriImageView} from "../../gui/swiftUI";
import * as React from "react";
import {Color} from "./CVUColor";

enum CVU_SizingMode {
    fill,
    fit
}

export class CVU_Image extends MainUI {
    nodeResolver: UINodeResolver

    get fileImage() {
        let imageURI = this.nodeResolver.fileURI("image");
        let image = FileStorageController.getImage(imageURI);
        if (!imageURI || !image) {
            return null;
        } else {
            return image
        }
    }


    get bundleImage() {
        let imageName = this.nodeResolver.string("bundleImage");
        let image = UIImage(imageName);
        if (!imageName || !image) {
            return null;
        } else {
            return image
        }
    }

    render(){
        let image = this.fileImage;
        let iconName = this.nodeResolver.string("systemName");

        if (image) {
            return (
                <MemriImageView image={image} fitContent={this.nodeResolver.sizingMode == CVU_SizingMode.fit}/>
            )
        } else if (this.bundleImage) {
            return (
                <MemriImage resizable>
                    {this.bundleImage}
                </MemriImage>
            )
        } else if (iconName) {
            return (
                <MemriImage renderingMode={"template"}>
                    {iconName}
                </MemriImage>
            )
        } else {
            return (
                <MemriImage renderingMode={"template"} aspectRatio={CVU_SizingMode.fit} foregroundColor={new Color("secondaryLabel")}>
                    {"questionmark"}
                </MemriImage>
            )
        }
    }

    /*

        .if(nodeResolver.sizingMode == .fit) {
            $0.aspectRatio(image.aspectRatio, contentMode: .fit)

                .if(nodeResolver.sizingMode == .fit) { $0.aspectRatio(contentMode: .fit) }

        .if(nodeResolver.bool(for: "resizable", defaultValue: false)) { $0.resizable() }
        .if(nodeResolver.sizingMode == .fit) { $0.aspectRatio(contentMode: .fit) }

    }*/
}
