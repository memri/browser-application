import {CVU_UI, MainUI, MemriImage, MemriImageView} from "../../gui/swiftUI";
import * as React from "react";
import {Color} from "./CVUColor";

export enum CVU_SizingMode {
    fill = "fill",
    fit = "fit"
}

export class CVU_Image extends CVU_UI {
    get fileImage() {
        let imageURI = this.nodeResolver.fileURI("image");
        //let image = FileStorageController.getImage(imageURI);
        if (!imageURI) {
            return null;
        } else {
            return imageURI
        }
    }


    get bundleImage() {
        let imageName = this.nodeResolver.string("bundleImage");
        //let image = UIImage(imageName);
        if (!imageName) {
            return null;
        } else {
            return imageName
        }
    }

    render(){
        let image = this.fileImage;
        let iconName = this.nodeResolver.string("systemName");

        if (image) {
            return (
                <MemriImageView image={image} fitContent={this.nodeResolver.sizingMode == CVU_SizingMode.fit} {...this.props}/>
            )
        } else if (this.bundleImage) {
            return (
                <MemriImage resizable {...this.props}>
                    {this.bundleImage}
                </MemriImage>
            )
        } else if (iconName) {
            return (
                <MemriImage renderingMode={"template"} {...this.props}>
                    {iconName}
                </MemriImage>
            )
        } else {
            return (
                <MemriImage renderingMode={"template"} aspectRatio={CVU_SizingMode.fit} foregroundColor={new Color("secondaryLabel")} {...this.props}>
                    {"error"}
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
