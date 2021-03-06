//
//  Action.swift
//  Copyright © 2020 memri. All rights reserved.

import {
    CVUParsedObjectDefinition,
    CVUParsedSessionDefinition,
    CVUParsedViewDefinition,
    CVUSerializer, ImporterRun, IndexerRun,
    orderKeys,
    Session
} from "../../../router";
import {Expression} from "../../../router";
import {ActionError} from "../../../router";
import {Color} from "../../../router";
import {debugHistory} from "../../../router";
import {Settings} from "../../../router";
import {Datasource} from "../../../router";
import {CacheMemri} from "../../../router";
import {CVUStateDefinition, EdgeSequencePosition, Item, UUID} from "../../../router";
import {MemriDictionary} from "../../../router";

export class Action/* : HashableClass, CVUToString*/ {
    name = ActionFamily.noop;
    arguments = {};

    get binding() {
        let expr = (this.values["binding"] ?? this.defaultValues["binding"]);
        if (expr instanceof Expression) {
            expr.lookup = this.context.views.lookupValueOfVariables;
            expr.execFunc = this.context.views.executeFunction;
            expr.context = this.context;
            return expr;
        }
        return null;
    };

    get argumentTypes() {
        return (typeof this.defaultValues["argumentTypes"] == "object")? this.defaultValues["argumentTypes"]: {}
    }

    defaultValues = new MemriDictionary();//TODO this should be getter?

    baseValues = new MemriDictionary({
        "icon": "",
        "renderAs": RenderType.button,
        "showTitle": false,
        "opensView": false,
        "color": new Color("#999999"),
        "activeColor": new Color("#ffdb00"),
        "inactiveColor": new Color("#999999"),
        "withAnimation": true
    });

    values = new MemriDictionary();

    context: MemriContext;

    isActive(): boolean {
        let binding = this.binding;
        if (binding) {
            try {
                return binding.isTrue()
            } catch {
                // TODO error handling
                debugHistory.warn(`Could not read boolean value from binding ${binding}`);
            }
        }
        return null;
    }

    get color() {
        let active = this.isActive();
        if (active) {
            if (active) {
                return this.get("activeColor") ?? this.getColor("color") ?? new Color("black")
            } else {
                return this.get("inactiveColor") ?? this.getColor("color") ?? new Color("black")
            }
        } else {
            return this.getColor("color") ?? new Color("black")
        }
    }

    get backgroundColor() {
        let active = this.isActive();
        if (active) {
            if (active) {
                return this.get("activeBackgroundColor") ?? this.getColor("backgrounColor") ?? new Color("clear")
            } else {
                return this.get("inactiveBackgroundColor") ?? this.getColor("backgrounColor") ?? new Color("clear")
            }
        } else {
            return this.getColor("backgroundColor") ?? new Color("clear")
        }
    }

    get toString(): string {
        return this.toCVUString(0, "    ")
    }

    transientUID = UUID()

    constructor(context: MemriContext, name: string, values?) {
        this.context = context;

        //super();//TODO:

        let actionName = ActionFamily[name];
        if (actionName) {
            this.name = actionName
        } else {
            this.name = ActionFamily.noop;
        } // TODO REfactor: Report error to user

        this.values = values ?? new MemriDictionary();
        let x = this.values["renderAs"];
        if (x && typeof x == "string") {
            this.values["renderAs"] = RenderType[x]
        }
    }

    get(key: string, viewArguments = null) {
        let x = this.values[key] ?? this.defaultValues[key] ?? this.baseValues[key];
        let expr = x;
        if (expr instanceof Expression) {
            try {
                expr.lookup = this.context.views.lookupValueOfVariables;
                expr.execFunc = this.context.views.executeFunction;
                expr.context = this.context;

                let value = expr.execForReturnType(viewArguments);
                return value
            } catch (error) {
                debugHistory.error(`Could not execute Action expression: ${error}`)
                // TODO Refactor: Error reporting
                return null;
            }
        }
        return x;
    }

    getBool(key: string, viewArguments = null): boolean {
        let x: boolean = this.get(key, viewArguments) ?? false;
        return x;
    }

    getString(key: string, viewArguments = null): string {
        let x: string = this.get(key, viewArguments) ?? "";
        return x
    }

    getColor(key:string, viewArguments = null) {
        let x = this.get(key, viewArguments);
        return x;
    }

    getRenderAs(viewArguments = null): RenderType {
        let x:RenderType = this.get("renderAs", viewArguments) ?? RenderType.button
        return x;
    }

    getArguments(item?: Item) {
        try { return this.context.buildArguments(this, item) }
        catch (error) {
            debugHistory.warn(`Could not parse arguments for popup: ${error}`)
            return {}
        }
    }

    toCVUString(depth:number, tab:string):string {
        let tabs = tab.repeat(depth + 1);
        let tabsEnd = depth > 0 ? tab.repeat(depth) : "";
        var strBuilder: string[] = [];

        if (Object.keys(this.arguments).length > 0) {
            strBuilder.push(`arguments: ${CVUSerializer.dictToString(this.arguments, depth + 1, tab)}`);
        }
        let value = this.values["binding"];
        if (value instanceof Expression) {
            strBuilder.push(`binding: ${value.toString()}`)
        }

        let keys = orderKeys(this.values, function (k1, k2) {
            if (k1 < k2)
                return 1;
            else if (k1 > k2)
                return -1;
            else
                return 0;
        });/*.keys.sorted(by: { $0 < $1 })*/ //TODO:
        for (let key in keys) {
            let value = this.values[key];
            if (value && value instanceof Expression) {
                strBuilder.push(`${key}: ${value.toString()}`);
            }
            else if (this.values[key]) {
                strBuilder.push(`${key}: ${CVUSerializer.valueToString(value, depth + 1, tab)}`);
            }
            else {
                strBuilder.push(`${key}: null`);
            }
        }

        return strBuilder.length > 0
            ? `${this.name} {\n${tabs}${strBuilder.join(`\n${tabs}`)}\n${tabsEnd}}`
            : `${this.name}`
    }

