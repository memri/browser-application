import {CVU_UI, frame, MainUI, MemriImage, MemriImageView} from "../../swiftUI";
import * as React from "react";
import {Color} from "../valueTypes/CVUColor";

export enum CVU_SizingMode {
    fill = "fill",
    fit = "fit"
}

export class CVU_Image extends CVU_UI {
    get fileImageURL() {
        let imageURI = this.nodeResolver.fileURI("image");
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
        this.nodeResolver = this.props.nodeResolver;
        let imageURL = this.fileImageURL;
        let iconName = this.nodeResolver.string("systemName");

        if (imageURL) {//TODO: aspectRatio ?
            return (
                <MemriImageView image={imageURL} fitContent={this.nodeResolver.sizingMode == CVU_SizingMode.fit} {...this.props}/>
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
                <MemriImage renderingMode={"template"} aspectRatio={CVU_SizingMode.fit} foregroundColor={new Color("secondaryLabel")} frame={frame({maxWidth: "infinity", maxHeight: "infinity"})} layoutPriority={-1} {...this.props}>
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
