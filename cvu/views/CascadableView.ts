//
//  ComputedView.swift
//  memri
//
//  Created by Koen van der Veen on 29/04/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {Cascadable} from "./Cascadable";
import {CVUParsedDatasourceDefinition, CVUParsedRendererDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {Expression} from "../../parsers/expression-parser/Expression";
import {debugHistory} from "./ViewDebugger";
import {ResultSet} from "../../model/ResultSet";
import {DatabaseController} from "../../model/DatabaseController";
import {CacheMemri} from "../../model/Cache";
import {RootContext} from "../../context/MemriContext";

export class CascadableView extends Cascadable/*, ObservableObject*/ {//TODO
    context?: MemriContext
    session?: Session

    /// The uid of the CVUStateDefinition
    uid: number

    get state() {
        return DatabaseController.read((realm) => {
            return realm.objectForPrimaryKey("CVUStateDefinition", this.uid)
        })
    }

    /// The name of the cascading view
    get name() { return this.cascadeProperty("name") }
    set name(value) { this.setState("name", value) }

    get activeRenderer(): string {
        let s = this.cascadeProperty("defaultRenderer")
        if (s) { return s }
        debugHistory.error("Exception: Unable to determine the active renderer. Missing defaultRenderer in view?")
        return ""
    }

    set activeRenderer(value) {
        delete this.localCache[value] // Remove renderConfig reference
        // #warning("TODO: Store value in userstate for other context based on .")
        this.setState("defaultRenderer", value)
    }

    get fullscreen() { return this.viewArguments?.get("fullscreen") ?? this.cascadeProperty("fullscreen") ?? false }
    set fullscreen(value) { this.setState("fullscreen", value) }

    get showToolbar() { return this.viewArguments?.get("showToolbar") ?? this.cascadeProperty("showToolbar") ?? true }
    set showToolbar(value) { this.setState("showToolbar", value) }

    get showSearchbar() { return this.viewArguments?.get("showSearchbar") ?? this.cascadeProperty("showSearchbar") ?? true }
    set showSearchbar(value) { this.setState("showSearchbar", value) }
    // #warning("Implement this in all renderers")
    get readOnly() { return this.viewArguments?.get("readOnly") ?? this.cascadeProperty("readOnly") ?? true }
    set readOnly(value) { this.setState("readOnly", value) }

    get backTitle() { return this.cascadeProperty("backTitle") }
    set backTitle(value) { this.setState("backTitle", value) }

    get searchHint() { return this.cascadeProperty("searchHint") ?? "" }
    set searchHint(value) { this.setState("searchHint", value) }

    get actionButton() { return this.cascadeProperty("actionButton") }
    set actionButton(value) { this.setState("actionButton", value) }

    get editActionButton() { return this.cascadeProperty("editActionButton") }
    set editActionButton(value) { this.setState("editActionButton", value) }

    get sortFields() { return this.cascadeList("sortFields") }
    set sortFields(value) { this.setState("sortFields", value) }

    // get editButtons() { return this.cascadeList("editButtons") }
    // set editButtons(value) { this.setState("editButtons", value) }

    get filterButtons() { return this.cascadeList("filterButtons") }
    set filterButtons(value) { this.setState("filterButtons", value) }

    get showLabels() { return this.cascadeProperty("showLabels") ?? true }
    set showLabels(value) { this.setState("showLabels", value) }

    get actionItems() { return this.cascadeList("actionItems") }
    set actionItems(value) { this.setState("actionItems", value) }

    get navigateItems() { return this.cascadeList("navigateItems") }
    set navigateItems(value) { this.setState("navigateItems", value) }

    get contextButtons() { return this.cascadeList("contextButtons") }
    set contextButtons(value) { this.setState("contextButtons", value) }

    get datasource() {
        return this.cascadeContext("datasource", "datasourceDefinition", CVUParsedDatasourceDefinition)
    }

    /*get datasource() {
        let x = this.localCache["datasource"];
        if (x instanceof CascadingDatasource) { return x }

        let ds = this.sessionView.datasource;
        if (ds) {
            let stack = this.cascadeStack.map (x => {//TODO
                if (x && x["datasourceDefinition"] instanceof CVUParsedDatasourceDefinition)
                    return x
            })

            let datasource = new CascadingDatasource(stack, this.viewArguments, ds)
            this.localCache["datasource"] = datasource
            return datasource
        }
        else {
            // Missing datasource on sessionview, that should never happen (I think)
            // TODO ERROR REPORTING
            debugHistory.error("Unexpected state")
            return new CascadingDatasource([], null, new Datasource())
        }
    }*/

    get contextPane() {
        return this.cascadeContext("contextPane", "contextPane", CVUParsedObjectDefinition)
    }

    get userState() {
        return this.cascadeContext("userState", "userState", CVUParsedObjectDefinition)
    }

    set userState(value) {
        this.setState("userState", value.head)
    }

    get viewArguments() {
        return this.cascadeContext("viewArguments", "viewArguments", CVUParsedObjectDefinition)
    }

    set viewArguments(value) {
        this.setState("viewArguments", value?.head)
    }

    get resultSet() {
        let x = this.localCache["resultSet"]
        if (x instanceof ResultSet) { return x }

        // Update search result to match the query
        // NOTE: allowed force unwrap
        let resultSet = {}//this.context!.cache.getResultSet(this.datasource.flattened());//TODO
        this.localCache["resultSet"] = resultSet;//TODO

        // Filter the results
        let ft = this.userState.get("filterText") ?? "";
        if (resultSet.filterText != ft) {
            this.filterText = ft;
        }

        return resultSet

    } // TODO: Refactor set when datasource changes ??

    insertRenderDefs(tail: CVUParsedRendererDefinition[]) {
        var renderDef: CVUStoredDefinition[] = this.context?.views
            .fetchDefinitions(this.activeRenderer, "renderer") ?? []

        if (this.activeRenderer.includes(".")) {
            let name = this.activeRenderer.split(".")[0]
            if (name) {
                renderDef.push(this.context?.views
                    .fetchDefinitions(String(name), "renderer") ?? [])
            }
        }



        try {
            for (var def of renderDef) {
                let parsedRenderDef = this.context?.views.parseDefinition(def)
                if (parsedRenderDef instanceof CVUParsedRendererDefinition) {
                    if (parsedRenderDef.domain == "user") {
                        let insertPoint = function(): number {
                            for (let i in tail) { if (tail[i].domain == "view") { return i } }
                            return tail.length
                        }()

                        tail.splice(insertPoint, 0, parsedRenderDef)
                    } else {
                        tail.push(parsedRenderDef)
                    }
                } else {
                    // TODO: Error logging
                    debugHistory.warn("Exception: Unable to cascade render config")
                }
            }
        } catch (error) {
            // TODO: Error logging
            debugHistory.error(`${error}`)
        }
    }

    get renderConfig(): CascadingRenderConfig {
        let x = this.localCache[this.activeRenderer]
        if (x instanceof CascadingRenderConfig) { return x }

        let getConfig = function(a: CVUParsedDefinition) {
            let definitions = (a["rendererDefinitions"] ?? [])
            // Prefer a perfectly matched definition
            return definitions.find((item) => item.name == this.activeRenderer )
                // Else get the one from the parent renderer
                ?? definitions.find((item) => item.name == this.activeRenderer.components(".").pop().join("."))
        }.bind(this)

        let head = getConfig(this.head) ?? function(){
            let head = new CVUParsedRendererDefinition(`[renderer = ${this.activeRenderer}]`)
            this.head["rendererDefinitions"] = [head]
            return head
        }.bind(this)()

        var tail: CVUParsedRendererDefinition[] = this.tail.map((item) => getConfig(item) )

        this.insertRenderDefs(tail)

        let all = this.allRenderers
        let RenderConfigType

        if (all) {
            RenderConfigType = all.allConfigTypes[this.activeRenderer]
        }

        if (all && RenderConfigType) {
            // swiftformat:disable:next redundantInit
            let renderConfig = RenderConfigType.init(head, tail, this.host)
            // Not actively preventing conflicts in namespace - assuming chance to be low
            this.localCache[this.activeRenderer] = renderConfig
            return renderConfig
        } else {
            // TODO: Error Logging
            debugHistory.error(`Unable to cascade render config for ${this.activeRenderer}`)
        }

        return new CascadingRenderConfig()
    }


    _emptyResultTextTemp?

    get emptyResultText() { return this._emptyResultTextTemp ?? this.cascadeProperty("emptyResultText") ?? "No items found"}
    set emptyResultText(value) { this.setState("emptyResultText", value) }

    _titleTemp?
    get title() { return this._titleTemp ?? this.cascadeProperty("title"/*, String.constructor*/) ?? ""}//TODO
    set title(value) { this.setState("title", value) }

    _subtitleTemp?
    get subtitle() { return this._subtitleTemp ?? this.cascadeProperty("subtitle") ?? "" }
    set subtitle(value) { this.setState("subtitle", value) }

    get filterText() {
        return this.userState?.get("filterText") ?? ""//TODO:?
    }

    set filterText(newFilter) {
        // Don't update the filter when it's already set
        if (newFilter.length > 0 && this._titleTemp != null &&
            this.userState.get("filterText") == newFilter) {
            return
        }

        // Store the new value
        if ((this.userState.get("filterText") ?? "") != newFilter) {
            this.userState.set("filterText", newFilter)
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

        if (this.userState.get("filterText") == "") {
            this._titleTemp
            this._subtitleTemp
            this._emptyResultTextTemp
        } else {
            // Set the title to an appropriate message
            if (this.resultSet.length == 0) { this._titleTemp = "No results" }
            else if (this.resultSet.length == 1) { this._titleTemp = "1 item found" }
            else { this._titleTemp = `${this.resultSet.length} items found` }

            // Temporarily hide the subtitle
            // _subtitleTemp = " " // TODO how to clear the subtitle ??

            this._emptyResultTextTemp = `No results found using '${this.userState.get("filterText") ?? ""}'`
        }
    }

    get searchMatchText() { return this.userState.get("searchMatchText") ?? "" }
    set searchMatchText(newValue) { this.userState.set("searchMatchText", newValue) }

    constructor(state: CVUStateDefinition, session: Session) {
        let uid = state.uid.value

        if (!uid) {
            throw "CVU state object is unmanaged"
        }

        let context = session.context

        let head = context?.views.parseDefinition(state)
        if (!head) {
            throw "Could not parse state"
        }

        super(head, [])

        this.uid = uid
        this.session = session
        this.context = context
    }

    /*constructor(
        head?: CVUParsedDefinition,
        tail?: CVUParsedDefinition[],
        host?: Cascadable
    ) {
        this.uid = -1000000
        super(head, tail, host)
    }*/

    getSubscript(propName) {
        switch (propName) {
            case "name": return name
            case "datasource": return this.datasource
            case "contextPane": return this.userState
            case "userState": return this.userState
            case "viewArguments": return this.viewArguments
            case "resultSet": return this.resultSet
            case "activeRenderer": return this.activeRenderer
            case "backTitle": return this.backTitle
            case "searchHint": return this.searchHint
            case "actionButton": return this.actionButton
            case "editActionButton": return this.editActionButton
            case "sortFields": return this.sortFields
            case "filterButtons": return this.filterButtons
            case "contextButtons": return this.contextButtons
            case "renderConfig": return this.renderConfig
            case "emptyResultText": return this.emptyResultText
            case "title": return this.title
            case "subtitle": return this.subtitle
            case "filterText": return this.filterText
            case "searchMatchText": return this.searchMatchText
            default: return null
        }
    }

    setSubscript (propName, value) {
        switch (propName) {
            case "name": this.name = String(value) ?? ""; break
            // case "datasource": this.datasource = value; break
            // case "contextPane": this.userState = String(value) ?? ""; break
            // case "userState": this.userState = String(value) ?? ""; break
            // case "viewArguments": this.viewArguments = String(value) ?? ""; break
            case "activeRenderer": this.activeRenderer = String(value) ?? ""; break
            case "backTitle": this.backTitle = String(value) ?? ""; break
            case "searchHint": this.searchHint = String(value) ?? ""; break
            // case "actionButton": this.actionButton = value; break
            // case "editActionButton": this.editActionButton = value; break
            case "sortFields": this.sortFields = value ?? []; break
            // case "filterButtons": this.filterButtons = String(value) ?? ""; break
            case "contextButtons": this.contextButtons = value ?? []; break
            // case "renderConfig": this.renderConfig = String(value) ?? ""; break
            case "emptyResultText": this.emptyResultText = String(value) ?? ""; break
            case "title": this.title = String(value) ?? ""; break
            case "subtitle": this.subtitle = String(value) ?? ""; break
            case "filterText": this.filterText = String(value) ?? ""; break
            case "searchMatchText": this.searchMatchText = String(value) ?? ""; break
            default:
                // Do nothing
                debugHistory.warn(`Unable to set property: ${propName}`)
                return
        }
    }

    setState(propName: string, value?) {
        super.setState(propName, value)
        this.schedulePersist()
    }

    schedulePersist() {
        this.session?.sessions?.schedulePersist()
    }

    persist() {
        DatabaseController.tryWriteSync((realm) => {
            var state = realm.object(CVUStateDefinition.self, this.uid)
            if (state == undefined) {
                debugHistory.warn("Could not find stored view CVU. Creating a new one.")

                state = CacheMemri.createItem(CVUStateDefinition)

                let stateUID = state?.uid.value

                if (stateUID) {
                    throw "Exception: could not create stored definition"
                }

                this.uid = stateUID
            }

            state?.set("definition", this.head.toCVUString(0, "    "))
        })
    }

    cascade() {
        // Reset properties
        this.tail = []
        this.localCache = {}
        this.cascadeStack = []

        // Fetch query from the view from session
        if (this.head["datasourceDefinition"] == undefined) {
            throw "Exception: Cannot compute a view without a query to fetch data"
        }

        // Look up the associated result set
        let resultSet = this.context?.cache.getResultSet(this.datasource.flattened())
        if (!resultSet) {
            throw "Exception: Unable to fetch result set from view"
        }

        // Determine whether this is a list or a single item resultset
        let isList = resultSet.isList

        // Fetch the type of the results
        let type = resultSet.determinedType
        if (!type) {
            throw "Exception: ResultSet does not know the type of its data"
        }

        var needles: string[]
        if (type != "mixed") {
            // Determine query
            needles = [
                isList ? `${type}[]` : `${type}`, // TODO: if this is not found it should get the default template
                isList ? "*[]" : "*",
            ]
        } else {
            needles = [isList ? "*[]" : "*"]
        }

        var activeRenderer

        let include = function(parsedDef: CVUParsedDefinition, domain: string) {
            if (!this.cascadeStack.includes(parsedDef)) {
                // Compile parsed definition to embed state that may change (e.g. currentView)
                parsedDef.compile(this.viewArguments, CVUParsedDefinition.needed)

                // Add to cascade stack
                this.cascadeStack.push(parsedDef)

                let d = parsedDef["defaultRenderer"]
                if (activeRenderer == undefined && d) {
                    activeRenderer = d
                }

                let inheritFrom = parsedDef["inherit"]
                if (inheritFrom) {
                    var result = inheritFrom

                    let expr = inheritFrom
                    if (expr instanceof Expression) {
                        result = expr.execute(this.viewArguments)
                    }

                    let viewName = result
                    if (typeof viewName === "string") {
                        let view = this.context?.views.fetchDefinitions(viewName)[0]
                        if (view) {
                            parse(view, domain)
                        }
                        else {
                            throw `Exception: could not parse view: ${viewName}`
                        }
                    } else if (result instanceof CascadableView) {
                        let parsed = CVUParsedViewDefinition(result.head.parsed)
                        include(parsed, domain)
                    } else {
                        throw `Exception: Unable to inherit view from ${inheritFrom}`
                    }

                    delete parsedDef.parsed?.removeValue["inherit"]
                }
            }
        }.bind(this)

        let parse = function(def?: CVUStoredDefinition, domain: string) {
            try {
                if (!def) {
                    throw "Exception: missing view definition"
                }

                let parsedDef = this.context?.views.parseDefinition(def)
                if (parsedDef) {
                    parsedDef.domain = domain

                    include(parsedDef, domain)
                } else {
                    debugHistory.error("Could not parse definition")
                }
            } catch (error) {
                if (error instanceof CVUParseErrors) {
                    debugHistory.error(`${error.toString(def?.definition ?? "")}`)
                } else {
                    debugHistory.error(`${error}`)
                }
            }
        }.bind(this)

        // Add head to the cascadeStack
        include(this.head, "state")

        // Find views based on datatype
        for (let domain of ["user", "defaults"]) {
            for (let needle in needles) {
                let def = this.context?.views.fetchDefinitions(needle, domain)[0]
                if (def) {
                    parse(def, domain)
                } else if (domain != "user") {
                    debugHistory.warn(`Could not find definition for '${needle}' in domain '${domain}'`)
                }
            }
        }

        if (activeRenderer == undefined) {
            throw "Exception: could not determine the active renderer for this view"
        }

        // TODO is this needed for anything or should the tail property be removed?
        this.tail = this.cascadeStack.pop()
        this.localCache = {} // Reset local cache again since it was filled when we fetched datasource
    }

    reload() {
        this.resultSet.load( (error) => {
            if (error) {
            // TODO: Refactor: Log warning to user
                debugHistory.error(`Exception: could not load result: ${error}`)
            } else {
                // Update the UI
                this.context?.scheduleUIUpdate()
            }
        })
    }

    load(callback) {
        if (this.head["datasourceDefinition"] == undefined) {
            throw "Exception: Missing datasource in view"
        }

        // Look up the associated result set
        let resultSet = this.context?.cache.getResultSet(this.datasource.flattened())
        if (!resultSet) {
            throw "Exception: Unable to fetch result set from view"
        }

        // If we can guess the type of the result based on the query, let's compute the view
        if (resultSet.determinedType != undefined) {
            if (this.context instanceof RootContext) {
                debugHistory.info("Computing view " + (this.name ?? this.state?.selector ?? ""))
            }

            try {
                // Load the cascade list of views
                this.cascade()

                this.resultSet.load((error) => {
                    if (error) {
                        // TODO: Refactor: Log warning to user
                        debugHistory.error(`Exception: could not load result: ${error}`)
                    } else {
                        // Update the UI
                        this.context?.scheduleUIUpdate()
                    }

                    callback(error)
                })
            } catch (error) {
                // TODO: Error handling
                // TODO: User Error handling
                debugHistory.error(`${error}`)
            }
        }
        // Otherwise let's execute the query first to be able to read the type from the data
        else {
            resultSet.load((error) => {
                if (error) {
                    // TODO: Error handling
                    debugHistory.error(`Exception: could not load result: ${error}`)
                } else {
                    this.load(callback)
                }
            })
        }
}
}
