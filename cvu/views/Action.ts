//
//  Action.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

/*extension MemriContext {

private func getDataItem(_ dict:[String:Any], _ dataItem:DataItem?,
        _ viewArguments:ViewArguments? = nil) throws -> DataItem {

        // TODO refactor: move to function
        guard let stringType = dict["type"] as? String else {
            throw "Missing type attribute to indicate the type of the data item"
        }

        guard let family = DataItemFamily(rawValue: stringType) else {
            throw "Cannot find find family \(stringType)"
        }

        guard let ItemType = DataItemFamily.getType(family)() as? Object.Type else {
            throw "Cannot find family \(stringType)"
        }

        var initArgs = dict
        initArgs.removeValue(forKey: "type")

        guard let item = ItemType.init() as? DataItem else {
            throw "Cannot cast type \(ItemType) to DataItem"
        }

        // TODO: fill item
        for prop in item.objectSchema.properties {
            if prop.name != ItemType.primaryKey(),
                let inputValue = initArgs[prop.name] {
                let propValue: Any

                if let expr = inputValue as? Expression {
                    if let v = viewArguments {
                    propValue = try expr.execute(v) as Any
                }
            else {
                    let viewArgs = ViewArguments(cascadingView.viewArguments.asDict())
                    viewArgs.set(".", dataItem)
                    propValue = try expr.execute(viewArgs) as Any
                }
            }
            else {
                    propValue = inputValue
                }

                item.set(prop.name, propValue)
            }
        }

        return item
    }

private func buildArguments(_ action:Action, _ dataItem:DataItem?,
        _ viewArguments:ViewArguments? = nil) throws -> [String: Any] {

        var args = [String: Any]()
        for (argName, inputValue) in action.arguments {
            var argValue: Any?

            // preprocess arg
            if let expr = inputValue as? Expression {
                argValue = try expr.execute(viewArguments ?? cascadingView.viewArguments) as Any
            }
            else {
                argValue = inputValue
            }

            var finalValue:Any? = ""

            // TODO add cases for argValue = DataItem, ViewArgument
            if let dataItem = argValue as? DataItem {
                finalValue = dataItem
            }
            else if let dict = argValue as? [String: Any] {
                if action.argumentTypes[argName] == ViewArguments.self {
                    finalValue = ViewArguments(dict)
                }
                else if action.argumentTypes[argName] == DataItemFamily.self {
                    finalValue = try getDataItem(dict, dataItem, viewArguments)
                }
                else if action.argumentTypes[argName] == SessionView.self {
                    let viewDef = CVUParsedViewDefinition(DataItem.generateUUID())
                    viewDef.parsed = dict

                    finalValue = SessionView(value: ["viewDefinition": viewDef])
                }
                else {
                    throw "Does not recognize argumentType \(argName)"
                }
            }
        else if action.argumentTypes[argName] == Bool.self {
                finalValue = ExprInterpreter.evaluateBoolean(argValue)
            }
            else if action.argumentTypes[argName] == String.self {
                finalValue = ExprInterpreter.evaluateString(argValue)
            }
            else if action.argumentTypes[argName] == Int.self {
                finalValue = ExprInterpreter.evaluateNumber(argValue)
            }
            else if action.argumentTypes[argName] == Double.self {
                finalValue = ExprInterpreter.evaluateNumber(argValue)
            }
            else if action.argumentTypes[argName] == [Action].self {
                finalValue = argValue ?? []
            }
            // TODO are nil values allowed?
            else if argValue == nil {
                finalValue = nil
            }
            else {
                throw "Does not recognize argumentType \(argName):\(action.argumentTypes[argName] ?? Void.self)"
            }

            args[argName] = finalValue
        }

        // Last element of arguments array is the context data item
        args["dataItem"] = dataItem ?? cascadingView.resultSet.singletonItem as Any

        return args
    }

private func executeActionThrows(_ action:Action, with dataItem:DataItem? = nil,
        using viewArguments:ViewArguments? = nil) throws {
        // Build arguments dict
        let args = try buildArguments(action, dataItem, viewArguments)

        // TODO security implications down the line. How can we prevent leakage? Caching needs to be
        //      per context
        action.context = self

        if action.getBool("opensView") {
            let binding = action.binding

            if let action = action as? ActionExec {
                try action.exec(args)

                // Toggle a state value, for instance the starred button in the view (via dataItem.starred)
                if let binding = binding {
                try binding.toggleBool()
            }
        }
        else {
                print("Missing exec for action \(action.name), NOT EXECUTING")
            }
        }
        else {

            // Track state of the action and toggle the state variable
            if let binding = action.binding {
                try binding.toggleBool()

                // TODO this should be removed and fixed more generally
                self.scheduleUIUpdate(immediate: true)
            }

            if let action = action as? ActionExec {
                try action.exec(args)
            }
            else {
                print("Missing exec for action \(action.name), NOT EXECUTING")
            }
        }
    }

    /// Executes the action as described in the action description
public func executeAction(_ action:Action, with dataItem:DataItem? = nil,
        using viewArguments:ViewArguments? = nil) {
        do {
            if action.getBool("withAnimation") {
                try withAnimation {
                    try executeActionThrows(action, with: dataItem, using: viewArguments)
                }
            }
            else {
                try withAnimation(nil) {
                    try executeActionThrows(action, with: dataItem, using: viewArguments)
                }
            }
        }
    catch let error {
            // TODO Log error to the user
            debugHistory.error("\(error)")
        }
    }
public func executeAction(_ actions:[Action], with dataItem:DataItem? = nil,
        using viewArguments:ViewArguments? = nil) {

        for action in actions {
            self.executeAction(action, with: dataItem, using: viewArguments)
        }
    }
}*/

