//
// FileRenderer.swift
// Copyright © 2020 memri. All rights reserved.

import {CascadingRendererConfig} from "../../../cvu/views/CascadingRendererConfig";
import {ViewArguments} from "../../../cvu/views/CascadableDict";
import {FileViewerItem, MemriFileViewController} from "./FileViewerController";
import {RenderersMemri} from "../../swiftUI";
import * as React from "react";

export class FileRendererController {
    static rendererType = {
        name: "fileViewer",
        icon: "description"/*"doc.text"*/,
        makeController: FileRendererController,
        makeConfig: FileRendererController.makeConfig
    }

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new FileRendererConfig()
    }

    context: MemriContext
    config: FileRendererConfig

    makeView() {
        return <FileRendererView controller={this} context={this.context}/>
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new FileRendererConfig(head, tail, host)
    }

    resolveExpression(expression: Expression, dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem)
        return expression?.execForReturnType(args);
    }

    get initialIndex(): number {
        return this.context.items.findIndex(($0) => this.config.initialItem == $0) ?? 0 //TODO flatMap??
    }

    get files(): FileViewerItem[] {
        return this.context.items.map((item) => {
            let file = this.resolveExpression(this.config.file, item)// ?? (item as? File)
            if (!file && item.constructor.name == "File") {file = item}

            if (!file) { return undefined }
            return new FileViewerItem(file.url,
                                  this.resolveExpression(
                                      this.config.itemTitle,
                                      item
                                  ))
        }).filter((item) => item != undefined)
    }

    get isFullScreen(): Binding<Bool> {
        return this.context?.currentView?.fullscreen ?? false
    }

    set isFullScreen($0) {
        this.context?.currentView && (this.context.currentView.fullscreen = $0)
    }
}

export class FileRendererConfig extends CascadingRendererConfig {
    get file(): Expression { return this.cascadeProperty("file", "Expression") }
    get itemTitle(): Expression { return this.cascadeProperty("itemTitle", "Expression") }
    get initialItem(): Item { return this.cascadeProperty("initialItem", "Item") }
}

class FileRendererView extends RenderersMemri {
    render() {
        this.controller = this.props.controller;

        return (
            <div className={"FileRendererView"}>
                <MemriFileViewController
                    files={this.controller.files}
                    initialIndex={this.controller.initialIndex}
                    navBarHiddenBinding={this.controller.isFullScreen}
                />
            </div>
        )
    }
}
