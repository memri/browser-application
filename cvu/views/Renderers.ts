//
//  Renderer.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


// Potential solution: https://stackoverflow.com/questions/42746981/list-all-subclasses-of-one-class

import {UIElement, UIElementFamily} from "./UIElement";
import {Cascadable} from "./Cascadable";
import {registerListRenderer} from "../../gui/renderers/ListRendererView";
import {orderKeys} from "../../parsers/cvu-parser/CVUToString";
import {Item} from "../../model/items/Item";
import {FilterPanelRendererButton} from "./Action";
import {UIElementView} from "../../gui/common/UIElementView";

export class Renderers {
    all = {}
    allViews = {}
    allConfigTypes = {}

    register(name, title, order, icon =  "", view, renderConfigType, canDisplayResults) {
        this.all[name] = function (context)  {
            return new FilterPanelRendererButton(context, name, order, title, icon, canDisplayResults)
        }
        this.allViews[name] = view
        this.allConfigTypes[name] = renderConfigType
    }
    
    /*register(name, title, order, icon =  "", view, renderConfigType, canDisplayResults) {//TODO
        
        allRenderers.register(name, title, order, icon, view,
                               renderConfigType,
                               canDisplayResults)
    }*/
    
    constructor() {
        //if (allRenderers == null) { allRenderers = this }
        
        //registerCustomRenderer()//TODO
        registerListRenderer()
        //registerGeneralEditorRenderer()
        //registerThumbnailRenderer()
        //registerThumbGridRenderer()
        //registerThumbHorizontalGridRenderer()
        //registerThumbWaterfallRenderer()
        //registerMapRenderer()
        //registerChartRenderer()
        // registerCalendarRenderer()
        // registerMessageRenderer()
        //registerPhotoViewerRenderer()
    }
    
    get tuples() {
        return orderKeys(this.all)
    }
}

export var allRenderers = new Renderers();

//FilterPanelRendererButton moved to Action.ts

class RenderGroup {
    options = {}
    body: UIElement = null
    
    constructor(dict) {
        if (Array.isArray(dict["children"]) && dict["children"][0]?.constructor?.name == "UIElement") this.body = dict["children"][0]
        delete dict["children"]
        this.options = dict
    }
}

interface CascadingRendererDefaults {
    setDefaultValues(element)
}

 
//    renderDescription: [String:Any]? {
//        let rd = cascadeDict("renderDescription", sessionView.definition)
//
//        if (let renderDescription:[String: UIElement] = globalInMemoryObjectCache.get(rd)) {
//            return renderDescription
//        }
//        else if (let renderDescription:[String: UIElement] = unserialize(rd)) {
//            globalInMemoryObjectCache.set(rd, renderDescription)
//            return renderDescription
//        }
//
//        return null
//    }

export class CascadingRenderConfig extends Cascadable {
    
    constructor(
        head?: CVUParsedDefinition,
        tail?: CVUParsedDefinition[],
        host?: Cascadable
    ) {
        super(head, tail, host)
    }
    
    hasGroup(group) {
        let x = this.cascadeProperty(group)
        return x != null
    }
    
    getGroupOptions(group) {
        let renderGroup = this.getRenderGroup(group)
        if (renderGroup) {
            return renderGroup.options
        }
        return {}
    }
    
    getRenderGroup(group) {
        let renderGroup = this.localCache[group]
        if (renderGroup?.constructor?.name == "RenderGroup") {
            return renderGroup
        }
        else if (group == "*" && this.cascadeProperty("*") == null) {
            let list = this.cascadeProperty("children")
            if (list) {
                var dict = {"children": list}
                let renderGroup = new RenderGroup(dict)
                this.localCache[group] = renderGroup
                return renderGroup
            }
        }
        else {
            var dict = this.cascadeProperty(group)
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
                let s = this;//TODO
                if (s.setDefaultValues && typeof s.setDefaultValues === "function") {//TODO
                    s.setDefaultValues(body)
                }
                let uiElement = new UIElementView({gui: body, dataItem: item, viewArguments: argumentsJs/* ?? viewArguments*/});
                //(body, item, argumentsJs ?? viewArguments)
                return uiElement.render();
            }

            return new UIElementView({gui: new UIElement(UIElementFamily.Empty), dataItem: item}).render()
        }

        let renderGroup = this.getRenderGroup(group)
        if (item && renderGroup) {
            return doRender(renderGroup, item)
        }
        else {
            return new UIElementView({gui: new UIElement(UIElementFamily.Empty), dataItem: item ?? new Item()}).render()
        }
    }
}

//CascadingListConfig moved from ListRendererView.tsx
export class CascadingListConfig extends CascadingRenderConfig/*, CascadingRendererDefaults*/ {
    type = "list"

    get longPress() { return this.cascadeProperty("longPress") }
    get press() { return this.cascadeProperty("press") }

    get slideLeftActions() { return this.cascadeList("slideLeftActions") }
    get slideRightActions() { return this.cascadeList("slideRightActions") }

    setDefaultValues(element: UIElement) {
        if (element.properties["padding"] == undefined) {
            element.properties["padding"] = [10, 10, 10, 20]
        }
    }
}