import {CVUSerializer, orderKeys} from "../../parsers/cvu-parser/CVUToString";
import {Expression} from "../../parsers/expression-parser/Expression";
import {ActionError} from "./ActionErrors";
import {CVUParsedSessionDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {Color} from "../../parsers/cvu-parser/CVUParser";

class Action/* : HashableClass, CVUToString*/ {
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

    defaultValues = {};

    baseValues = {
        "icon": "exclamationmark.triangle",
        "renderAs": RenderType.button,
        "showTitle": false,
        "opensView": false,
        "color": new Color("#999999"),//TODO
        "backgroundColor": new Color("white"),//TODO
        "activeColor": new Color("#ffdb00"),//TODO
        "inactiveColor": new Color("#999999"),//TODO
        "activeBackgroundColor": new Color("white"),//TODO
        "inactiveBackgroundColor": new Color("white"),//TODO
        "withAnimation": true
    };

    values = {};

    context;

    isActive(): boolean {
        let binding = this.binding;
        if (binding) {
            try {
                return binding.isTrue()
            } catch {
                // TODO error handling
                //debugHistory.warn(`Could not read boolean value from binding ${binding}`);//TODO:?
            }
        }
        return null;
    }

    get color() {
        let active = this.isActive();
        if (active) {
            if (active) {//TODO:WTF?
                return this.get("activeColor") ?? this.getColor("color")
            } else {
                return this.get("inactiveColor") ?? this.getColor("color")
            }
        } else {
            return this.getColor("color")
        }
    }

    get backgroundColor() {
        let active = this.isActive();
        if (active) {
            if (active) {
                return this.get("activeBackgroundColor") ?? this.getColor("backgroundolor")
            } else {
                return this.get("inactiveBackgroundColor") ?? this.getColor("backgroundolor")
            }
        } else {
            return this.getColor("backgroundColor")
        }
    }

    get description(): string {
        return this.toCVUString(0, "    ")
    }

    constructor(context: MemriContext, name: string, argumentsJs = null, values = {}) {
        this.context = context;

        //super();//TODO:

        let actionName = ActionFamily[name];
        if (actionName) {
            this.name = actionName
        } else {
            this.name = ActionFamily.noop;
        } // TODO REfactor: Report error to user

        this.arguments = argumentsJs ?? this.arguments;
        this.values = values;
        let x = this.values["renderAs"];
        if (typeof x == "string") {
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
                console.log(`ACTION ERROR: ${error}`);
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
        let x = this.get(key, viewArguments) ?? new Color("black");//TODO
        return x;
    }

    getRenderAs(viewArguments = null): RenderType {
        let x:RenderType = this.get("renderAs", viewArguments) ?? RenderType.button
        return x;
    }

    toCVUString(depth:number, tab:string):string {
        let tabs = tab.repeat(depth);
        let tabsEnd = depth > 0 ? tab.repeat(depth - 1) : "";
        var strBuilder: string[] = [];

        if (Object.keys(this.arguments).length > 0) {
            strBuilder.push(`arguments: ${new CVUSerializer().dictToString(this.arguments, depth + 1, tab)}`);
        }
        let value = this.values["binding"];
        if (value instanceof Expression) {
            strBuilder.push(`binding: ${value.toString()}`)
        }

        let keys = orderKeys(this.values, undefined);/*.keys.sorted(by: { $0 < $1 })*/ //TODO:
        for (let key in keys) {
            let value = this.values[key];
            if (value instanceof Expression) {
                strBuilder.push(`${key}: ${value.toString()}`);
            }
            else if (this.values[key]) {
                strBuilder.push(`${key}: ${new CVUSerializer().valueToString(value, depth, tab)}`);
            }
        else {
                strBuilder.push(`${key}: null`);
            }
        }

        return strBuilder.length > 0
            ? `${this.name} {\n${tabs}${strBuilder.join(`\n${tabs}`)}\n${tabsEnd}`
            : `${this.name}`
    }

    execWithoutThrow(exec) {
        try {
            exec()
        } catch (error) {
            //debugHistory.error(`Could not execute action: ${error}`);
        }
    }
}

enum RenderType {
    popup, button, emptytype
}

export enum ActionFamily {
    back, addItem, openView, openDynamicView, openViewByName, toggleEditMode, toggleFilterPanel,
    star, showStarred, showContextPane, showOverlay, share, showNavigation, addToPanel, duplicate,
    schedule, addToList, duplicateNote, noteTimeline, starredNotes, allNotes, exampleUnpack,
    delete, setRenderer, select, selectAll, unselectAll, showAddLabel, openLabelView,
    showSessionSwitcher, forward, forwardToFront, backAsSession, openSession, openSessionByName,
    link, closePopup, unlink, multiAction, noop, runIndexerInstance, runImporterInstance,
    setProperty

    /*func getType() -> Action.Type {
        switch self {
            case .back: return ActionBack.self
            case .addDataItem: return ActionAddDataItem.self
            case .openView: return ActionOpenView.self
            case .openViewByName: return ActionOpenViewByName.self
            case .toggleEditMode: return ActionToggleEditMode.self
            case .toggleFilterPanel: return ActionToggleFilterPanel.self
            case .star: return ActionStar.self
            case .showStarred: return ActionShowStarred.self
            case .showContextPane: return ActionShowContextPane.self
            case .showNavigation: return ActionShowNavigation.self
            case .duplicate: return ActionDuplicate.self
            case .schedule: return ActionSchedule.self
            case .delete: return ActionDelete.self
            case .showSessionSwitcher: return ActionShowSessionSwitcher.self
            case .forward: return ActionForward.self
            case .forwardToFront: return ActionForwardToFront.self
            case .backAsSession: return ActionBackAsSession.self
            case .openSession: return ActionOpenSession.self
            case .openSessionByName: return ActionOpenSessionByName.self
            case .closePopup: return ActionClosePopup.self
            case .link: return ActionLink.self
            case .unlink: return ActionUnlink.self
            case .multiAction: return ActionMultiAction.self
            case .noop: fallthrough
            default: return ActionNoop.self
        }
    }*/
}

export var getActionType = function (name) {
    switch (name) {
        case ActionFamily.back: return ActionBack;
        case ActionFamily.addItem: return ActionAddItem
        case ActionFamily.openView: return ActionOpenView
        case ActionFamily.openViewByName: return ActionOpenViewByName
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
        case ActionFamily.runIndexerInstance: return ActionRunIndexerInstance
        case ActionFamily.runImporterInstance: return ActionRunImporterInstance
        case ActionFamily.setProperty: return ActionSetProperty
        case ActionFamily.noop:
        default: return ActionNoop
    }
};

enum ActionProperties {
    name, arguments, binding, icon, renderAs, showTitle, opensView, color,
    backgroundColor, inactiveColor, activeBackgroundColor, inactiveBackgroundColor, title

    /*func validate(_ key:String, _ value:Any?) -> Bool {
        if value is Expression { return true }

        let prop = ActionProperties(rawValue: key)
        switch prop {
            case .name: return value is String
            case .arguments: return value is [Any?] // TODO do better by implementing something similar to executeAction
            case .renderAs: return value is RenderType
            case .title, .showTitle, .icon: return value is String
            case .opensView: return value is Bool
            case .color, .backgroundColor, .inactiveColor, .activeBackgroundColor, .inactiveBackgroundColor:
                return value is Color
            default: return false
        }
    }*/
}

/*
protocol ActionExec {
    func exec(_ arguments:[String: Any]) throws
}
*/

class ActionBack extends Action {
    defaultValues = {
        "icon": "chevron.left",
        "opensView": true,
        "color": new Color("#434343"),//TODO
        "inactiveColor": new Color("#434343"),//TODO
        "withAnimation": false
    }

    constructor(context, argumentsJs = null, values = {}) {
        super(context, "back", argumentsJs, values)
    }

    exec(argumentsJs) {
        let session = this.context.currentSession;

        if (session.currentViewIndex == 0) {
            console.log("Warn: Can't go back. Already at earliest view in session");
        } else {
            /*realmWriteIfAvailable(this.context.realm, function () {
                session.currentViewIndex -= 1
            });//TODO;*/
            this.context.scheduleCascadingViewUpdate();
        }
    }

    /*class func exec(_ context:MemriContext, arguments:[String: Any]) throws {
        execWithoutThrow { try ActionBack(context).exec(arguments) }
    }*/
}

class ActionAddItem extends Action {
    defaultValues = {
        "icon": "plus",
        "argumentTypes": {"template": ItemFamily.constructor},//TODO
        "opensView": true,
        "color": new Color("#6aa84f"),
        "inactiveColor": new Color("#434343")
    };

    constructor(context, argumentsJs = null, values = {}) {
        super(context, "addItem", argumentsJs, values);
    }

    exec(argumentsJs) {
        let dataItem = argumentsJs["template"]
        if (dataItem instanceof Item) {//TODO
            // Copy template
            let copy = this.context.cache.duplicate(dataItem);

            // Add the new item to the cache
            this.context.cache.addToCache(copy);

            // Open view with the now managed copy
            new ActionOpenView(this.context).exec({"dataItem":copy});//TODO:
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


class ActionOpenView extends Action {
    defaultValues = {
        "argumentTypes": {"view": SessionView.constructor, "viewArguments": ViewArguments.constructor},//TODO
        "withAnimation": false,
        "opensView": true
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "openView", argumentsJs, values);
    }

    openView(context: MemriContext, view: SessionView, argumentsJs = null) {
        let session = context.currentSession;

        // Merge arguments into view
        let dict = argumentsJs?.asDict();
        if (dict) {
            let viewArguments = view.viewArguments;
            if (viewArguments) {
                 view.viewArguments = ViewArguments(Object.assign(viewArguments.asDict(), dict)) //TODO:
            }
        }

        // Add view to session
        session.setCurrentView(view)

        // Set accessed date to now
        view.access();//TODO?

        // Recompute view
        context.updateCascadingView() // scheduleCascadingViewUpdate()
    }

    /*openView(context: MemriContext, item: DataItem, argumentsJs = null) {
        // Create a new view
        let view = new SessionView({
            "datasource": new Datasource({
                // Set the query options to load the item
                "query": `${item.genericType} AND memriID = '${item.memriID}'`
            })
        });

        // Open the view
        this.openView(context, view, argumentsJs);
    }*/ //TODO: totally need to check

    exec(argumentsJs) {
//        let selection = context.cascadingView.userState.get("selection") as? [DataItem]
        let dataItem = argumentsJs["dataItem"] /*instanceof Item;*/
        let viewArguments = argumentsJs["viewArguments"] /*instanceof ViewArguments*/;


        // if let selection = selection, selection.count > 0 { self.openView(context, selection) }
        let sessionView = argumentsJs["view"];
        if (sessionView instanceof SessionView) {
            this.openView(this.context, sessionView, viewArguments);
        } else {
            let item = dataItem;
            if (item instanceof SessionView) {
                this.openView(this.context, item, viewArguments);
            } else if (item) {
                this.openView(this.context, item,
                    viewArguments)
            } else {
                // TODO Error handling
                throw `Cannot execute ActionOpenView, arguments require a SessionView. passed arguments:\n ${argumentsJs}, `;
            }
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionOpenView(context).exec(arguments) }
    }*/
}

class ActionOpenViewByName extends Action {
    defaultValues = {
        "argumentTypes": {"name": String.constructor, "viewArguments": ViewArguments.constructor},//TODO
        "withAnimation": false,
        "opensView": true
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "openViewByName", argumentsJs, values);
    }

    exec(argumentsJs) {
        let viewArguments = argumentsJs["viewArguments"]/* instanceof ViewArguments*/;
        let name = argumentsJs["name"];
        if (typeof name == "string") {
            // Fetch a dynamic view based on its name
            let stored = this.context.views.fetchDefinitions(name, "view")[0];//TODO?
            let parsed = this.context.views.parseDefinition(stored);

            let view = new SessionView().fromCVUDefinition(
                parsed /*instanceof CVUParsedViewDefinition*/,
                stored,
                viewArguments)

            new ActionOpenView(this.context).openView(this.context, view);
        } else {
            // TODO Error Handling
            throw "Cannot execute ActionOpenViewByName, no name found in arguments."
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionOpenViewByName(context).exec(arguments) }
    }*/
}

class ActionToggleEditMode extends Action {
    defaultValues = {
        "icon": "pencil",
        "binding": new Expression("currentSession.editMode"),//TODO:
        "activeColor": new Color("#6aa84f"),
        "inactiveColor": new Color("#434343"),
        "withAnimation": false
    }

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "toggleEditMode", arguments, values)
    }

    exec(argumentsJs) {
        // Do Nothing
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionToggleEditMode(context).exec(arguments) }
    }*/
}

