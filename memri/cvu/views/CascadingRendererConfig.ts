//
// CascadingRendererConfig.swift
// Copyright © 2020 memri. All rights reserved.

import {CVUColor, MemriDictionary, UINodeResolver, ViewArguments} from "../../../router";
import {UINode, UIElementFamily} from "../../../router";
import {Cascadable} from "../../../router";
import {Item, UUID} from "../../../router";
import {UIElementView} from "../../gui/cvuComponents/UIElementView";
import {EmptyView} from "../../gui/swiftUI";

export class RenderGroup {
    options: MemriDictionary
    body: UINode

    constructor(dict: MemriDictionary) {
        if (Array.isArray(dict["children"]) && dict["children"][0]?.constructor?.name == "UINode") this.body = dict["children"][0]
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

    render(item, group =  "*", argumentsJs =  new ViewArguments()) {
        let body = this.getRenderGroup(group)?.body;
        if (item && body) {
            let nodeResolver = new UINodeResolver(body, argumentsJs.copy(item))
            return new UIElementView({nodeResolver: nodeResolver, context: this.host.context}).render()/*.eraseToAnyView()*/
        }
        else {//TODO:
            return new EmptyView({}).render()
        }
    }
}

//CommonRendererConfig.swift
Object.defineProperty(CascadingRendererConfig.prototype, "primaryColor", {
    get(): CVUColor {
        return this.cascadePropertyAsColor("color") ?? CVUColor.system("systemBlue")
    },
    set(value) {
        this.setState("color", value)
    },
})

Object.defineProperty(CascadingRendererConfig.prototype, "backgroundColor", {
    get() {
        return this.cascadePropertyAsColor("background");
    },
    set(value) {
        this.setState("background", value)
    },
})

Object.defineProperty(CascadingRendererConfig.prototype, "spacing", {
    get() {//TODO:
        let spacing = this.cascadeProperty("spacing");
        if (spacing) {
            return spacing;
        }
        /*else if let x: [Double?] = cascadeProperty("spacing") {
                let spacingArray = x.compactMap { $0.map { CGFloat($0) } }
                guard spacingArray.count == 2 else { return .zero }
                return CGSize(width: spacingArray[0], height: spacingArray[1])
            }*/
        return 0;
    },
    set(value) {
        this.setState("spacing", value)
    }
})

Object.defineProperty(CascadingRendererConfig.prototype, "contextMenuActions", {
    get() {
        return this.cascadeList("contextMenu")
    },
    set(value) {
        this.setState("contextMenu", value)
    },
})

Object.defineProperty(CascadingRendererConfig.prototype, "edgeInset", {
    get() {
        let x = this.cascadeProperty("edgeInset");
        if (x) {
            if (Array.isArray(x)) {
                let insetArray = x.filter(($0) => $0 != undefined);
                switch (insetArray.length) {
                    case 2:
                        return {
                            top: insetArray[1],
                            left: insetArray[0],
                            bottom: insetArray[1],
                            right: insetArray[0]
                        }
                    case 4:
                        return {
                            top: insetArray[0],
                            left: insetArray[3],
                            bottom: insetArray[2],
                            right: insetArray[1]
                        }
                    default:
                        return;
                }
            } else {
                let edgeInset = x;
                return {
                    top: edgeInset,
                    left: edgeInset,
                    bottom: edgeInset,
                    right: edgeInset
                }
            }
        }
        return this.defaultEdgeInset
    },
    set(value) {
        this.setState("edgeInset", value);
    },
})

Object.defineProperty(CascadingRendererConfig.prototype, "nsEdgeInset", {
    get() {
        let edgeInset = this.edgeInset;
        return {
            top: edgeInset.top,
            leading: edgeInset.left,
            bottom: edgeInset.bottom,
            trailing: edgeInset.right
        }
    }
})