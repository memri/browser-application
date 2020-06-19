//
//  ComputedView.swift
//  memri
//
//  Created by Koen van der Veen on 29/04/2020.
//  Copyright © 2020 memri. All rights reserved.
//

class CascadingView extends Cascadable, ObservableObject {//TODO 

    /// The name of the cascading view
    name() { return this.sessionView.name ?? "" } // by copy??

    /// The session view that is being cascaded
    sessionView;

    datasource() {
        let x = this.localCache["datasource"]//TODO 
        if (x instanceof CascadingDatasource) { return x }

        let ds = this.sessionView.datasource
        if (ds) {
            let stack = this.cascadeStack.map (x => function(x) {//TODO 
                x && x["datasourceDefinition"] instanceof CVUParsedDatasourceDefinition
            })

            let datasource = new CascadingDatasource(stack, this.viewArguments, ds)
            this.localCache["datasource"] = datasource
            return datasource
        }
        else {
            // Missing datasource on sessionview, that should never happen (I think)
            // TODO ERROR REPORTING

            return new CascadingDatasource([], new ViewArguments(), Datasource())
        }
    }

    userState  =/*UserState*/ function (){//TODO 
        this.sessionView.userState ?? UserState(function (args) {
            realmWriteIfAvailable(this.sessionView.realm)
            this.sessionView.userState = args
        })
    }

    // TODO let this cascade when the use case for it arrises
    viewArguments(){//TODO
        get {
            sessionView.viewArguments ?? ViewArguments(onFirstSave: { args in
                    realmWriteIfAvailable(self.sessionView.realm) { self.sessionView.userState = args }
        })
            // cascadeProperty("viewArguments", )
        }
        set (value) {
            // Do Nothing
        }
    }

    resultSet() /*ResultSet*/ {//TODO
        let x = this.localCache["resultSet"]
        if (x instanceof ResultSet) { return x }

        // Update search result to match the query
        // NOTE: allowed force unwrap
        let resultSet = context!.cache.getResultSet(this.datasource.flattened())
        this.localCache["resultSet"] = resultSet

        // Filter the results
        let ft = userState.get("filterText") ?? ""
        if (resultSet.filterText != ft) {
            filterText = ft
        }

        return resultSet

    } // TODO: Refactor set when datasource changes ??

    activeRenderer: /*String*/ {//TODO
        /*get {
            if (let userState = sessionView.userState) {
                if (let s:String = userState.get("activeRenderer")) { return s }
            }
            if (let s:String = cascadeProperty("defaultRenderer")) { return s }

            debugHistory.error("Exception: Unable to determine the active renderer. Missing defaultRenderer in view?")
            return ""
        }
        set (value) {
            this.localCache.removeValue(forKey: value) // Remove renderConfig reference
            userState.set("activeRenderer", value)
        }*/
    }

/*    backTitle: String? { cascadeProperty("backTitle") }
    searchHint: String { cascadeProperty("searchHint") ?? "" }
    showLabels: Bool { cascadeProperty("showLabels") ?? true }

    actionButton: Action? { cascadeProperty("actionButton") }
    editActionButton: Action? { cascadeProperty("editActionButton") }

    sortFields: [String] { cascadeList("sortFields") }
    editButtons: [Action] { cascadeList("editButtons") }
    filterButtons: [Action] { cascadeList("filterButtons") }
    actionItems: [Action] { cascadeList("actionItems") }
    navigateItems: [Action] { cascadeList("navigateItems") }
    contextButtons: [Action] { cascadeList("contextButtons") }*/

    context;