class ActionToggleFilterPanel extends Action {
    defaultValues = {
        "icon": "rhombus.fill",
        "binding": new Expression("currentSession.showFilterPanel"),//TODO
        "activeColor": new Color("#6aa84f")
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "toggleFilterPanel", arguments, values)
    }

    exec(argumentsJs) {
        // Hide Keyboard
        //dismissCurrentResponder()//TODO:?
    }

    /*    class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
            execWithoutThrow { try ActionToggleFilterPanel(context).exec(arguments) }
        }*/
}
class ActionStar extends Action {
    defaultValues = {
        "icon": "star.fill",
        "binding": new Expression("dataItem.starred")//TODO
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "star", argumentsJs, values)
    }

    // TODO selection handling for binding
    exec(argumentsJs) {
//        if let item = arguments["dataItem"] as? DataItem {
//            var selection:[DataItem] = context.cascadingView.userState.get("selection") ?? []
//            let toValue = !item.starred
//
//            if !selection.contains(item) {
//                selection.append(item)
//            }
//
//            realmWriteIfAvailable(context.cache.realm, {
//                for item in selection { item.starred = toValue }
//            })
//
//            // TODO if starring is ever allowed in a list resultset view,
//            // it won't be updated as of now
//        }
//        else {
//            // TODO Error handling
//            throw "Cannot execute ActionStar, missing dataItem in arguments."
//        }
    }
