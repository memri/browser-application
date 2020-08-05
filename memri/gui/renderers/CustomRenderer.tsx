//
// CustomRenderer.swift
// Copyright © 2020 memri. All rights reserved.


import {allRenderers, CascadingCustomConfig} from "../../cvu/views/Renderers";
import {MainUI, VStack} from "../swiftUI";
import * as React from "react";
import {Item} from "../../model/items/Item";

export var registerCustomRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "custom",
            "",
            0,
            "",
            new CustomRendererView(),
            CascadingCustomConfig,
            function() { return false }
        )
    }
}

//CascadingCustomConfig moved to Renderers.ts

export class CustomRendererView extends MainUI {
    name = "custom"

    get renderConfig() {
        return this.context.currentView?.renderConfig ?? new CascadingCustomConfig()
    }

    render() {
        this.context = this.props.context
        return (
            <VStack>
                {this.renderConfig?.render(this.context.item ?? new Item())}
            </VStack>
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