    execWithoutThrow(exec) {
        try {
            exec()
        } catch (error) {
            debugHistory.error(`Could not execute action: ${error}`);
        }
    }
}

export enum RenderType {
    popup="popup", button="button", emptytype="emptytype"
}

export enum ActionFamily {
    back = "back",
    addItem = "addItem",
    openView = "openView",
    openDynamicView = "openDynamicView",
    openViewByName = "openViewByName",
    openGroup = "openGroup",
    toggleEditMode = "toggleEditMode",
    toggleFilterPanel = "toggleFilterPanel",
    star = "star",
    showStarred = "showStarred",
    showContextPane = "showContextPane",
    showOverlay = "showOverlay",
    share = "share",
    showNavigation = "showNavigation",
    addToPanel = "addToPanel",
    duplicate = "duplicate",
    copyToClipboard = "copyToClipboard",
    schedule = "schedule",
    addToList = "addToList",
    duplicateNote = "duplicateNote",
    noteTimeline = "noteTimeline",
    starredNotes = "starredNotes",
    allNotes = "allNotes",
    exampleUnpack = "exampleUnpack",
    delete = "delete",
    setRenderer = "setRenderer",
    select = "select",
    selectAll = "selectAll",
    unselectAll = "unselectAll",
    showAddLabel = "showAddLabel",
    openLabelView = "openLabelView",
    showSessionSwitcher = "showSessionSwitcher",
    forward = "forward",
    forwardToFront = "forwardToFront",
    backAsSession = "backAsSession",
    openSession = "openSession",
    openSessionByName = "openSessionByName",
    link = "link",
    closePopup = "closePopup",
    unlink = "unlink",
    multiAction = "multiAction",
    noop = "noop",
    runIndexer = "runIndexer",
    runImporter = "runImporter",
    setProperty = "setProperty",
    setSetting = "setSetting"
}

export var getActionType = function (name) {
    switch (name) {
        case ActionFamily.back: return ActionBack;
        case ActionFamily.addItem: return ActionAddItem
        case ActionFamily.openView: return ActionOpenView
        case ActionFamily.openViewByName: return ActionOpenViewByName
        case ActionFamily.openGroup: return ActionOpenViewWithUIDs
        case ActionFamily.toggleEditMode: return ActionToggleEditMode
        case ActionFamily.toggleFilterPanel: return ActionToggleFilterPanel
        case ActionFamily.star: return ActionStar
        case ActionFamily.showStarred: return ActionShowStarred
        case ActionFamily.showContextPane: return ActionShowContextPane
        case ActionFamily.showNavigation: return ActionShowNavigation
        case ActionFamily.duplicate: return ActionDuplicate
        case ActionFamily.schedule: return ActionSchedule
        case ActionFamily.delete: return ActionDelete
        case ActionFamily.showSessionSwitcher: return ActionShowSessionSwitcher
        case ActionFamily.forward: return ActionForward
        case ActionFamily.forwardToFront: return ActionForwardToFront
        case ActionFamily.backAsSession: return ActionBackAsSession
        case ActionFamily.openSession: return ActionOpenSession
        case ActionFamily.openSessionByName: return ActionOpenSessionByName
        case ActionFamily.closePopup: return ActionClosePopup
        case ActionFamily.link: return ActionLink
        case ActionFamily.unlink: return ActionUnlink
        case ActionFamily.multiAction: return ActionMultiAction
        case ActionFamily.runIndexer: return ActionRunIndexer
        case ActionFamily.runImporter: return ActionRunImporter
        case ActionFamily.setProperty: return ActionSetProperty
        case ActionFamily.setSetting: return ActionSetSetting
        case ActionFamily.copyToClipboard: return ActionCopyToClipboard
        case ActionFamily.noop:
        default: return ActionNoop
    }
};

export enum ActionProperties {
    name = "name",
    arguments = "arguments",
    binding = "binding",
    icon = "icon",
    renderAs = "renderAs",
    showTitle = "showTitle",
    opensView = "opensView",
    color = "color",

    backgroundColor = "backgroundColor",
    inactiveColor = "inactiveColor",
    activeBackgroundColor = "activeBackgroundColor",
    inactiveBackgroundColor = "inactiveBackgroundColor",
    title = "title",

    viewName = "viewName", sessionName = "sessionName", view = "view",
    viewArguments = "viewArguments", session = "session", importer = "importer",
    indexer = "indexer", subject = "subject", property = "property",
    value = "value", path = "path", edgeType = "edgeType", distinct = "distinct", all = "all", actions ="actions", item = "item"
}