/*
    class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionStar.exec(context, arguments) }
    }*/
}

class ActionShowStarred extends Action {
    defaultValues = {
        "icon": "star.fill",
        "binding": new Expression("view.userState.showStarred"),//TODO
        "opensView": true,
        "activeColor": new Color("#ffdb00"),
        "withAnimation": false
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "showStarred", argumentsJs, values)
    }

    exec(argumentsJs) {
        try {
            let binding = this.binding;
            if (binding && !binding.isTrue()) {
                new ActionOpenViewByName(this.context).exec({"name": "filter-starred"});
                // Open named view 'showStarred'
                // openView("filter-starred", ["stateName": starButton.actionStateName as Any])
            } else {
                // Go back to the previous view
                new ActionBack(this.context).exec({});
            }
        } catch (error) {
            // TODO Error Handling
            throw `Cannot execute ActionShowStarred: ${error}`
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionShowStarred(context).exec(arguments) }
    }*/
}

class ActionShowContextPane extends Action {
    defaultValues = {
        "icon": "ellipsis",
        "binding": new Expression("currentSession.showContextPane")//TODO
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "showContextPane", argumentsJs, values)
    }

    exec(argumentsJs) {
        // Hide Keyboard
        //dismissCurrentResponder()//TODO
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionShowContextPane(context).exec(arguments) }
    }*/
}

