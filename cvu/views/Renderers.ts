//
//  Renderer.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


// Potential solution: https://stackoverflow.com/questions/42746981/list-all-subclasses-of-one-class
var allRenderers = null

class Renderers {
    all = {}
    allViews = {}
    allConfigTypes = {}

    register(name, title, order, icon =  "", view, renderConfigType, canDisplayResults) {

        // var context = new FilterPanelRendererButton(context, name, order, title, icon, canDisplayResults)//TODO

        /*this.all[name] = { context in FilterPanelRendererButton(context,
            name: name,
            order: order,
            title: title,
            icon: icon,
            canDisplayResults: canDisplayResults
        ) }*/
        this.allViews[name] = view
        this.allConfigTypes[name] = renderConfigType
    }
    
    /*register(name, title, order, icon =  "", view, renderConfigType, canDisplayResults) {//TODO
        
        allRenderers.register(name, title, order, icon, view,
                               renderConfigType,
                               canDisplayResults)
    }*/
    
    constructor() {
        if (allRenderers == null) { allRenderers = this }
        
        registerCustomRenderer()//TODO
        registerListRenderer()
        registerGeneralEditorRenderer()
        registerThumbnailRenderer()
        registerThumbGridRenderer()
        registerThumbHorizontalGridRenderer()
        registerThumbWaterfallRenderer()
        registerMapRenderer()
        registerChartRenderer()
        registerRichTextEditorRenderer()
    }
    
    tuples() {
        return Object.fromEntries(Object.entries(this.all).sort())//TODO
    }
}

class FilterPanelRendererButton extends Action, ActionExec {
    defaults = {
        activeColor: new Color("#6aa84f"),
        activeBackgroundColor: new Color("#eee"),
        title: "Unnamed Renderer"
    }
    
    order
    canDisplayResults
    rendererName
    
    constructor(context, name, order, title, icon, canDisplayResults){
        super(context, "setRenderer", {icon:icon, title:title})

        this.rendererName = name
        this.order = order
        this.canDisplayResults = canDisplayResults
    }
    
    /*constructor(context, argumentsJs = null, values = {}) {//TODO
        fatalError("init(argumentsJs:values:) has not been implemented")
    }*/
    
    isActive() {
        return this.context.cascadingView.activeRenderer == this.rendererName
    }
    
    exec(argumentsJs) {
        this.context.cascadingView.activeRenderer = this.rendererName
        this.context.scheduleUIUpdate(){ _ in true }//TODO // scheduleCascadingViewUpdate() // TODO why are userState not kept?
    }
}

class RenderGroup {
    options = {}
    body = null
    
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
        viewArguments = viewArguments || new ViewArguments();
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
                var dict = {children: list}
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
        
        function doRender(renderGroup) {
            let body = renderGroup.body
            if (body) {
                let s = this;//TODO
                if (s instanceof CascadingRendererDefaults) {
                    s.setDefaultValues(body)
                }
                
                return new UIElementView(body, item, argumentsJs ?? viewArguments)
            }
            return new UIElementView(new UIElement(), item)
        }

        let renderGroup = this.getRenderGroup(group)
        if (renderGroup) {
            return doRender(renderGroup)
        }
        else {
            return new UIElementView(new UIElement(), item)
        }
    }
}