export var validateActionType = function (key: string, value): boolean {
    if (value instanceof Expression) {
        return true
    }

    let prop = ActionProperties[key];
    switch (prop) {
        case ActionProperties.name:
        case ActionProperties.path: case ActionProperties.property:
        case ActionProperties.edgeType:
        case ActionProperties.viewName:
        case ActionProperties.sessionName:
        case ActionProperties.title:
        case ActionProperties.showTitle:
        case ActionProperties.icon:
            return typeof value == "string";
        case ActionProperties.renderAs:
            return (value instanceof RenderType); //TODO
        case ActionProperties.opensView:
        case ActionProperties.distinct:
        case ActionProperties.all:
            return typeof value == "boolean"
        case ActionProperties.color:
        case ActionProperties.backgroundColor:
        case ActionProperties.inactiveColor:
        case ActionProperties.activeBackgroundColor:
        case ActionProperties.inactiveBackgroundColor:
            return value instanceof Color;
        case ActionProperties.value: return true // AnyObject is always true
        case ActionProperties.subject:
        case ActionProperties.importer:
        case ActionProperties.indexer:
        case ActionProperties.item:
            return value instanceof Item
        case ActionProperties.viewArguments: return value instanceof CVUParsedObjectDefinition || value instanceof MemriDictionary
        case ActionProperties.view: return value instanceof CVUParsedViewDefinition || value instanceof MemriDictionary
        case ActionProperties.session: return value instanceof CVUParsedSessionDefinition || value instanceof MemriDictionary
        case ActionProperties.actions: return Array.isArray(value) /*instanceof [Action]*/ //TODO:
        default:
            return false
    }
}

/*
protocol ActionExec {
    func exec(_ arguments:[String: Any]) throws
}
*/

// TODO: Make this Subscriptable and add to expression docs on the wiki")
export class ActionBack extends Action {
    defaultValues = new MemriDictionary({
        "icon": "chevron_left", //chevron.left
        "opensView": true,
        "color": new Color("#434343"),//TODO
        "inactiveColor": new Color("#434343"),//TODO
        "withAnimation": false
    })

    constructor(context, values?) {
        super(context, "back", values)
    }

    exec() {
        let session = this.context.currentSession;
        if (session) {
            if (session.currentViewIndex == 0) {
                console.log("Warn: Can't go back. Already at earliest view in session");
            } else {
                session.currentViewIndex -= 1
                this.context.scheduleCascadableViewUpdate()
            }
        } else {
            // TODO: Error Handling?
        }
    }

    /*class func exec(_ context:MemriContext, arguments:[String: Any]) throws {
        execWithoutThrow { try ActionBack(context).exec(arguments) }
    }*/
}

export class ActionAddItem extends Action {
    defaultValues = new MemriDictionary({
        "icon": "add",//plus
        "argumentTypes": {"template": "ItemFamily"},//TODO
        "opensView": true,
        "color": new Color("#6aa84f"),
        "inactiveColor": new Color("#434343")
    });

    constructor(context, values = {}) {
        super(context, "addItem", values);
    }

    exec(argumentsJs) {
        let dataItem = argumentsJs["template"]
        if (dataItem instanceof Item) {//TODO
            // Copy template
            //let copy = this.context.cache.duplicate(dataItem);
            // TODO: Test that this creates a unique node")

            // Open view with the now managed copy
            new ActionOpenView(this.context).exec({"item": dataItem});
        } else {
            // TODO Error handling
            // TODO User handling
            throw "Cannot open view, no dataItem passed in arguments"
        }
    }

    /*  class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
          execWithoutThrow { try ActionAddDataItem(context).exec(arguments) }
      }*/
}

export class ActionCopyToClipboard extends Action {
    defaultValues = new MemriDictionary({
        "icon": "doc.on.doc",
        "argumentTypes": {"value": "AnyObject"},
        "opensView": true,
        "color": new Color("#6aa84f"),
            "inactiveColor": new Color("#434343")
    });

    constructor(context: MemriContext, values?) {
        super(context, "copyToClipboard", values);
    }

    exec(argumentsJs) {
        let value = argumentsJs["value"]
        if (typeof value === "string") {
            // UIPasteboard.general.string = value//TODO
        }
        else if (value != undefined) {
            throw "Not implemented yet"
        }
    }

    /*class func exec(_ context: MemriContext, _ arguments: [String: Any?]) throws {
        execWithoutThrow { try ActionCopyToClipboard(context).exec(arguments) }
    }*/
}

export class ActionOpenView extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {
            "item": "ItemFamily",
            "view": "CVUStateDefinition",
            "viewArguments": "ViewArguments"
        },
        "withAnimation": false,
        "opensView": true
    });

    constructor(context: MemriContext, values?) {
        super(context, "openView", values);
    }

    openView(context: MemriContext, view: CVUStateDefinition|Item, argumentsJs = null) {
        if (!(view instanceof CVUStateDefinition)) {
            let item = view;
            let uid = item.uid;
            if (!uid) {
                throw "Uninitialized item"
            }
            // Create a new view
            view = CacheMemri.createItem("CVUStateDefinition", {
                "itemType": "view",
                "selector": "[view]",
                "definition":
`[view] {
    [datasource = pod] {
        query: "${item.genericType} AND uid = ${uid}"
    }
}`,
            })
        }
        let session = context.currentSession;
        if (session) {
            // Add view to session
            session.setCurrentView(view, argumentsJs)
        } else {
            // TODO: Error Handling
            debugHistory.error("No session is active on context")
        }
    }

    exec(argumentsJs) {
        //        let selection = context.cascadingView.userState.get("selection") as? [DataItem]
        let item = argumentsJs["item"] /*instanceof Item;*/
        let viewArguments = argumentsJs["viewArguments"] /*instanceof ViewArguments*/;


        // if let selection = selection, selection.count > 0 { self.openView(context, selection) }
        let sessionView = argumentsJs["view"];
        if (sessionView instanceof CVUStateDefinition) {
            this.openView(this.context, sessionView, viewArguments);
        } else if (item instanceof CVUStateDefinition) {
            this.openView(this.context, item, viewArguments);
        } else if (item) {
            this.openView(this.context, item, viewArguments)
        } else {
            // TODO Error handling
            throw `Cannot execute ActionOpenView, arguments require a view. passed arguments:\n ${argumentsJs}, `;
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionOpenView(context).exec(arguments) }
    }*/
}

