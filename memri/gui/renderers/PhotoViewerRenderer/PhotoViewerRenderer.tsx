//
// PhotoViewerRenderer.swift
// Copyright © 2020 memri. All rights reserved.


import {allRenderers, PhotoViewerRendererConfig} from "../Renderers";
import {Group, MemriText, padding, RenderersMemri, UIImage, ZStack} from "../../swiftUI";
import {ViewArguments} from "../../../cvu/views/CascadableDict";
import * as React from "react";
import {Alignment} from "../../../cvu/parsers/cvu-parser/CVUParser";

export var registerPhotoViewerRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "photoViewer",
            "Default",
            10,
            "photo_camera",//camera
            new PhotoViewerRenderer(),
            PhotoViewerRendererConfig,
            function(items) { return items[0].genericType == "Photo"}
        )
    }
}

export class PhotoViewerRenderer extends RenderersMemri {
    context: MemriContext

    get renderConfig(): PhotoViewerRendererConfig {
        return this.context.currentView?.renderConfig ?? new PhotoViewerRendererConfig()
    }

    resolveExpression(
        expression: Expression,
        _,
        dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem)
        return expression?.execForReturnType(args);
    }

    get initialIndex() {
        //Little optimization
        let initialItem = this.renderConfig.initialItem;
        if (initialItem) {
            return this.context.items.findIndex((item)=> item.uid == initialItem.uid) ?? 0 //TODO:
        } else
            return 0
    }

    photoItemProvider(index)  {
        let item = this.context.items[index];
        let file = this.renderConfig.imageFile//this.resolveExpression(this.renderConfig.imageFile, undefined, item);
        if (!item || !file /*|| !url*/) {
            return undefined;
        }
        let url = file.filename
        let overlay = this.renderConfig.render(item);
        return (<>
            <UIImage src={"memri/Resources/DemoAssets/" + url + ".jpg"}></UIImage>
            {overlay}
            </>
        )
        /*PhotoViewerController.PhotoItem(index: index, imageURL: url, overlay: overlay)*/
    }

    render() {
        this.context = this.props.context;
        console.log(this.context);
    return (
        <Group>
            {(this.context.items.isEmpty)?
            <MemriText>
                No photos found
            </MemriText> :
                <ZStack alignment={Alignment.topLeading}>
                    {this.photoItemProvider(this.initialIndex)}
                </ZStack>
            }
        </Group>
    )
    }

    onToggleOverlayVisibility(visible: boolean) {
        //withAnimation {
        this.isFullScreen = !visible
        //}
    }

    toggleFullscreen() {
        this.isFullScreen.toggle()
    }

    get isFullScreen() {
        return this.context.currentView?.fullscreen ?? false
    }

    set isFullScreen(newValue) {
        if (this.context.currentView)
            this.context.currentView.fullscreen = newValue
    }
}

/*
struct PhotoViewerRenderer_Previews: PreviewProvider {
    static var previews: some View {
        PhotoViewerRenderer()
    }
}
*/