class ActionShowNavigation extends Action {
    defaultValues = {
        "icon": "line.horizontal.3",
        "binding": new Expression("context.showNavigation"),
        "inactiveColor": new Color("#434343")//TODO:
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "showNavigation", argumentsJs, values)
    }

    exec(argumentsJs) {
        // Hide Keyboard
        //dismissCurrentResponder()//TODO
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionShowNavigation.exec(context, arguments) }
    }*/
}
class ActionSchedule extends Action {
    defaultValues = {
        "icon": "alarm"
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "schedule", argumentsJs, values)
    }

    exec(argumentsJs) {
//        ActionSchedule.exec(context, arguments:arguments)
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {

    }*/
}

class ActionShowSessionSwitcher extends Action {
    defaultValues = {
        "icon": "ellipsis",
        "binding": new Expression("context.showSessionSwitcher"),
        "color": new Color("#CCC")
    }

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "showSessionSwitcher", argumentsJs, values)
    }

    exec(argumentsJs) {
//        ActionShowSessionSwitcher.exec(context, arguments:arguments)
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        // Do Nothing
    }*/
}
class ActionForward extends Action {
    defaultValues = {
        "opensView": true,
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "forward", argumentsJs, values)
    }

    exec(argumentsJs) {
        let session = this.context.currentSession

        if (session.currentViewIndex == session.views.count - 1) {
            console.log("Warn: Can't go forward. Already at last view in session")
        }
        else {
            //realmWriteIfAvailable(this.context.cache.realm, function () {session.currentViewIndex += 1 });
            this.context.scheduleCascadingViewUpdate()
        }
    }

   /* class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionForward(context).exec(arguments) }
    }*/
}