export class ActionOpenViewByName extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"viewName": "String", "viewArguments": "ViewArguments"},//TODO
        "withAnimation": false,
        "opensView": true
    });

    constructor(context: MemriContext, values?) {
        super(context, "openViewByName", values);
    }

    exec(argumentsJs: MemriDictionary) {
        let viewArguments = argumentsJs["viewArguments"]/* instanceof ViewArguments*/;
        let name = argumentsJs["viewName"];
        if (typeof name == "string") {
            // Fetch a dynamic view based on its name
            let stored = this.context.views.fetchDefinitions(undefined, name, "view")[0];//TODO?
            if (!stored) {
                throw `No view found with the name ${name}`
            }
            try {
                let view = this.context.views.getViewStateDefinition(stored)
                new ActionOpenView(this.context).openView(this.context, view, viewArguments)
            }
            catch (error) {
                throw `${error} for ${name}`
            }
        } else {
            // TODO Error Handling
            throw "Cannot execute ActionOpenViewByName, no name found in arguments."
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionOpenViewByName(context).exec(arguments) }
    }*/
}

export class ActionOpenViewWithUIDs extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"view": "CVUStateDefinition", "viewArguments": "ViewArguments"},
        "withAnimation": false,
        "opensView": true,
    })

    constructor(context: MemriContext, values?) {
        super(context, "openView", values)
    }

    /*openView(context: MemriContext, view: CVUStateDefinition, argumentsJs = null) {
        let session = context.currentSession
        if (session) {
            // Add view to session
            session.setCurrentView(view, argumentsJs)
        } else {
            // TODO: Error Handling
            debugHistory.error("No session is active on context")
        }
    }*/

    openView(context: MemriContext, itemType: string|CVUStateDefinition, uids: any[], argumentsJs = null) {
        if (typeof itemType == "string") {
            if (!uids.length) { throw "No UIDs specified" }
            let firstUID = uids[0]
            // note that the `IN` selector requires >1 item or it will throw an exception (use `=` if one item)
            let uidQueryString = uids.length > 1 ? `uid IN {${uids.map(($0) => String($0)).join(",")}}` : `uid = ${firstUID}`

            let arrayString = `{${uids.map((item) => String(item)).join(",")}`

            // Create a new view
            itemType = CacheMemri.createItem("CVUStateDefinition", {
                "itemType": "view",
                "selector": "[view]",
                "definition":
                    `[view] {
    [datasource = pod] {
        query: "${itemType} AND ${uidQueryString}"
    }
}`

            })
        }
        // Open the view
        let session = context.currentSession
        if (session) {
            // Add view to session
            session.setCurrentView(itemType, argumentsJs)
        } else {
            // TODO: Error Handling
            debugHistory.error("No session is active on context")
        }
    }

    exec(argumentsJs: MemriDictionary) {
    //        let selection = context.cascadingView.userState.get("selection") as? [Item]
        let uids = argumentsJs["uids"]
        let itemType = argumentsJs["itemType"]
        if (!uids || !itemType) {
            return
        }

        let viewArguments = argumentsJs["viewArguments"]

        this.openView(this.context, itemType, uids, viewArguments)
    }

    /*exec(_ context: MemriContext, _ arguments: [String: Any?]) throws {
        execWithoutThrow { try ActionOpenView(context).exec(arguments) }
    }*/
}

export class ActionToggleEditMode extends Action {
    defaultValues = new MemriDictionary({
        "icon": "edit",//pencil
        "binding": new Expression("currentSession.editMode"),//TODO:
        "activeColor": new Color("#6aa84f"),
        "inactiveColor": new Color("#434343"),
        "withAnimation": false
    })

    constructor(context: MemriContext, values = {}) {
        super(context, "toggleEditMode", values)
    }

    exec(argumentsJs: MemriDictionary) {
        // Do Nothing
    }

    /*class func exec(_ context:MemriContext, _ argumentsJs:[String: Any]) throws {
        execWithoutThrow { try ActionToggleEditMode(context).exec(argumentsJs) }
    }*/
}

export class ActionToggleFilterPanel extends Action {
    defaultValues = new MemriDictionary({
        "icon": "filter_list",//rhombus.fill
        "binding": new Expression("currentSession.showFilterPanel"),//TODO
        "activeColor": new Color("#6aa84f")
    });

    constructor(context: MemriContext, values?) {
        super(context, "toggleFilterPanel", values)
    }

    exec(argumentsJs: MemriDictionary) {
        // Hide Keyboard
        //dismissCurrentResponder()//TODO:?
    }

