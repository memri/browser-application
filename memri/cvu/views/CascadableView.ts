//
//  ComputedView.swift
//  memri
//
//  Created by Koen van der Veen on 29/04/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {Cascadable} from "./Cascadable";
import {
    CompileScope,
    CVUParsedDatasourceDefinition, CVUParsedDefinition,
    CVUParsedObjectDefinition,
    CVUParsedRendererDefinition, CVUParsedViewDefinition, CVUStateDefinition, Expression, ResultSet, RootContext
} from "../../../router";
import {debugHistory} from "../../../router";
import {DatabaseController} from "../../../router";
import {CacheMemri} from "../../../router";
import {CascadableDict} from "../../../router";
import {CascadingDatasource} from "../../../router";
import {CascadableContextPane} from "../../../router";
import {Renderers} from "../../../router";
import {CascadingRendererConfig} from "../../../router";



export class CascadableView extends Cascadable/*, ObservableObject*/ {
    subscript() {
        //mock function;
    }

    context?: MemriContext
    session?: Session

    /// The uid of the CVUStateDefinition
    uid: number
    loading: boolean;

    constructor(state: CVUStateDefinition, session: Session, host?: Cascadable) {
        if (state instanceof CVUStateDefinition) {
            let uid = state.uid

            if (!uid) {
                throw "CVU state object is unmanaged"
            }

            let context = session.context

            let head = context?.views.parseDefinition(state)
            if (!head) {
                throw "Could not parse state"
            }
            head.domain = "state";
            if (head.definitionType != "view") {
                throw `Wrong type of definition passed: ${head.definitionType}`;
            }

            super(head, [])

            this.uid = uid
            this.session = session
            this.context = context
        } else {
            super(state, session, host)
            this.uid = -1000000
        }
        this.loading = false;
    }

    get state() {
        return DatabaseController.sync(false, (realm) => {
            return realm.objectForPrimaryKey("CVUStateDefinition", this.uid)
        })
    }

    /// The name of the cascading view
    get name() { return this.cascadeProperty("name") }
    set name(value) { this.setState("name", value) }

    get activeRenderer(): string {
        let s = this.cascadeProperty("defaultRenderer")
        if (!s) {
            debugHistory.error("Exception: Unable to determine the active renderer. Missing defaultRenderer in view?")
            return ""
        }
        return s
    }

    set activeRenderer(value) {
        this.setState("defaultRenderer", value)
        if (this.context?.currentRendererController?.rendererTypeName != value) {
            this.context.currentRendererController = this.makeRendererController(value)
        }
    }

    makeRendererController(forRendererType?) {
        let context = this.context;
        if (!context) {
            return
        }
        return new Renderers.rendererTypes[forRendererType ?? this.activeRenderer].makeController(context, this.renderConfig)
    }

    get fullscreen() { return this.viewArguments?.get("fullscreen") ?? this.cascadeProperty("fullscreen") ?? false }
    set fullscreen(value) { this.setState("fullscreen", value) }

    get showToolbar() { return this.viewArguments?.get("showToolbar") ?? this.cascadeProperty("showToolbar") ?? true }
    set showToolbar(value) { this.setState("showToolbar", value) }

    get showBottomBar() { return this.viewArguments?.get("showBottomBar") ?? this.cascadeProperty("showBottomBar") ?? true }
    set showBottomBar(value) { this.setState("showBottomBar", value) }
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

    get titleActionButton() { return this.cascadeProperty("titleActionButton") }
    set titleActionButton(value) { this.setState("titleActionButton", value) }

    get sortFields() { return this.cascadeList("sortFields") }
    set sortFields(value) { this.setState("sortFields", value) }

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

    get datasource(): CascadingDatasource {
        return this.cascadeContext("datasource", "datasourceDefinition", CVUParsedDatasourceDefinition, CascadingDatasource)
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
        return this.cascadeContext("contextPane", "contextPane", CVUParsedObjectDefinition, CascadableContextPane)
    }