class ActionForwardToFront extends Action {
    defaultValues = {
        "opensView": true,
    }

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "forwardToFront", argumentsJs, values)
    }

    exec(argumentsJs) {
        let session = this.context.currentSession;
        /*realmWriteIfAvailable(this.context.cache.realm, function () {
            session.currentViewIndex = session.views.count - 1
        });*/
        this.context.scheduleCascadingViewUpdate()
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionForwardToFront.exec(context, arguments) }
    }*/
}

class ActionBackAsSession extends Action {
    defaultValues = {
        "opensView": true,
        "withAnimation": false
    }

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "backAsSession", argumentsJs, values)
    }

    exec(argumentsJs) {
        let session = this.context.currentSession;

        if (session.currentViewIndex == 0) {
            throw "Warn: Can't go back. Already at earliest view in session"
        }
        else {
            let duplicateSession = this.context.cache.duplicate(session);//TODO:
            if (duplicateSession instanceof Session) {
                /*realmWriteIfAvailable(this.context.cache.realm, function (){
                duplicateSession.currentViewIndex -= 1
            });
*/
            new ActionOpenSession(this.context).exec({"session": duplicateSession});
        }
        else {
                // TODO Error handling
                throw new ActionError.Warning("Cannot execute ActionBackAsSession, duplicating currentSession resulted in a different type")
            }
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionBackAsSession.exec(context, arguments) }
    }*/
}

class ActionOpenSession extends Action {
    defaultValues = {
        "argumentTypes": {"session": Session.constructor, "viewArguments": ViewArguments.constructor},//TODO:
        "opensView": true,
            "withAnimation": false
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "openSession", argumentsJs, values)
    }

    openSession(context: MemriContext, session:Session) {
        let sessions = context.sessions // TODO generalize

        // Add view to session and set it as current
        sessions.setCurrentSession(session)

        // Recompute view
        context.scheduleCascadingViewUpdate()
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
    exec(argumentsJs) {
        let item = arguments["session"]
        if (item) {
            let session = item;
            if (session instanceof Session) {
                this.openSession(this.context, session)
            } else {
                // TODO Error handling
                throw "Cannot execute openSession 'session' argmument cannot be casted to Session"
            }
        }
    else {
            let session = arguments["dataItem"];
            if (session instanceof Session) {
                this.openSession(this.context, session);
            }

            // TODO Error handling
            throw "Cannot execute openSession, no session passed"
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionOpenSession.exec(context, arguments) }
    }*/
}