    /*    class func exec(_ context:MemriContext, _ argumentsJs:[String: Any]) throws {
            execWithoutThrow { try ActionToggleFilterPanel(context).exec(argumentsJs) }
        }*/
}
export class ActionStar extends Action {
    defaultValues = new MemriDictionary({
        "icon": "star",//star.fill
        "binding": new Expression(".starred")//TODO
    });

    constructor(context: MemriContext, values = {}) {
        super(context, "star", values)
    }

    // TODO selection handling for binding
    exec(argumentsJs: MemriDictionary) {
//        if let item = argumentsJs["item"] as? Item {
//            var selection:[DataItem] = context.cascadableView.userState.get("selection") ?? []
//            let toValue = !item.starred
//
//            if !selection.contains(item) {
//                selection.append(item)
//            }
//
//            realmWrite(context.cache.realm, {
//                for item in selection { item.starred = toValue }
//            })
//
//            // TODO if starring is ever allowed in a list resultset view,
//            // it won't be updated as of now
//        }
//        else {
//            // TODO Error handling
//            throw "Cannot execute ActionStar, missing dataItem in argumentsJs."
//        }
    }
/*
    class func exec(_ context:MemriContext, _ argumentsJs:[String: Any]) throws {
        execWithoutThrow { try ActionStar.exec(context, argumentsJs) }
    }*/
}

export class ActionShowStarred extends Action {
    defaultValues = new MemriDictionary({
        "icon": "star", ///star.fill
        "binding": new Expression("view.userState.showStarred"),//TODO
        "opensView": true,
        "activeColor": new Color("#ffdb00"),
        "withAnimation": false
    });

    constructor(context: MemriContext, values?) {
        super(context, "showStarred", values)
    }

    exec(argumentsJs: MemriDictionary) {
        try {
            let binding = this.binding;
            if (binding && !binding.isTrue()) {
                new ActionOpenViewByName(this.context).exec({"viewName": "filter-starred"});
                binding.toggleBool()
            } else {
                // Go back to the previous view
                new ActionBack(this.context).exec({});
            }
        } catch (error) {
            // TODO Error Handling
            throw `Cannot execute ActionShowStarred: ${error}`
        }
    }

    /*class func exec(_ context:MemriContext, _ argumentsJs:[String: Any]) throws {
        execWithoutThrow { try ActionShowStarred(context).exec(argumentsJs) }
    }*/
}

export class ActionShowContextPane extends Action {
    defaultValues = new MemriDictionary({
        "icon": "more_vert",//ellipsis
        "binding": new Expression("currentSession.showContextPane")//TODO
    });

    constructor(context: MemriContext, values = {}) {
        super(context, "showContextPane", values)
    }

    exec(argumentsJs: MemriDictionary) {
        // Hide Keyboard
        //dismissCurrentResponder()//TODO
    }

    /*class func exec(_ context:MemriContext, _ argumentsJs:[String: Any]) throws {
        execWithoutThrow { try ActionShowContextPane(context).exec(argumentsJs) }
    }*/
}

export class ActionShowNavigation extends Action {
    defaultValues = new MemriDictionary({
        "icon": "menu",//line.horizontal.3
        "binding": new Expression("context.showNavigation"),
        "inactiveColor": new Color("#434343"),//TODO:
        "withAnimation": true
    });

    constructor(context: MemriContext, values?) {
        super(context, "showNavigation", values)
    }

    exec(argumentsJs: MemriDictionary) {
        // Hide Keyboard
        //dismissCurrentResponder()//TODO
    }

    /*class func exec(_ context:MemriContext, _ argumentsJs:[String: Any]) throws {
        execWithoutThrow { try ActionShowNavigation.exec(context, argumentsJs) }
    }*/
}
export class ActionSchedule extends Action {
    defaultValues = new MemriDictionary({
        "icon": "alarm"
    });

    constructor(context: MemriContext, values?) {
        super(context, "schedule", values)
    }

    exec(argumentsJs: MemriDictionary) {
//        ActionSchedule.exec(context, arguments:arguments)
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {

    }*/
}

export class ActionShowSessionSwitcher extends Action {
    defaultValues = new MemriDictionary({
        "icon": "more_vert",//ellipsis
        "binding": new Expression("context.showSessionSwitcher"),
        "color": new Color("#CCC")
    })

    constructor(context: MemriContext, values?) {
        super(context, "showSessionSwitcher", values)
    }

    exec(argumentsJs: MemriDictionary) {
//        ActionShowSessionSwitcher.exec(context, arguments:arguments)
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        // Do Nothing
    }*/
}
export class ActionForward extends Action {
    defaultValues = new MemriDictionary({
        "opensView": true,
    });

    constructor(context: MemriContext, values?) {
        super(context, "forward", values)
    }

    exec() {
        let session = this.context.currentSession;
        if (session) {
            if (session.currentViewIndex == session.views.length - 1) {
                console.log("Warn: Can't go forward. Already at last view in session")
            } else {
                session.currentViewIndex += 1
                this.context.scheduleCascadableViewUpdate()
            }
        } else {
            // TODO: Error handling?
        }
    }

   /* class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionForward(context).exec(arguments) }
    }*/
}

export class ActionForwardToFront extends Action {
    defaultValues = new MemriDictionary({
        "opensView": true,
    })

