//
// CustomRenderer.swift
// Copyright © 2020 memri. All rights reserved.


import {MainUI, VStack} from "../swiftUI";
import * as React from "react";
import {CascadingRendererConfig} from "../../../router";

export class CustomRendererController {
    static rendererType = {name:"custom",icon: "lightbulb", makeController:CustomRendererController, makeConfig:CustomRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new CustomRendererConfig()
    }

    context: MemriContext
    config: CustomRendererConfig

    makeView() {
        return new CustomRendererView({controller: this, context: this.context}).render();
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new CustomRendererConfig(head, tail, host)
    }

    customView() {
        return this.config.render(this.context.item)
    }
}

export class CustomRendererConfig extends CascadingRendererConfig {

    showSortInConfig: boolean = false

    configItems(context: MemriContext) {
        return []
    }

    showContextualBarInEditMode: boolean = false
}

export class CustomRendererView extends MainUI {
    controller: CustomRendererController

    render() {
        this.context = this.props.context
        this.controller = this.props.controller;
        return (
            <div id={"CustomRenderer"}>
                <VStack>
                    {this.controller.customView()}
                </VStack>
            </div>
        )
    }
}

/*
struct CustomRendererView_Previews: PreviewProvider {
    static var previews: some View {
        CustomRendererView().environmentObject(try! RootContext(name: "", key: "").mockBoot())
    }
}
*/