// TODO How to deal with viewArguments in sessions
class ActionOpenSessionByName extends Action {
    defaultValues = {
        "argumentTypes": {"name": String.constructor, "viewArguments": ViewArguments.constructor},//TODO:
        "opensView": true,
            "withAnimation": false
    };

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "openSessionByName", argumentsJs, values)
    }

    exec(argumentsJs) {
        let viewArguments = arguments["viewArguments"] instanceof ViewArguments;
        let name = arguments["name"];
        if (typeof name != "string") {
            throw "Cannot execute ActionOpenSessionByName, no name defined in viewArguments";
        }

        try {
            // Fetch and parse view from the database
            let fromDB = this.context.views
                .parseDefinition(this.context.views.fetchDefinitions(name, "session")[0]);

            // See if this is a session, if so take the last view
            let def = fromDB;
            if (def !instanceof CVUParsedSessionDefinition) {
                // TODO Error handling
                throw `Exception: Cannot open session with name ${name} " +
                "cannot be casted as CVUParsedSessionDefinition`
            }

            let session = new Session();
            let viewDefs = def["viewDefinitions"];
            if (!(Array.isArray(viewDefs) && viewDefs[0] instanceof CVUParsedViewDefinition)) {
                throw `Exception: Session ${name} has no views.`
            }

            var list: SessionView[] = [];

            for (let viewDef of viewDefs) {
                list.push(new SessionView({
                    "viewDefinition": new CVUStoredDefinition(
                        {"definition": viewDef.toCVUString(0, "    ")}
                    ),
                    "viewArguments": viewArguments
                }))
            }

            if (list.length == 0) {
                throw `Exception: Session ${name} has no views.`
            }

            session["views"] = list;

            // Open the view
            new ActionOpenSession(this.context).openSession(this.context, session);
        }
    catch (error) {
            // TODO: Log error, Error handling
            throw `Exception: Cannot open session by name ${name}: ${error}`
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionOpenSessionByName(context).exec(arguments) }
    }*/
}

class ActionDelete extends Action {
    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "delete", argumentsJs, values)
    }

    exec(argumentsJs) {
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
        let selection: Item[] = this.context.cascadingView.userState.get("selection");
        if (selection && selection.length > 0) {
            this.context.cache.delete(selection);
            this.context.scheduleCascadingViewUpdate(true);
        } else {
            let dataItem = arguments["dataItem"];
            if (dataItem instanceof Item) {
                this.context.cache.delete(dataItem);
                this.context.scheduleCascadingViewUpdate(true);
            } else {
                // TODO Erorr handling
            }
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionDelete(context).exec(arguments) }
    }*/
}

class ActionDuplicate extends Action {
    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "duplicate", argumentsJs, values);
    }

    exec(argumentsJs) {
        let selection: Item[] = this.context.cascadingView.userState.get("selection");
        if (selection && selection.length > 0) {
            selection.forEach(function (item) {
                new ActionAddItem(this.context).exec({"dataItem": item})
            });//TODO:
        } else {
            let item = arguments["dataItem"];
            if (item instanceof Item) {
                new ActionAddItem(this.context).exec({"dataItem": item});
            } else {
                // TODO Error handling
                throw "Cannot execute ActionDupliate. The user either needs to make a selection, or a dataItem needs to be passed to this call."
            }
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionDuplicate.exec(context, arguments) }
    }*/
}

class ActionRunImporterInstance extends Action {
    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "runImporterInstance", argumentsJs, values)
    }

    exec(argumentsJs) {
        // TODO: parse options
        let importerInstance = arguments["importerInstance"];
        if (importerInstance instanceof ImporterInstance) {
            let cachedImporterInstance = this.context.cache.addToCache(importerInstance);

            this.context.podAPI.runImport(cachedImporterInstance.uid, function (error, success) {
                if (error) {
                    console.log(`Cannot execute actionImport: ${error}`);
                }
            });
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionImport.exec(context, arguments) }
    }*/
}