    constructor(context: MemriContext, values?) {
        super(context, "forwardToFront", values)
    }

    exec(argumentsJs: MemriDictionary) {
        let session = this.context.currentSession;
        if (session) {
            session.currentViewIndex = session.views.length - 1
            this.context.scheduleCascadableViewUpdate()
        } else {
            // TODO: Error handling
        }

    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionForwardToFront.exec(context, arguments) }
    }*/
}

export class ActionBackAsSession extends Action {
    defaultValues = new MemriDictionary({
        "opensView": true,
        "withAnimation": false
    })

    constructor(context: MemriContext, values?) {
        super(context, "backAsSession", values)
    }

    exec() {
        let session = this.context.currentSession;
        if (session) {
            if (session.currentViewIndex == 0) {
                throw "Warn: Can't go back. Already at earliest view in session"
            } else {
                let state = session.state
                let copy = this.context.cache.duplicate(state)
                if (state && copy instanceof CVUStateDefinition) {
                    for (var view of session.views) {
                        let state = view.state
                        let viewCopy = this.context.cache.duplicate(state)
                        if (state && viewCopy instanceof CVUStateDefinition) {
                            copy.link(viewCopy, "view", EdgeSequencePosition.last)
                        }
                    }

                    new ActionOpenSession(this.context).exec({"session": copy});
                    new ActionBack(this.context).exec({})
                } else {
                    // TODO Error handling
                    throw new ActionError.Warning("Cannot execute ActionBackAsSession, duplicating currentSession resulted in a different type")
                }
            }
        } else {
            // TODO: Error handling
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionBackAsSession.exec(context, arguments) }
    }*/
}

export class ActionOpenSession extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"session": "CVUStateDefinition", "viewArguments": "ViewArguments"},
        "opensView": true,
        "withAnimation": false
    });

    constructor(context: MemriContext, values?) {
        super(context, "openSession", values)
    }

    openSession(session: CVUStateDefinition|Session, args) {
        let sessions = this.context.sessions

        sessions.setCurrentSession(session)
        sessions.currentSession?.setCurrentView(undefined, args)
    }

//    func openSession(_ context: MemriContext, _ name:String, _ variables:[String:Any]? = nil) throws {
//
//        // TODO: This should not fetch the session from named sessions
//        //       but instead load a sessionview that loads the named sessions by
//        //       computing them (implement viewFromSession that is used in dynamic
//        //       view to sessionview
//
//        // Fetch a dynamic view based on its name
//    }

    /// Adds a view to the history of the currentSession and displays it. If the view was already part of the currentSession.views it
    /// reorders it on top
    exec(argumentsJs: MemriDictionary) {
        let args = argumentsJs["viewArguments"]

        let item = argumentsJs["session"]
        if (item) {
            let session = item;
            if (session instanceof CVUStateDefinition) {
                this.openSession(session, args)
            }
            if (session instanceof Session) {
                this.openSession(session, args)
            }
            else {
                // TODO Error handling
                throw "Cannot execute openSession 'session' argmument cannot be cast to Session"
            }
        }
        else {
            let session = argumentsJs["item"];
            if (session instanceof CVUStateDefinition) {
                this.openSession(session, args);
            }

            // TODO Error handling
            throw "Cannot execute openSession, no session passed"
        }
    }

    /*class func exec(_ context:MemriContext, _ argumentsJs:[String: Any]) throws {
        execWithoutThrow { try ActionOpenSession.exec(context, arguments) }
    }*/
}

// TODO How to deal with viewArguments in sessions
export class ActionOpenSessionByName extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"sessionName": "String", "viewArguments": "ViewArguments"},//TODO:
        "opensView": true,
            "withAnimation": false
    });

    constructor(context: MemriContext, values?) {
        super(context, "openSessionByName", values)
    }

    exec(argumentsJs: MemriDictionary) {
        let viewArguments = argumentsJs["viewArguments"];
        let name = argumentsJs["sessionName"];
        if (typeof name != "string") {
            throw "Cannot execute ActionOpenSessionByName, no name defined in viewArguments";
        }

        try {
            let stored = this.context.views.fetchDefinitions(undefined, name, "session")[0]

            if (!stored) {
                throw `Exception: Cannot open session with name ${name}. Unable to find view.`
            }

            let session = CVUStateDefinition.fromCVUStoredDefinition(stored)

            // Open the view
            new ActionOpenSession(this.context).openSession(session, viewArguments)
        } catch (error) {
            // TODO: Log error, Error handling
            throw `Exception: Cannot open session by name ${name}: ${error}`
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionOpenSessionByName(context).exec(arguments) }
    }*/
}

export class ActionDelete extends Action {
    constructor(context: MemriContext, values?) {
        super(context, "delete", values)
    }

    exec(argumentsJs: MemriDictionary) {
//
//        // TODO this should happen automatically in ResultSet
//        //        self.context.items.remove(atOffsets: indexSet)
//        let indexSet = arguments["indices"] as? IndexSet
//        if let indexSet = indexSet{
//            var items:[DataItem] = []
//            for i in indexSet {
//                let item = context.items[i]
//                items.append(item)
//            }
//        }
        let selection = this.context.currentView?.userState?.get("selection", Item);
        if (selection && selection.length > 0) {
            this.context.cache.delete(selection);
            this.context.scheduleCascadableViewUpdate(true);
        } else {
            let dataItem = argumentsJs["item"];
            if (dataItem instanceof Item) {
                this.context.cache.delete(dataItem);
                this.context.scheduleCascadableViewUpdate(true);
            } else {
                // TODO Erorr handling
            }
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionDelete(context).exec(arguments) }
    }*/
}

