//
// PhotoViewerRenderer.swift
// Copyright © 2020 memri. All rights reserved.


import {frame, Group, MemriText, padding, RenderersMemri, UIImage, ZStack} from "../../swiftUI";
import {ViewArguments} from "../../../../router";
import * as React from "react";
import {Alignment} from "../../../../router";
import {CascadingRendererConfig} from "../../../../router";

export class PhotoViewerRendererController {
    static rendererType = {name: "photoViewer", icon: "camera", makeController: PhotoViewerRendererController, makeConfig: PhotoViewerRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new PhotoViewerRendererConfig()
    }

    context: MemriContext
    config: PhotoViewerRendererConfig

    makeView() {
        return new PhotoViewerRendererView({controller: this, context: this.context}).render();
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new PhotoViewerRendererConfig(head, tail, host)
    }

    resolveExpression(
        expression: Expression,
        toType,
        dataItem: Item
    ) {
        let args = new ViewArguments(this.context.currentView?.viewArguments)
        args.set(".", dataItem)
        return expression?.execForReturnType(args)
    }

    get initialIndex() {
        //Little optimization
        let initialItem = this.config.initialItem;
        if (initialItem) {
            return this.context.items.findIndex((item)=> item.uid == initialItem.uid) ?? 0 //TODO:
        } else
            return 0
    }

    get hasItems() {
        return this.context.items.length != 0
    }


    photoItemProvider(index)  {
        let item = this.context.items[index];
        let file = this.resolveExpression(this.config.imageFile, undefined, item);
        if (!item || !file /*|| !url*/) {
            return undefined;
        }
        let url = file.filename
        let overlay = this.config.render(item);
        return (<>
                <UIImage src={"memri/Resources/DemoAssets/" + url + ".jpg"} context={this.context}/>
                {overlay}
            </>
        )
        /*PhotoViewerController.PhotoItem(index: index, imageURL: url, overlay: overlay)*/
    }

    onToggleOverlayVisibility(visible: boolean) {
        // withAnimation {
            this.isFullScreen = !visible
        // }
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

export class PhotoViewerRendererConfig extends CascadingRendererConfig {
    get imageFile() { return this.cascadeProperty("file", "Expression") }
    get initialItem() { return this.cascadeProperty("initialItem", "Item") }

    showSortInConfig: boolean = true
    configItems(context: MemriContext) {
        return []
    }
    showContextualBarInEditMode: boolean = false
}

export class PhotoViewerRendererView extends RenderersMemri {
    controller: PhotoViewerRendererController

    render() {
        this.controller = this.props.controller;
        return (
            <div id={"PhotoViewerRendererView"} style={{height: "100%"}}>
                <Group>
                    {this.controller.hasItems
                        ?
                        <ZStack alignment={Alignment.topLeading}>
                            {this.controller.photoItemProvider(this.controller.initialIndex)}
                        </ZStack>
                        :
                        <MemriText bold frame={frame({maxWidth: "infinity", maxHeight: "infinity"})}>
                            No photos found
                        </MemriText>
                    }
                </Group>
            </div>
        )
    }
}

/*
struct PhotoViewerRenderer_Previews: PreviewProvider {
    static var previews: some View {
        PhotoViewerRenderer()
    }
}
*/