class ActionRunIndexerInstance extends Action {
    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "runIndexerInstance", argumentsJs, values)
    }

    exec(argumentsJs) {//TODO: this is stop point from today changes;
        // TODO: parse options
        let indexerInstance = arguments["indexerInstance"]
        if (indexerInstance !instanceof IndexerInstance) {
            throw "Error, no memriID"
        }
            let cachedIndexerInstance = this.context.cache.addToCache(indexerInstance);

            this.context.podAPI.runImport(cachedIndexerInstance.memriID, function (error, success) {
                if (error) {
                    console.log(`Cannot execute actionIndex: ${error}`);
                }
            });
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionImport.exec(context, arguments) }
    }*/
}

class ActionClosePopup extends Action {
    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "closePopup", argumentsJs, values)
    }

    exec(argumentsJs) {
        (this.context.closeStack.removeLast())()//TODO
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionClosePopup(context).exec(arguments) }
    }*/
}

class ActionLink extends Action {
    defaultValues = {
        "argumentTypes": {"subject": DataItemFamily.constructor, "property": String.constructor}//TODO:
    }

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "link", argumentsJs, values);
    }

    exec(argumentsJs) {
        let subject = arguments["subject"];
        if (subject !instanceof DataItem) {
            throw "Exception: subject is not set";
        }

        let propertyName = arguments["property"]
        if (typeof propertyName != "string") {
            throw "Exception: property is not set to a string"
        }

        let selected = arguments["dataItem"];
        if (selected !instanceof DataItem) {
            throw "Exception: selected data item is not passed"
        }

        // Check that the property exists to avoid hard crash
        let schema = subject.objectSchema[propertyName];
        if (!schema) {
            throw `Exception: Invalid property access of ${propertyName} for ${subject}`
        }
        if (Array.isArray(schema)) {
            // Get list and append
            var list = dataItemListToArray(subject[propertyName]); //TODO:?

            list.push(selected);

            subject.set(propertyName, list)//TODO
        }
        else {
            subject.set(propertyName, selected)//TODO
        }

        // TODO refactor
        ((this.context /*instanceof SubContext*/)?.parent ?? this.context).scheduleUIUpdate() //TODO:?
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionLink(context).exec(arguments) }
    }*/
}

class ActionUnlink extends Action {
    defaultValues = {
        "argumentTypes": {"subject": DataItemFamily.constructor, "property": String.constructor}//TODO
    }

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "unlink", argumentsJs, values)
    }

    exec(argumentsJs) {
        let subject = arguments["subject"];
        if (subject !instanceof DataItem) {
            throw "Exception: subject is not set";
        }

        let propertyName = arguments["property"]
        if (typeof propertyName != "string") {
            throw "Exception: property is not set to a string"
        }

        let selected = arguments["dataItem"];
        if (selected !instanceof DataItem) {
            throw "Exception: selected data item is not passed"
        }

        // Check that the property exists to avoid hard crash
        let schema = subject.objectSchema[propertyName];
        if (!schema) {
            throw `Exception: Invalid property access of ${propertyName} for ${subject}`
        }
        if (Array.isArray(schema)) {
            // Get list and append
            var list = dataItemListToArray(subject[propertyName]); //TODO:?

            list.push(selected);

            subject.set(propertyName, list)//TODO
        }
        else {
            subject.set(propertyName, selected)//TODO
        }

        // TODO refactor
        ((this.context /*instanceof SubContext*/)?.parent ?? this.context).scheduleUIUpdate() //TODO:?
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionUnlink(context).exec(arguments) }
    }*/
}

class ActionMultiAction extends Action {
    defaultValues = {
        "argumentTypes": {"actions": [Action].constructor},//TODO:?
        "opensView": true
    }

    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "multiAction", argumentsJs, values)
    }

    exec(argumentsJs) {
        let actions = arguments["actions"];
        if (!(Array.isArray(actions) && actions[0] instanceof Action)) {
            throw "Cannot execute ActionMultiAction: no actions passed in arguments"
        }

        for (let action of actions) {
            this.context.executeAction(action, argumentsJs["dataItem"]);
        }
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionMultiAction(context).exec(arguments) }
    }*/
}

class ActionNoop extends Action {
    constructor(context: MemriContext, argumentsJs = null, values = {}) {
        super(context, "noop", argumentsJs, values)
    }

    exec(argumentsJs) {
        // do nothing
    }

    /*class func exec(_ context:MemriContext, _ arguments:[String: Any]) throws {
        execWithoutThrow { try ActionClosePopup(context).exec(arguments) }
    }*/
}