export class ActionDeselectAll extends Action {
    constructor(context: MemriContext, values?: MemriDictionary) {
        super(context, "deselectAll", values)
    }

    exec() {
        this.context.setSelection([])
}

    /*class func exec(_ context: MemriContext, _ arguments: [String: Any?]) throws {
        execWithoutThrow { try ActionSelectAll(context).exec(arguments) }
    }*/
}

export class ActionSelectAll extends Action {
    constructor(context: MemriContext, values?: MemriDictionary) {
        super(context, "selectAll", values)
    }

    exec() {
        this.context.setSelection(this.context.items)
    }

    /*class func exec(_ context: MemriContext, _ arguments: [String: Any?]) throws {
        execWithoutThrow { try ActionSelectAll(context).exec(arguments) }
    }*/
}

export class ActionDuplicate extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"item": "ItemFamily"}//TODO MemriDictionary?
    })
    constructor(context: MemriContext, values?) {
        super(context, "duplicate", values);
    }

    exec(argumentsJs: MemriDictionary) {
        let selection: Item[] = this.context.currentView?.userState?.get("selection");
        if (selection && selection.length > 0) {
            selection.forEach(function (item) {
                new ActionAddItem(this.context).exec({"item": item})
            });//TODO:
        } else {
            let item = argumentsJs["item"];
            if (item instanceof Item) {
                new ActionAddItem(this.context).exec({"template": item});
            } else {
                // TODO Error handling
                throw "Cannot execute ActionDuplicate. The user either needs to make a selection, or a dataItem needs to be passed to this call."
            }
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionDuplicate.exec(context, arguments) }
    }*/
}

export class ActionRunImporter extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"importer": "ItemFamily"},
    })

    constructor(context: MemriContext, values?) {
        super(context, "runImporter", values)
    }

    exec(argumentsJs: MemriDictionary) {
        // TODO: parse options
        let run = argumentsJs["importer"];
        if (run instanceof ImporterRun) {

            this.context.cache.isOnRemote(run, 0, (error) => {
                if (error != undefined) {
                    // How to handle??
                    // #warning("Look at this when implementing syncing")
                    debugHistory.error("Polling timeout. All polling services disabled")
                    return
                }

                let uid = run.uid.value
                if (!uid) {
                    debugHistory.error("Item does not have a uid")
                    return
                }
                this.context.cache.sync.schedule()

                this.context.podAPI.runImporter(uid, (error) => {
                    if (error) {
                        console.log(`Cannot execute actionImport: ${error}`)
                    }
                })
            })
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionRunImporter.exec(context, arguments) }
    }*/
}


export class ActionRunIndexer extends Action {
    constructor(context: MemriContext, values?) {
        super(context, "runIndexer", values)
    }

    defaultValues = new MemriDictionary({
        "argumentTypes": {"indexerRun": "IndexerRun"},
    })

    exec(argumentsJs: MemriDictionary) {
        // TODO: parse options
        let run = argumentsJs["indexerRun"]
        if (!(run instanceof IndexerRun)) {
            throw "Exception: no indexer run passed"
        }
        if (run.indexer?.runDestination == "ios") {
            this.runLocal(run)
        } else {
            // First make sure the indexer exists

            //            print("starting IndexerRun with memrID \(memriID)")
            run.set("progress", 0)
            this.context.scheduleUIUpdate()
            // TODO: indexerInstance items should have been automatically created already by now

            this.context.cache.isOnRemote(run, (error) => {
                if (error != undefined) {
                    // How to handle??
                    // #warning("Look at this when implementing syncing")
                    debugHistory.error("Polling timeout. All polling services disabled")
                    return
                }

                let uid = run.uid
                if (!uid) {
                    debugHistory.error("Item does not have a uid")
                    return
                }

                this.context.podAPI.runIndexer(uid, (error) => {
                    if (error == undefined) {
                        // SUCCESS
                    }
                    else {
                        // TODO User Error handling
                        debugHistory.error(`Could not start indexer: ${error ?? ""}`)
                    }
                })
            })
        }
    }

    runLocal(indexerInstance: IndexerRun) {
        let query: string = indexerInstance.indexer?.get("query");
        if (!query) {
            throw `Cannot execute IndexerRun ${indexerInstance}, no query specified`
        }
        let ds = new Datasource(query)

        this.context.cache.query(ds, (result) => {//TODO: something like that?
            if (result) {
                return this.context.indexerAPI.execute(indexerInstance, result)
            }
        });
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionRunIndexer.exec(context, arguments) }
    }*/
}

export class ActionClosePopup extends Action {
    constructor(context: MemriContext, values?) {
        super(context, "closePopup", values)
    }

    exec(argumentsJs: MemriDictionary) {
        this.context.closeLastInStack();
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionClosePopup(context).exec(arguments) }
    }*/
}