    renderConfig()/*: CascadingRenderConfig?*/ {
        let x = this.localCache[activeRenderer]
        if (x instanceof CascadingRenderConfig) { return x }

        /*var stack = this.cascadeStack.compactMap {
            ($0["renderDefinitions"] instanceof [CVUParsedRendererDefinition] ?? [])
                .filter { $0.name == activeRenderer }.first
        }*/

        let renderDSLDefinitions = this.context!.views
            .fetchDefinitions(activeRenderer, "renderer")

        for (let def of renderDSLDefinitions) {
            try {
                let parsedRenderDef = this.context?.views.parseDefinition(def)
                if (parsedRenderDef instanceof CVUParsedRendererDefinition) {
                    if (parsedRenderDef.domain == "user") {
                        /*let insertPoint:Int = {
                            for i in 0..<stack.count { if (stack[i].domain == "view") { return i } }
                            return stack.count
                        }()*/

                        stack.splice(insertPoint, 0, parsedRenderDef)
                    }
                    else {
                        stack.push(parsedRenderDef)
                    }
                }
                else {
                    // TODO Error logging
                    // debugHistory.error("Exception: Unable to cascade render config")
                }
            }
            catch (error) {
                // TODO Error logging
                debugHistory.error("\(error)")
            }
        }

        let RenderConfigType = allRenderers.allConfigTypes[activeRenderer]
        if (allRenderers && RenderConfigType) {
            let renderConfig = RenderConfigType.init(stack, this.viewArguments)
            // Not actively preventing conflicts in namespace - assuming chance to be low
            this.localCache[activeRenderer] = renderConfig
            return renderConfig
        }
        else {
            // TODO Error Logging
            // debugHistory.error("Exception: Unable to cascade render config")
            return CascadingRenderConfig([], ViewArguments())
        }
    }

    _emptyResultTextTemp = null
    emptyResultText()/*: String*/ {
        /*get {
            return _emptyResultTextTemp ?? cascadeProperty("emptyResultText") ?? "No items found"
        }
        set (newEmptyResultText) {
            if newEmptyResultText == "" { _emptyResultTextTemp = nil }
            else { _emptyResultTextTemp = newEmptyResultText }
        }*/
    }

    _titleTemp = null
    title()/*: String*/ {
        /*get {
            return _titleTemp ?? cascadeProperty("title") ?? ""
        }
        set (newTitle) {
            if newTitle == "" { _titleTemp = nil }
            else { _titleTemp = newTitle }
        }*/
    }

    _subtitleTemp = null
    subtitle()/*: String*/ {
        /*get {
            return _subtitleTemp ?? cascadeProperty("subtitle") ?? ""
        }
        set (newSubtitle) {
            if newSubtitle == "" { _subtitleTemp = nil }
            else { _subtitleTemp = newSubtitle }
        }*/
    }

    filterText()/*: String*/ {
        /*get {
            return userState.get("filterText") ?? ""
        }*/
        set (newFilter) {
            // Don't update the filter when it's already set
            if (newFilter.count > 0 && _titleTemp != nil &&
                userState.get("filterText")  == newFilter) {
                return
            }

            // Store the new value
            if (userState.get("filterText") ?? "") != newFilter {
                userState.set("filterText", newFilter)
            }

            // If this is a multi item result set
            if (self.resultSet.isList) {

                // TODO we should probably ask the renderer if (this is preferred
                // Some renderers such as the charts would probably rather highlight the
                // found results instead of filtering the other data points out

                // Filter the result set
                self.resultSet.filterText = newFilter
            }
            else {
                print("Warn: Filtering for single items not Implemented Yet!")
            }

            if (userState.get("filterText") == "") {
                title = ""
                subtitle = ""
                emptyResultText = ""
            }
            else {
                // Set the title to an appropriate message
                if (resultSet.count == 0) { title = "No results" }
                else if (resultSet.count == 1) { title = "1 item found" }
                else { title = "\(resultSet.count) items found" }

                // Temporarily hide the subtitle
                // subtitle = " " // TODO how to clear the subtitle ??

                emptyResultText = "No results found using '\(userState.get("filterText") ?? "")'"
            }
        }
    }

    searchMatchText()/*: String*/ {
        get() {
            return userState.get("searchMatchText") ?? ""
        }
        set(newValue) {
            userState.set("searchMatchText", newValue)
        }
    }



    constructor(sessionView,
                cascadeStack
    ) {
        super(cascadeStack, ViewArguments())
        this.sessionView = sessionView
    }

