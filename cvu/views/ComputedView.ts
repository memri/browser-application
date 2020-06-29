//
//  ComputedView.swift
//  memri
//
//  Created by Koen van der Veen on 29/04/2020.
//  Copyright © 2020 memri. All rights reserved.
//


class ComputedView extends ObservableObject {

    queryOptions = new QueryOptions();
    resultSet

    name = ""
    rendererName = ""
    backTitle = ""
    icon = ""
    browsingMode = ""
    searchMatchText = ""

    showLabels = true

    cascadeOrder = []
    sortFields = []
    selection = []
    editButtons = []
    filterButtons = []
    actionItems = []
    navigateItems = []
    contextButtons = []
    activeStates = []
    
    renderer = null // TODO
    rendererView = null // TODO
    sessionView = null
    renderConfigs /*= new RenderConfigs()*/
    actionButton = null
    editActionButton = null
    
    variables = {}
    
    _emptyResultText = "No items found"
    _emptyResultTextTemp = null

    get emptyResultText () {
        return this._emptyResultTextTemp || this._emptyResultText
    }
    set emptyResultText(newEmptyResultText)  {
        if (newEmptyResultText == "") { this._emptyResultTextTemp = null }
        else { this._emptyResultTextTemp = newEmptyResultText }
    }
    
    _title = ""
    _titleTemp = null
    get title (){
        return this._titleTemp || this._title
    }
    set title(newTitle) {
        if (newTitle == "") { this._titleTemp = null }
        else { this._titleTemp = newTitle }
    }

    _subtitle = ""
    _subtitleTemp = null
    get subtitle() {
        return this._subtitleTemp || this._subtitle
    }
    set subtitle(newSubtitle) {
        if (newSubtitle == "") { this._subtitleTemp = null }
        else { this._subtitleTemp = newSubtitle }
    }
    
    _filterText = ""


    get filterText(){
        return this._filterText
    }

    set filterText(newFilter) {
        // Store the new value
        this._filterText = newFilter

        // If this is a multi item result set
        if (this.resultSet.isList()) {

            // TODO we should probably ask the renderer if (this is preferred
            // Some renderers such as the charts would probably rather highlight the
            // found results instead of filtering the other data points out

            // Filter the result set
            this.resultSet.filterText = this._filterText
        }
        else {
            console.log("Warn: Filtering for single items not Implemented Yet!")
        }

        if (this._filterText == "") {
            this.title = ""
            this.subtitle = ""
            this.emptyResultText = ""
        }
        else {
            // Set the title to an appropriate message
            if (this.resultSet.count == 0) { this.title = "No results" }
            else if (this.resultSet.count == 1) { this.title = "1 item found" }
            else { this.title = `${this.resultSet.count} items found` }

            // Temporarily hide the subtitle
            // subtitle = " " // TODO how to clear the subtitle ??

            this.emptyResultText = `No results found using '${this._filterText}'`
        }

        // Save the state on the session view
        // this.cache.realm.write { this.sessionView.filterText = this.filterText }//TODO
    }
    
    cache
    
    constructor(ch){
        super()
        this.cache = ch
        this.resultSet = new ResultSet(this.cache)
    }
    
    merge(view) {
        // TODO this function is called way too often
        
        this.queryOptions.merge(view.queryOptions!)
        
        this.name = view.name || this.name
        this.rendererName = view.rendererName || this.rendererName
        this.backTitle = view.backTitle || this.backTitle
        this.icon = view.icon || this.icon
        this.browsingMode = view.browsingMode || this.browsingMode

        this._title = view.title || this._title
        this._subtitle = view.subtitle || this._subtitle
        this._filterText = view.filterText || this._filterText
        this._emptyResultText = view.emptyResultText || this._emptyResultText
        
        this.showLabels = view.showLabels.value || this.showLabels
        
        if (view.sortFields.length > 0) {
            this.sortFields = []
            this.sortFields.push(view.sortFields)
        }
        
        this.cascadeOrder.push(view.cascadeOrder)
        this.selection.push(view.selection)
        this.editButtons.push(view.editButtons)
        this.filterButtons.push(view.filterButtons)
        this.actionItems.push(view.actionItems)
        this.navigateItems.push(view.navigateItems)
        this.contextButtons.push(view.contextButtons)
        this.activeStates.push(view.activeStates)

        let renderConfigs = view.renderConfigs
        if (renderConfigs) {
            this.renderConfigs.merge(renderConfigs)
        }
        
        this.actionButton = view.actionButton || this.actionButton
        this.editActionButton = view.editActionButton || this.editActionButton

        let variables = view.variables
        if (variables) {
            for (let [key, value] of Object.entries(variables)) {
                this.variables[key] = value
            }
        }
    }
    
    finalMerge(view) {
        // Merge view into self
        this.merge(view)
        
        // Store session view on self
        this.sessionView = view
        
        // Update search result to match the query
        this.resultSet = this.cache.getResultSet(this.queryOptions)
        
        // Filter the results
        this.filterText(this._filterText)
    }

    /// Validates a merged view
    validate() {
        if (this.rendererName == "") { throw("Property 'rendererName' is not defined in this view") }
        
        let renderProps = this.renderConfigs.objectSchema.properties
        /*if (renderProps.filter(){ (property) in property.name == this.rendererName }).count == 0 {//TODO
//            throw(`Missing renderConfig for ${this.rendererName} in this view`)
            console.log(`Warn: Missing renderConfig for ${this.rendererName} in this view`)
        }*/
        
        if (this.queryOptions.query == "") { throw("No query is defined for this view") }
        if (this.actionButton == null && this.editActionButton == null) {
            console.log("Warn: Missing action button in this view")
        }
    }
    
    toggleState(stateName) {
        let index = this.activeStates.indexOf(stateName)
        if (index >= 0){
            this.activeStates.splice(index, 1)
        }
        else {
            this.activeStates.push(stateName)
        }
    }
    
    hasState(stateName) {
        if (this.activeStates.includes(stateName)){
            return true
        }
        return false
    }
    
    getPropertyValue(name) {
        let type = new Mirror(this)

        for (let child of type.children) {
            if (child.label == name || child.label == "_" + name) {
                return child.value
            }
        }
        
        return ""
    }
    
}
