//
//  ComputedView.swift
//  memri
//
//  Created by Koen van der Veen on 29/04/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {Cascadable} from "./Cascadable";
import {UserState, ViewArguments} from "./UserState";
import {CVUParsedRendererDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {Expression} from "../../parsers/expression-parser/Expression";

class CascadingView extends Cascadable/*, ObservableObject*/ {//TODO

    /// The name of the cascading view
    get name() { return this.sessionView.name ?? "" } // by copy??

    /// The session view that is being cascaded
    sessionView;

    get datasource() {
        let x = this.localCache["datasource"];
        if (x instanceof CascadingDatasource) { return x }

        let ds = this.sessionView.datasource;
        if (ds) {
            let stack = this.cascadeStack.map (x => {//TODO
                x && x["datasourceDefinition"] instanceof CVUParsedDatasourceDefinition
            })

            let datasource = new CascadingDatasource(stack, this.viewArguments, ds)
            this.localCache["datasource"] = datasource
            return datasource
        }
        else {
            // Missing datasource on sessionview, that should never happen (I think)
            // TODO ERROR REPORTING
            //debugHistory.error("Unexpected state")
            return new CascadingDatasource([], new ViewArguments(), new Datasource())
        }
    }

    get userState() {
        let args = this.sessionView.userState;
        if (args) {
            return args
        }
        try {
            let args = new Cache.createItem(UserState.self, {});//TODO
            this.sessionView.set("userState", args)
            return args
        } catch {
            //debugHistory.error("Exception: Unable to create user state for session view: \(error)")
            return null
        }
    }

    // TODO let this cascade when the use case for it arrises
    get viewArguments() {
        let args = this.sessionView.viewArguments;
        if (args) {
            return args
        }
        try {
            let args = new Cache.createItem(ViewArguments.self, {});//TODO
            this.sessionView.set("viewArguments", args)
            return args
        } catch {
            //debugHistory.error("Exception: Unable to create arguments for session view: \(error)")
            return null
        }
        // cascadeProperty("viewArguments", )
    }

    get resultSet() {
        let x = this.localCache["resultSet"]
        if (x instanceof ResultSet) { return x }

        // Update search result to match the query
        // NOTE: allowed force unwrap
        let resultSet = this.context!.cache.getResultSet(this.datasource.flattened());//TODO
        this.localCache["resultSet"] = resultSet;

        // Filter the results
        let ft = this.userState?.get("filterText") ?? "";
        if (resultSet.filterText != ft) {
            this.filterText = ft;
        }

        return resultSet

    } // TODO: Refactor set when datasource changes ??

    get activeRenderer() {
        let userState = this.sessionView.userState;
        if (userState) {
            let s:string = userState("activeRenderer");
            if (s) { return s }
        }
        let s:string = this.cascadeProperty("defaultRenderer");
        if (s) { return s }

        //debugHistory.error("Exception: Unable to determine the active renderer. Missing defaultRenderer in view?")
        return ""
    }

    set activeRenderer(value) {
        this.localCache[value] = undefined; // Remove renderConfig reference TODO
        this.userState?.set("activeRenderer", value) //TODO:??
    }

    get backTitle() { return this.cascadeProperty("backTitle") }
    get searchHint() { return this.cascadeProperty("searchHint") ?? "" }
    get showLabels() { return this.cascadeProperty("showLabels") ?? true }

    get actionButton() { return this.cascadeProperty("actionButton") }
    get editActionButton() { return this.cascadeProperty("editActionButton") }

    get sortFields() { return this.cascadeList("sortFields") }
    get editButtons() { return this.cascadeList("editButtons") }
    get filterButtons() { return this.cascadeList("filterButtons") }
    get actionItems() { return this.cascadeList("actionItems") }
    get navigateItems() { return this.cascadeList("navigateItems") }
    get contextButtons() { return this.cascadeList("contextButtons") }

    context;

    get renderConfig() {
        let x = this.localCache[this.activeRenderer]
        if (x instanceof CascadingRenderConfig) { return x }
        var stack = [];
        /*var stack = this.cascadeStack.map (x => {
            (x["renderDefinitions"] /!*instanceof [CVUParsedRendererDefinition]*!/ ?? [])
                .filter { $0.name == activeRenderer }.first
        })*///TODO

        let renderDef = this.context?.views
            .fetchDefinitions(this.activeRenderer, "renderer") ?? [];

        let name = this.activeRenderer.split(".")[0];
        if (this.activeRenderer.indexOf(".") > -1 && name)  {
            renderDef.push(this.context?.views
                .fetchDefinitions(/*String(*/name/*)*/, "renderer") ?? [])
        }
        try {
            for (let def of renderDef) {
                let parsedRenderDef = this.context?.views.parseDefinition(def)
                if (parsedRenderDef instanceof CVUParsedRendererDefinition) {
                    if (parsedRenderDef.domain == "user") {
                        let insertPoint = stack.length;
                        for (let i = 0; i < stack.length; i++) {
                            if (stack[i].domain == "view") {
                                insertPoint = i;
                                break;
                            }
                        }
                        stack.splice(insertPoint, 0, parsedRenderDef)
                    } else {
                        stack.push(parsedRenderDef)
                    }
                } else {
                    // TODO Error logging
                    // debugHistory.error("Exception: Unable to cascade render config")
                }
            }

            let RenderConfigType = this.allRenderers.allConfigTypes[this.activeRenderer]
            if (this.allRenderers && RenderConfigType) {
                let renderConfig = RenderConfigType.init(stack, new ViewArguments.clone(this.viewArguments, false)) //TODO:?
                // Not actively preventing conflicts in namespace - assuming chance to be low
                this.localCache[this.activeRenderer] = renderConfig;
                return renderConfig
            } else {
                // TODO Error Logging
                throw "Exception: Unable to cascade render config"
            }

        } catch (error) {
            // TODO Error logging
            debugHistory.error(`${error}`);
        }

        return new CascadingRenderConfig([])//TODO
    }


    _emptyResultTextTemp = null;

    get emptyResultText(){
        return this._emptyResultTextTemp ?? this.cascadeProperty("emptyResultText") ?? "No items found"
    }

    set emptyResultText(newEmptyResultText){
        if (newEmptyResultText == "") { this._emptyResultTextTemp = null }
        else { this._emptyResultTextTemp = newEmptyResultText }
    }

    _titleTemp = null;
    get title() {
        return this._titleTemp ?? this.cascadeProperty("title"/*, String.constructor*/) ?? ""//TODO
    }

    set title(newTitle) {
        if (newTitle == "") { this._titleTemp = null }
        else { this._titleTemp = newTitle }
    }

    _subtitleTemp = null;
    get subtitle() {
        return this._subtitleTemp ?? this.cascadeProperty("subtitle") ?? ""
    }

    set subtitle(newSubtitle) {
        if (newSubtitle == "") { this._subtitleTemp = null }
        else { this._subtitleTemp = newSubtitle }
    }

    get filterText() {
        return this.userState?.get("filterText") ?? ""//TODO:?
    }

    set filterText(newFilter) {
        // Don't update the filter when it's already set
        if (newFilter.length > 0 && this._titleTemp != null &&
            this.userState?.get("filterText") == newFilter) {
            return
        }

        // Store the new value
        if ((this.userState?.get("filterText") ?? "") != newFilter) {
            this.userState?.set("filterText", newFilter)
        }

        // If this is a multi item result set
        if (this.resultSet.isList) {

            // TODO we should probably ask the renderer if this is preferred
            // Some renderers such as the charts would probably rather highlight the
            // found results instead of filtering the other data points out

            // Filter the result set
            this.resultSet.filterText = newFilter
        }
        else {
            console.log("Warn: Filtering for single items not Implemented Yet!")
        }

        if (this.userState?.get("filterText") == "") {
            this.title = ""
            this.subtitle = ""
            this.emptyResultText = ""
        }
        else {
            // Set the title to an appropriate message
            if (this.resultSet.length == 0) { this.title = "No results" }
            else if (this.resultSet.length == 1) { this.title = "1 item found" }
            else { this.title = `${this.resultSet.length} items found` }

            // Temporarily hide the subtitle
            // subtitle = " " // TODO how to clear the subtitle ??

            this.emptyResultText = `No results found using '${this.userState?.get("filterText") ?? ""}'`
        }
    }

    get searchMatchText() {
        return this.userState?.get("searchMatchText") ?? ""
    }

    set searchMatchText(newValue) {
        this.userState?.set("searchMatchText", newValue)
    }

    constructor(sessionView, cascadeStack) {
        super(cascadeStack)
        this.sessionView = sessionView
    }

    subscript(propName) {//TODO:
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

    inherit(source,
            viewArguments: ViewArguments,
            context: MemriContext,
            sessionView: SessionView) {

        var result = source;
        let expr = source;
        if (expr instanceof Expression) {
            result = expr.execute(viewArguments);
        }
        let viewName = result;
        if (typeof viewName == "string") {
            return context.views.fetchDefinitions(viewName)[0];
        } else if (result instanceof SessionView) {
            sessionView.mergeState(result)
            return result.viewDefinition;
        } else if (result instanceof CascadingView) {
            sessionView.mergeState(result.sessionView)
            return result.sessionView.viewDefinition
        }

        return null;
    }

    fromSessionView(sessionView, context) {
        var cascadeStack = []
        var isList = true

        // Fetch query from the view from session
        let datasource = sessionView.datasource
        if (!datasource) {
            throw "Exception: Cannot compute a view without a query to fetch data"

        }

        // Look up the associated result set
        let resultSet = context.cache.getResultSet(datasource)

        // Determine whether this is a list or a single item resultset
        isList = resultSet.isList

        // Fetch the type of the results
        let type = resultSet.determinedType
        if (!type) {
            throw "Exception: ResultSet does not know the type of its data"
        }

        var needles;
        if (type != "mixed") {
            // Determine query
            needles = [
                isList ? `${type}[]` : `${type}`, // TODO if (this is not found it should get the default template
                isList ? "*[]" : "*"
            ]
        }
        else {
            needles = [isList ? "*[]" : "*"]
        }

        var activeRenderer = null;

        function parse(def, domain, self = this) {//TODO:?
            try {
                if (!def) {
                    throw "Exception: missing view definition"
                }

                let parsedDef = self.context.views.parseDefinition(def)
                if (parsedDef) {
                    parsedDef.domain = domain

                    let d = parsedDef["defaultRenderer"]
                    if (activeRenderer == null && d) {
                        activeRenderer = d
                    }

                    if (cascadeStack.indexOf(parsedDef) == -1) {
                        cascadeStack.push(parsedDef);
                        let inheritedView = parsedDef["inherit"]
                        if (inheritedView) {
                            let args = sessionView.viewArguments
                            let view = self.inherit(inheritedView, args, context, sessionView)
                            if (view) {
                                parse(view, domain)
                            } else {
                                throw `Exception: Unable to inherit view from ${inheritedView}`
                            }
                        }
                    }

                }
                else {
                    //debugHistory.error("Could not parse definition")
                }
            } catch (error) {
                if (error instanceof CVUParseErrors) {
                    //debugHistory.error(`${error.toString(def?.definition ?? "")}`)
                } else {
                    //debugHistory.error(`${error}`)
                }
            }
        }

        // Find views based on datatype
        for (var domain of ["user", "session", "defaults"]) {
            if (domain == "session") {
                let viewDef = sessionView.viewDefinition;
                if (viewDef) {
                    parse(viewDef, domain)
                }
                continue
            }

            for (var needle of needles) {
                let def = this.context.views
                    .fetchDefinitions(needle, domain)[0]
                if (def) {
                    parse(def, domain)
                }
                else if (domain != "user") {
                    // TODO Warn logging
                    //debugHistory.warn(`Could not find definition for '${needle}' in domain '${key}'`)
                }
            }
        }

        if (activeRenderer == null) {
            // TODO Error Logging
            throw "Exception: could not determine the active renderer for this view"
        }

        // Create a new view
        let cascadingView = new CascadingView(sessionView, cascadeStack);
        cascadingView.context = this.context;
        return cascadingView
    }
}
