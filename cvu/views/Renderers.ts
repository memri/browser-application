//
//  Renderer.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


// Potential solution: https://stackoverflow.com/questions/42746981/list-all-subclasses-of-one-class
import {Action} from "./Action";
import {Color} from "../../parsers/cvu-parser/CVUParser";
import {UIElement, UIElementFamily} from "./UIElement";
import {Cascadable} from "./Cascadable";
import {registerListRenderer} from "../../gui/renderers/ListRendererView";
import {orderKeys} from "../../parsers/cvu-parser/CVUToString";

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
        //registerRichTextEditorRenderer()
    }
    
    get tuples() {
        return orderKeys(this.all)
    }
}

export var allRenderers = new Renderers();

export class FilterPanelRendererButton extends Action/*, ActionExec*/ {
    defaults = {
        activeColor: new Color("#6aa84f"),
        activeBackgroundColor: new Color("#eee"),
        title: "Unnamed Renderer"
    }
    
    order
    canDisplayResults
    rendererName
    
    constructor(context, name, order, title, icon, canDisplayResults){
        super(context, "setRenderer", null,{icon: icon, title: title})

        this.rendererName = name
        this.order = order
        this.canDisplayResults = canDisplayResults
    }
    
    /*constructor(context, argumentsJs = null, values = {}) {//TODO
        fatalError("init(argumentsJs:values:) has not been implemented")
    }*/
    
    isActive() {
        return this.context.cascadingView?.activeRenderer == this.rendererName
    }
    
    exec(argumentsJs) {
        this.context.cascadingView.activeRenderer = this.rendererName
        this.context.scheduleUIUpdate()/*{ _ in true }*///TODO // scheduleCascadingViewUpdate() // TODO why are userState not kept?
    }
}

class RenderGroup {
    options = {}
    body: UIElement = null
    
    constructor(dict) {
        if (Array.isArray(dict["children"]) && dict["children"][0] instanceof UIElement) this.body = dict["children"][0]
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

class CascadingRenderConfig extends Cascadable {
    
    constructor(cascadeStack = [], viewArguments) {
        super(cascadeStack, viewArguments)
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
        if (renderGroup instanceof RenderGroup) {
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
        
        function doRender(renderGroup, item) {
            let body = renderGroup.body
            if (body) {
                let s = this;//TODO
                if (s instanceof CascadingRendererDefaults) {
                    s.setDefaultValues(body)
                }
                
                return new UIElementView(body, item, argumentsJs ?? viewArguments)
            }
            return new UIElementView(new UIElement(UIElementFamily.Empty), item)
        }

        let renderGroup = this.getRenderGroup(group)
        if (item && renderGroup) {
            return doRender(renderGroup, item)
        }
        else {
            return new UIElementView(new UIElement(UIElementFamily.Empty), item ?? new Item())
        }
    }
}