    subscript(propName) {
        function get() {
            switch (propName) {
            case "name": return name
            case "sessionView": return sessionView
            case "datasource": return datasource
            case "userState": return userState
            case "viewArguments": return viewArguments
            case "resultSet": return resultSet
            case "activeRenderer": return activeRenderer
            case "backTitle": return backTitle
            case "searchHint": return searchHint
            case "showLabels": return showLabels
            case "actionButton": return actionButton
            case "editActionButton": return editActionButton
            case "sortFields": return sortFields
            case "editButtons": return editButtons
            case "filterButtons": return filterButtons
            case "actionItems": return actionItems
            case "navigateItems": return navigateItems
            case "contextButtons": return contextButtons
            case "renderConfig": return renderConfig
            case "emptyResultText": return emptyResultText
            case "title": return title
            case "subtitle": return subtitle
            case "filterText": return filterText
            default: return nil
            }
        }
        function set (value) {
            switch (propName) {
                case "activeRenderer": activeRenderer = value instanceof String ?? ""; break
                case "emptyResultText": emptyResultText = value instanceof String ?? ""; break
                case "title": title = value instanceof String ?? ""; break
                case "subtitle": subtitle = value instanceof String ?? ""; break
                case "filterText": filterText = value instanceof String ?? ""; break
                default: return
            }
        }
    }

    fromSessionView(sessionView, context) {
        var cascadeStack = []
        var isList = true
        var type = ""

        // Fetch query from the view from session
        let datasource = sessionView.datasource
        if (datasource) {

            // Look up the associated result set
            let resultSet = context.cache.getResultSet(datasource)

            // Determine whether this is a list or a single item resultset
            isList = resultSet.isList

            // Fetch the type of the results
            let determinedType = resultSet.determinedType
            if (determinedType) {
                type = determinedType
            }
            else {
                throw "Exception: ResultSet does not know the type of its data"
            }
        }
        else {
            throw "Exception: Cannot compute a view without a query to fetch data"
        }

        var needles
        if (type != "mixed") {
            // Determine query
            needles = [
                isList ? "\(type)[]" : "\(type)", // TODO if (this is not found it should get the default template
                isList ? "*[]" : "*"
            ]
        }
        else {
            needles = [isList ? "*[]" : "*"]
        }

        var activeRenderer = null

        function parse(def, domain) {
            try {
                if (!def) {
                    throw "Exception: missing view definition"
                }

                let parsedDef = this.context.views.parseDefinition(def)
                if (parsedDef) {
                    parsedDef.domain = domain

                    let d = parsedDef["defaultRenderer"]
                    if (activeRenderer == null && d) {
                        if (d instanceof String) { activeRenderer = d }
                        else {
                            // TODO ERror logging
                            debugHistory.error("Could not fnd default renderer")
                        }
                    }

                    cascadeStack.push(parsedDef)
                }
                else {
                    // TODO Error logging
                    debugHistory.error("Could not parse definition")
                }
            }
            catch (error) {
                // TODO Error logging
                if (error instanceof CVUParseErrors) {
                    debugHistory.error(`${error.toString(def?.definition ?? "")}`)
                }
                else {
                    debugHistory.error(`${error}`)
                }
            }
        }

        // Find views based on datatype
        for (var key of ["user", "session", "defaults"]) {
            if (key == "session") {
                parse(sessionView.viewDefinition, key)
                continue
            }

            for (var needle of needles) {
                let sessionViewDef = this.context.views
                    .fetchDefinitions(needle, key).first
                if (sessionViewDef) {

                    parse(sessionViewDef, key)
                }
                else if (key != "user") {
                    // TODO Warn logging
                    debugHistory.warn(`Could not find definition for '${needle}' in domain '${key}'`)
                    console.log(`Could not find definition for '${needle}' in domain '${key}'`)
                }
            }
        }

        if (activeRenderer == null) {
            // TODO Error Logging
            throw "Exception: could not determine the active renderer for this view"
        }

        // Create a new view
        let c = new CascadingView(sessionView, cascadeStack)
        c.context = this.context
        return c
    }
}