    get userState() {
        return this.cascadeContext("userState", "userState", CVUParsedObjectDefinition, CascadableDict)
    }

    set userState(value) {
        this.setState("userState", value.head)
    }

    get viewArguments() {
        return this.cascadeContext("viewArguments", "viewArguments", CVUParsedObjectDefinition, CascadableDict)
    }

    set viewArguments(value) {
        this.setState("viewArguments", value?.head)
    }

    get resultSet() {
        let x = this.localCache["resultSet"]
        if (x instanceof ResultSet) { return x }

        // Update search result to match the query
        // NOTE: allowed force unwrap
        let resultSet = this.context!.cache.getResultSet(this.datasource.flattened());//TODO
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
            .fetchDefinitions(null, this.activeRenderer, "renderer") ?? []

        if (this.activeRenderer.includes(".")) {
            let name = this.activeRenderer.split(".")[0]
            if (name) {
                Object.assign(renderDef, this.context?.views
                    .fetchDefinitions(null, String(name), "renderer"))
                /*renderDef.push(this.context?.views
                    .fetchDefinitions(null, String(name), "renderer") ?? [])*/
            }
        }



        try {
            for (var def of renderDef) {
                let parsedRenderDef = this.context?.views.parseDefinition(def)
                if (parsedRenderDef instanceof CVUParsedRendererDefinition) {
                    if (parsedRenderDef.domain == "user") {
                        let insertPoint = function(): number {
                            for (let i=0;i<tail.length; i++) { if (tail[i].domain == "view") { return i } }
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

    get renderConfig(): CascadingRendererConfig {
        let x = this.localCache[this.activeRenderer]
        if (x && x instanceof CascadingRendererConfig) { return x }

        let getConfig = function(a: CVUParsedDefinition) {
            let definitions = (a.get("rendererDefinitions") ?? [])
            // Prefer a perfectly matched definition
            return definitions.find((item) => item.name == this.activeRenderer )
                // Else get the one from the parent renderer
                ?? definitions.find((item) => item.name == this.activeRenderer.split(".").slice(0, -1).join("."))
        }.bind(this)

        let head = getConfig(this.head) ?? function(){
            let head = new CVUParsedRendererDefinition(`[renderer = ${this.activeRenderer}]`)
            this.head.set("rendererDefinitions", [head])
            return head
        }.bind(this)()

        var tail: CVUParsedRendererDefinition[] = this.tail.map((item) => getConfig(item) ).filter((item)=> item != undefined);

        this.insertRenderDefs(tail)

        let rendererType = Renderers.rendererTypes[this.activeRenderer]

        if (rendererType) {
            // swiftformat:disable:next redundantInit
            let renderConfig = rendererType.makeConfig(head, tail, this)
            // Not actively preventing conflicts in namespace - assuming chance to be low
            this.localCache[this.activeRenderer] = renderConfig
            return renderConfig
        } else {
            // TODO: Error Logging
            debugHistory.error(`Unable to cascade render config for ${this.activeRenderer}`)
        }

        return new CascadingRendererConfig()
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
        return this.userState?.get("filterText")
    }

    set filterText(newFilter) {
        let newText = newFilter?.nilIfBlankOrSingleLine;

        // Store the new value
        if (newFilter != this.userState.get("filterText")) {
            this.userState.set("filterText", newFilter)
        }

        // If this is a multi item result set
        if (this.resultSet.isList) {
            // TODO we should probably ask the renderer if this is preferred
            // Some renderers such as the charts would probably rather highlight the
            // found results instead of filtering the other data points out

            // Filter the result set
            this.resultSet.filterText = newFilter ?? ""
        }
        else {
            // MARK: Single item
            // Let the renderer handle it if it can
            this.context?.scheduleUIUpdate()
        }

        let filterText = this.userState.get("filterText")?.nilIfBlankOrSingleLine;

        if (filterText) {
            // Set the title to an appropriate message
            if (this.resultSet.count == 0) { this._titleTemp = "No results" }
            else if (this.resultSet.count == 1) { this._titleTemp = "1 item found" }
            else { this._titleTemp = `${this.resultSet.count} items found` }

            // Temporarily hide the subtitle
            // _subtitleTemp = " " // TODO how to clear the subtitle ??

            this._emptyResultTextTemp = `No results found using '${this.filterText}'`
        } else {
            this._titleTemp = undefined
            this._subtitleTemp = undefined
            this._emptyResultTextTemp = undefined
        }
        //TODO: rerender React state @mkslanc
        this.context.scheduleUIUpdate(true);
    }

    get searchMatchText() { return this.userState.get("searchMatchText") ?? "" }
    set searchMatchText(newValue) { this.userState.set("searchMatchText", newValue) }

    /*constructor(
        head?: CVUParsedDefinition,
        tail?: CVUParsedDefinition[],
        host?: Cascadable
    ) {
        this.uid = -1000000
        super(head, tail, host)
    }*/

    get (propName) {
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
            case "titleActionButton": return this.titleActionButton
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

    set (propName, value) {
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
        //this.schedulePersist() //TODO://
        this.context?.scheduleUIUpdate();
    }

    schedulePersist() {
        this.session?.sessions?.schedulePersist()
    }

    persist() {
        DatabaseController.trySync(true, (realm) => {
            var state = realm.objectForPrimaryKey("CVUStateDefinition", this.uid)
            if (state == undefined) {
                debugHistory.warn("Could not find stored view CVU. Creating a new one.")

                state = CacheMemri.createItem("CVUStateDefinition")

                let stateUID = state?.uid

                if (!stateUID) {
                    throw "Exception: could not create stored definition"
                }

                this.uid = stateUID
            }

            state?.set("definition", this.head.toCVUString(0, "    "))
        })
    }

    include(parsed: CVUParsedDefinition, domain: string, merge: boolean = false) {
        if (!this.cascadeStack.includes(parsed)) {
            // Compile parsed definition to embed state that may change (e.g. currentView)
            parsed.compile(this.viewArguments, CompileScope.needed) //TODO

            // Add to cascade stack
            this.cascadeStack.push(parsed)
            if (parsed != this.head) { this.tail.push(parsed) }

            let doInherit = (parsed: CVUParsedDefinition) => {
                let inheritFrom = parsed.get("inherit");
                if (inheritFrom) {
                    delete parsed.parsed["inherit"] //TODO:

                    var result = inheritFrom

                    let expr = inheritFrom;
                    if (expr instanceof Expression) {
                        result = expr.execute(this.viewArguments)
                    }

                    let viewName = result;
                    if (typeof viewName == "string") {
                        let view = this.context?.views.fetchDefinitions(undefined, viewName)[0];
                        if (view) {
                            this.parse(view, domain)
                        } else {
                            throw `Exception: could not parse view: ${viewName}`
                        }
                    }
                else if (result instanceof CascadableView) {
                        let view = result;
                            let parsedInclude = new CVUParsedViewDefinition(undefined, undefined, undefined,undefined, "user",view.head.parsed);
                    if (merge) {
                        parsed.mergeValuesWhenNotSet(parsedInclude)
                        doInherit(parsed)
                    }
                    else {
                        this.include(parsedInclude, domain)
                    }
                }
                else {
                        throw `Exception: Unable to inherit view from ${inheritFrom}`
                    }
                }
            }

            doInherit(parsed)
        }
    }

    parse(def: CVUStoredDefinition, domain: string) {
        try {
            if (!def) {
                throw "Exception: missing view definition"
            }
            let parsedDef = this.context?.views.parseDefinition(def);
            if (parsedDef) {
                parsedDef.domain = domain

                let views = parsedDef["viewDefinitions"]
                if (Array.isArray(views) && views[0] instanceof CVUParsedViewDefinition) {
                    let view = views[parsedDef["currentViewIndex"] ?? 0]
                    if (view) {
                        parsedDef = view
                    }
                    else {
                        throw "Unable to find view in named session"
                    }
                }

                this.include(parsedDef, domain)
            } else {
                debugHistory.error("Could not parse definition")
            }
        } catch (error) {
            if (typeof error.toErrorString == "function") {
                debugHistory.error(`${error.toErrorString(def?.definition ?? "")}`)
            } else {
                debugHistory.error(`${error}`)
            }
        }
    }

    cascade(resultSet: ResultSet) {
// Determine whether this is a list or a single item resultset
        let isList = resultSet.isList;

        // Fetch the type of the results
        let type = resultSet.determinedType;
        if (!type) {
            throw "Exception: ResultSet does not know the type of its data"
        }

        var needles
        if (type != "mixed") {
            // Determine query
            needles = [
                isList ? `${type}[]` : `${type}`,
                // TODO: if this is not found it should get the default template
                isList ? "*[]" : "*",
            ]
        }
        else {
            needles = [isList ? "*[]" : "*"]
        }

        // Find views based on datatype
        for (let domain of ["user", "defaults"]) {
            for (let needle of needles) {
                let def = this.context?.views.fetchDefinitions(needle, null, null, null, domain)[0];
                if (def) {
                    this.parse(def, domain)
                } else if (domain != "user") {
                    debugHistory
                        .warn(`Could not find definition for '${needle}' in domain '${domain}'`)
                }
            }
        }

        if (this.activeRenderer == "") {
            throw "Exception: could not determine the active renderer for this view"
        }

        // TODO: is this needed for anything or should the tail property be removed?
        this.tail = []
        Object.assign(this.tail, this.cascadeStack);
        this.tail.shift()
        this.localCache = {} // Reset local cache again since it was filled when we fetched datasource
    }

    reload() {
        this.resultSet.load(true, (error) => {
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
        if (this.loading) {
            return
        }
        this.loading = true

        // Reset properties
        this.tail = []
        this.localCache = {}
        this.cascadeStack = []

        // Load all includes in the stack so that we can make sure there is a datasource defined
        this.include(this.head, "state", true)

        let datasource = this.datasource
        if (datasource.query == undefined) { throw "Exception: Missing datasource in view" }
        this.localCache = {} // Clear cache again to delete the entry for datasource

        // Look up the associated result set
        let resultSet = this.context?.cache.getResultSet(this.datasource.flattened())
        if (!resultSet) {
            throw "Exception: Unable to fetch result set from view"
        }

        if (this.context instanceof RootContext) {
            debugHistory.info("Computing view " + (this.name ?? this.state?.selector ?? ""))
        }

        // If we can guess the type of the result based on the query, let's compute the view
        if (resultSet.determinedType != undefined) {
            try {
                // Load the cascade list of views
                this.cascade(resultSet)

                this.resultSet.load(true, (error) => {
                    if (error) {
                        // TODO: Refactor: Log warning to user
                        debugHistory.error(`Exception: could not load result: ${error}`)
                    } else {
                        // Update the UI
                        this.context?.scheduleUIUpdate()
                    }

                    this.loading = false
                    callback(error)
                })
            } catch (error) {
                // TODO: Error handling
                // TODO: User Error handling
                debugHistory.error(`${error}`)

                this.loading = false
                callback(error)
            }
        }
        // Otherwise let's execute the query first to be able to read the type from the data
        else {
            resultSet.load(true, (error) => {
                if (error) {
                    // TODO: Error handling
                    debugHistory.error(`Exception: could not load result: ${error}`)
                } else {
                    // Load the cascade list of views
                    this.cascade(resultSet)
                }

                this.loading = false
                callback(error)
            })
        }
}
}
