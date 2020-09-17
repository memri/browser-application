//
// Renderers.swift
// Copyright © 2020 memri. All rights reserved.

import {MemriDictionary} from "../../model/MemriDictionary";
import {UIElement, UIElementFamily} from "./UIElement";
import {Cascadable} from "./Cascadable";
import {Item, UUID} from "../../model/schemaExtensions/Item";
import {UIElementView} from "../../gui/common/UIElementView";

export class RenderGroup {
    options: MemriDictionary
    body: UIElement

    constructor(dict: MemriDictionary) {
        if (Array.isArray(dict["children"]) && dict["children"][0]?.constructor?.name == "UIElement") this.body = dict["children"][0]
        delete dict["children"]
        this.options = dict
    }
}

export class CascadingRendererConfig extends Cascadable {

    constructor(
        head?: CVUParsedDefinition,
        tail?: CVUParsedDefinition[],
        host?: Cascadable
    ) {
        super(head, tail, host)
    }

    // Used for ui purposes. Random value that doesn't need to be persisted
    ui_UUID = UUID()

    hasGroup(group) {
        let x = this.cascadeProperty(group)
        return x != null
    }

    getGroupOptions(group) {
        let renderGroup = this.getRenderGroup(group)
        if (renderGroup) {
            return renderGroup.options
        }
        return new MemriDictionary()
    }

    getRenderGroup(group) {
        let renderGroup = this.localCache[group]
        if (renderGroup?.constructor?.name == "RenderGroup") {
            return renderGroup
        }
        else if (group == "*" && this.cascadeProperty("*") == null) {
            let list = this.cascadeProperty("children")
            if (list) {
                var dict = new MemriDictionary({"children": list})
                let renderGroup = new RenderGroup(dict)
                this.localCache[group] = renderGroup
                return renderGroup
            }
        }
        else {
            var dict: MemriDictionary = this.cascadeProperty(group)
            if (dict) {
                let renderGroup = new RenderGroup(dict)
                this.localCache[group] = renderGroup
                return renderGroup
            }
        }


        return null
    }

    render(item, group =  "*", argumentsJs =  null) {

        let doRender = (renderGroup, item) => {
            let body = renderGroup.body
            if (body) {
                let uiElement = new UIElementView({context: this.host.context, gui: body, dataItem: item, viewArguments: argumentsJs ?? this.viewArguments});
                return uiElement.render();
            }

            return new UIElementView({context: this.host.context, gui: new UIElement(UIElementFamily.Empty), dataItem: item}).render()
        }

        let renderGroup = this.getRenderGroup(group)
        if (item && renderGroup) {
            return doRender(renderGroup, item)
        }
        else {
            return new UIElementView({context: this.host.context, gui: new UIElement(UIElementFamily.Empty), dataItem: item ?? new Item()}).render()
        }
    }
}