export class ActionSetProperty extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"subject": "ItemFamily", "property": "String", "value": "AnyObject"},//TODO
    })

    constructor(context: MemriContext, values?) {
        super(context, "setProperty", values)
    }

    exec(argumentsJs: MemriDictionary) {
        let subject = argumentsJs["subject"];
        if (!(subject instanceof Item)) {
            throw "Exception: subject is not set"
        }

        let propertyName = argumentsJs["property"];
        if (typeof propertyName !== "string") {
            throw "Exception: property is not set to a string"
        }

        subject.set(propertyName, argumentsJs["value"])//TODO

        // TODO: refactor
        ((this.context /*instanceof SubContext*/)?.parent ?? this.context).scheduleUIUpdate()//TODO
    }

    /*class func exec(_ context: MemriContext, _ arguments: [String: Any]) throws {
        execWithoutThrow { try ActionLink(context).exec(arguments) }
    }*/
}

class ActionSetSetting extends Action{
    defaultValues = new MemriDictionary({
        "argumentTypes": {"path": "String", "value": "Any"}
    })

    constructor(context: MemriContext, values?) {
        super(context, "setSetting", values)
    }

    exec(argumentsJs: MemriDictionary) {
        let path = argumentsJs["path"];
        if (typeof path != "string") {
            throw "Exception: missing path to set setting"
        }

        let value = argumentsJs["value"]

        Settings.shared.set(path, value);

        // TODO: refactor
        ((this.context/* instanceof SubContext*/)?.parent ?? this.context).scheduleUIUpdate() //TODO:
    }

    /*class func exec(_ context: MemriContext, _ arguments: [String: Any?]) throws {
        execWithoutThrow { try ActionSetSetting(context).exec(arguments) }
    }*/
}

export class ActionLink extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"subject": "ItemFamily", "edgeType": "String", "distinct": "Bool"}//TODO:
    })

    constructor(context: MemriContext, values?) {
        super(context, "link", values);
    }

    exec(argumentsJs: MemriDictionary) {
        let subject = argumentsJs["subject"];
        if (!(subject instanceof Item)) {
            throw "Exception: subject is not set";
        }

        let edgeType = argumentsJs["edgeType"]
        if (typeof edgeType != "string") {
            throw "Exception: edgeType is not set to a string"
        }

        let selected = argumentsJs["item"];
        if (!(selected instanceof Item)) {
            throw "Exception: selected data item is not passed"
        }

        let distinct = argumentsJs["distinct"] ?? false;

        subject.link(selected,  edgeType, undefined, distinct)

        // TODO refactor
        ((this.context /*instanceof SubContext*/)?.parent ?? this.context).scheduleUIUpdate() //TODO:?
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionLink(context).exec(arguments) }
    }*/
}

export class ActionUnlink extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"subject": "ItemFamily", "edgeType": "String", "all": "Bool"},//TODO
    })

    constructor(context: MemriContext, values?) {
        super(context, "unlink", values)
    }

    exec(argumentsJs: MemriDictionary) {
        let subject = argumentsJs["subject"];
        if (!(subject instanceof Item)) {
            throw "Exception: subject is not set";
        }

        let edgeType = argumentsJs["edgeType"]
        if (typeof edgeType != "string") {
            throw "Exception: edgeType is not set to a string"
        }

        let selected = argumentsJs["item"];
        if (!(selected instanceof Item)) {
            throw "Exception: selected data item is not passed"
        }

        let all = argumentsJs["all"] ?? false

        subject.unlink(selected, edgeType, all)


        // TODO refactor
        ((this.context /*instanceof SubContext*/)?.parent ?? this.context).scheduleUIUpdate() //TODO:?
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionUnlink(context).exec(arguments) }
    }*/
}

export class ActionMultiAction extends Action {
    defaultValues = new MemriDictionary({
        "argumentTypes": {"actions": "[Action]"},//TODO:?
        "opensView": true
    })

    constructor(context: MemriContext, values?) {
        super(context, "multiAction", values)
    }

    exec(argumentsJs) {
        let actions = argumentsJs["actions"];
        if (!(Array.isArray(actions) && actions[0] instanceof Action)) {
            throw "Cannot execute ActionMultiAction: no actions passed in arguments"
        }

        for (let action of actions) {
            this.context.executeAction(action, argumentsJs["item"]);
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionMultiAction(context).exec(arguments) }
    }*/
}

export class ActionNoop extends Action {
    constructor(context: MemriContext, values?) {
        super(context, "noop", values)
    }

    exec(argumentsJs) {
        // do nothing
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionClosePopup(context).exec(arguments) }
    }*/
}

//FilterPanelRendererButton moved from Renderers.ts
export class FilterPanelRendererButton extends Action/*, ActionExec*/ {
    defaults = new MemriDictionary({
        activeColor: new Color("#6aa84f"),
        activeBackgroundColor: new Color("#eee"),
        title: "Unnamed Renderer"
    })

    order
    canDisplayResults
    rendererName

    constructor(context, name, order, title, icon, canDisplayResults){
        super(context, "setRenderer",{icon: icon, title: title})

        this.rendererName = name
        this.order = order
        this.canDisplayResults = canDisplayResults
    }

    /*constructor(context, argumentsJs = null, values = {}) {//TODO
        fatalError("init(argumentsJs:values:) has not been implemented")
    }*/

    isActive() {
        return this.context.currentView?.activeRenderer == this.rendererName
    }

    exec(argumentsJs: MemriDictionary) {
        this.context.currentView.activeRenderer = this.rendererName
        this.context.scheduleUIUpdate(true)/*{ _ in true }*///TODO // scheduleCascadableViewUpdate() // TODO why are userState not kept?
    }
}
