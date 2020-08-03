//
// MemriContext.swift
// Copyright © 2020 memri. All rights reserved.

/*
 Notes on documentation

 We use the following documentation keywords
 - bug
 - Remark
 - Requires
 - See also
 - warning

 Also remember, when using markdown in your documentation
 - Use backticks for code
 */

// TODO: Remove this and find a solution for Edges
import {CVUStateDefinition, Item, getItemType, ItemFamily} from "../model/items/Item";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {CVUParsedViewDefinition} from "../parsers/cvu-parser/CVUParsedDefinition";
import {settings} from "../model/Settings";
import {Views} from "../cvu/views/Views";
import {PodAPI} from "../api/api";
import {Expression} from "../parsers/expression-parser/Expression";
import {ExprInterpreter} from "../parsers/expression-parser/ExprInterpreter";
import {Sessions} from "../sessions/Sessions";
import {Installer} from "../install/Installer";
import {IndexerAPI} from "../api/IndexerAPI";
import {MainNavigation} from "../gui/navigation/MainNavigation";
import {Renderers} from "../cvu/views/Renderers";
import {CacheMemri} from "../model/Cache";
import {Realm} from "../model/RealmLocal";
import {ViewArguments} from "../cvu/views/CascadableDict";

export var globalCache

export interface Subscriptable {
	// subscript(propName: String) -> Any? { get set }//TODO
}

class Alias {
	key: string
	type: string
	on?
	off?

	constructor(key, type, on?, off?) {
		this.key = key
		this.type = type
		this.on = on
		this.off = off
	}
}

export class MemriContext {
	subscript() {
		//mock function;
	}

	realm = new Realm();
	name = ""

	sessions?: Sessions

	/// The current session that is active in the application
	get currentSession(): Session {
		return this.sessions?.currentSession
	}

	get currentView(): CascadableView {
		return this.sessions?.currentSession?.currentView
	}

	views: Views

	settings: Settings

	installer: Installer

	podAPI: PodAPI

	indexerAPI: IndexerAPI

	cache: CacheMemri

	navigation: MainNavigation

	renderers: Renderers

	get items(){
		return this.currentView?.resultSet.items ?? []
	}
	set items(items) {
		// Do nothing
		console.log("THIS SHOULD NEVER BE PRINTED2")
	}

	get item() {
		return this.currentView?.resultSet.singletonItem
	}

	set item(item) {
		// Do nothing
		console.log("THIS SHOULD NEVER BE PRINTED")
	}

	closeStack = [] // A stack of bindings for the display state of presented popups
	addToStack(isPresentedBinding) {
		this.closeStack.push(isPresentedBinding)
	}
	closeLastInStack() {
		let lastVisibleIndex = this.closeStack.reverse().findIndex(function (el) {
			return el.wrappedValue.isPresented;
		}) //TODO:
		if (lastVisibleIndex >= -1) {
			this.closeStack[lastVisibleIndex].wrappedValue.dismiss()
			this.closeStack = this.closeStack.slice(0, lastVisibleIndex)
		}
	}

	uiUpdateSubject /*= PassthroughSubject*/
	uiUpdateCancellable?: AnyCancellable

	cascadableViewUpdateSubject /*= PassthroughSubject*/
	cascadableViewUpdateCancellable?: AnyCancellable



	scheduleUIUpdate(immediate =  false, check?) { // Update UI
		if (immediate) {
			// #warning("@Toby how can we prevent the uiUpdateSubject from firing immediate after this?")

			// Do this straight away, usually for the sake of correct animation
			// DispatchQueue.main.async(() => {
				// Update UI
				// this.objectWillChange.send()
			// })
			return
		}

		if (check) {
			if (!check(this)) { return }
		}

		//this.uiUpdateSubject.send() TODO
	}

	scheduleCascadableViewUpdate(immediate =  false) {
		if (immediate) {
			// Do this straight away, usually for the sake of correct animation
			try { this.currentSession?.setCurrentView() }
			catch (error) {
				// TODO: User error handling
				// TODO: Error Handling
				debugHistory.error(`Could not update CascadableView: ${error}`)
			}
			return
		} else {
			//this.cascadableViewUpdateSubject.send() TODO
		}
	}

	/*updateCascadingView() {
		this.maybeLogUpdate()

		let currentView = this.sessions?.currentView

		// Fetch datasource if (not yet parsed yet
		if (!currentView) {
			throw new Error("Exception: currentView is not set")
		}

		if (currentView.datasource == undefined) {
			let parsedDef = this.views.parseDefinition(currentView.viewDefinition)
			if (parsedDef) {
				let ds = parsedDef["datasourceDefinition"]
				if (ds && ds?.constructor?.name == "CVUParsedDatasourceDefinition") {
					// TODO: this is at the wrong moment. Should be done after cascading
					currentView.set("datasource",
						new Datasource().fromCVUDefinition(ds, currentView.viewArguments))
				} else {
					throw new Error("Exception: Missing datasource in session view")
				}
			} else {
				throw new Error("Exception: Unable to parse view definition")
			}
		}

		let datasource = currentView.datasource

		if (!datasource) {
			throw new Error("Exception: Missing datasource in session view")
		}

		// Fetch the resultset associated with the current view
		let resultSet = this.cache.getResultSet(datasource)

		// If we can guess the type of the result based on the query, let's compute the view
		if (resultSet.determinedType != undefined) {
			if (this?.constructor?.name == "RootContext") { // if (type(of: self) == RootMain.self) {
				debugHistory.info("Computing view "
					+ (currentView.name ?? currentView.viewDefinition?.selector ?? ""))
			}

			try {
				// Calculate cascaded view
				let cascadingView = this.views.createCascadingView() // TODO: handle errors better

				// Update current session
				this.currentSession = this.sessions?.currentSession // TODO: filter to a single property

				// Set the newly cascading view
				this.cascadingView = cascadingView

				// Load data in the resultset of the computed view
				this.cascadingView?.resultSet.load(function (error) {
					if (error) {
						// TODO: Refactor: Log warning to user
						console.log(`Error: could not load result: ${error}`)
					} else {
						this.maybeLogRead()

						// Update the UI
						this.scheduleUIUpdate()
					}
				}.bind(this)) //TODO
			} catch (error) {
				// TODO: Error handling
				// TODO: User Error handling
				debugHistory.error(`${error}`)
			}

			// Update the UI
			this.scheduleUIUpdate()
		}
		// Otherwise let's execute the query first
		else {
			// Updating the data in the resultset of the session view
			resultSet.load(function (error) {
				// Only update when data was retrieved successfully
				if (error) {
					// TODO: Error handling
					console.log(`Error: could not load result: ${error}`)
				} else {
					// Update the current view based on the new info
					this.scheduleUIUpdate() // TODO: shouldn't this be setCurrentView??
				}
			}.bind(this))
		}
	}*/

	/*maybeLogRead() {
		let item = this.cascadingView?.resultSet.singletonItem
		if (item) {
			let auditItem = CacheMemri.createItem(AuditItem.constructor, {action: "read"})//TODO
			item.link(auditItem, "changelog")
		}
	}*/

	/*maybeLogUpdate() {
		if (this.cascadingView?.context == undefined) { return }

		let syncState = this.cascadingView?.resultSet.singletonItem?.syncState
		if (syncState.changedInThisSession) {
			let fields = syncState.updatedFields
			// TODO: serialize
			let item = this.cascadingView?.resultSet.singletonItem
			if (item) {
				let auditItem = CacheMemri.createItem(AuditItem.constructor, {//TODO
					contents: JSON.stringify(AnyCodable(fields)),//TODO
					action: "update",
				})
				item.link(auditItem, "changelog")
				realmWriteIfAvailable(this.realm, function () {
					syncState.changedInThisSession = false
				})
			} else {
				console.log("Could not log update, no Item found")
			}
		}
	}*/

	getPropertyValue(name) {
		let type = new Mirror(this) //TODO:

		for (var child of type.children) {
			if (child.label == name || child.label == "_" + name) {
				return child.value
			}
		}

		return ""
	}

	aliases = {}

	get (propName) {
		let alias = this.aliases[propName]
		if (alias) {
			let value = this.settings.get(alias.key)
			switch (alias.type) {
				case "bool":
					return value ?? false
				case "string":
					return value ?? ""
				case "int":
					return value ?? 0
				case "double":
					return value ?? 0
				default:
					return null
			}
		}

		return null
	}

	set (propName, newValue) {
		let alias = this.aliases[propName]
		if (alias) {
			this.settings.set(alias.key, newValue)//TODO

			let x = newValue
			if (typeof x === "boolean") { x ? (alias.on && alias.on()) : (alias.off && alias.off()) }

			this.scheduleUIUpdate(true)
		} else {
			console.log(`Cannot set property ${propName}, does not exist on context`)
		}
	}


	get showSessionSwitcher() {
		return this.get("showSessionSwitcher") == true
	}

	set showSessionSwitcher(value) {
		this.set("showSessionSwitcher", value)
	}

	/*get showNavigationBinding() {
		return this?.showNavigation ?? false //TODO
		// [weak self] in self?.showNavigation ?? false
	}

	set showNavigationBinding(value) {
		this.showNavigation = value;
		// [weak self] in self?.showNavigation = $0//TODO
	}*/

	get showNavigation() {
		return this.get("showNavigation") == true;
	}

	set showNavigation(value) {
		this.set("showNavigation", value)
	}

	setSelection(selection: Item[]) {
		this.currentView?.userState.set("selection", selection)
		this.scheduleUIUpdate()
	}

	constructor(
		name,
		podAPI: PodAPI ,
		cache: CacheMemri,
		settings: Settings,
		installer: Installer,
		sessions: Sessions,
		views: Views,
		navigation: MainNavigation,
		renderers: Renderers,
		indexerAPI: IndexerAPI
	) {
		this.name = name
		this.podAPI = podAPI
		this.cache = cache
		this.settings = settings
		this.installer = installer
		this.sessions = sessions
		this.views = views
		this.navigation = navigation
		this.renderers = renderers
		this.indexerAPI = indexerAPI

		// TODO: FIX
		this.currentView?.context = this
		this.indexerAPI?.context = this

        // Setup update publishers //TODO
		/*this.uiUpdateCancellable = uiUpdateSubject
            .throttle(.milliseconds(300), scheduler: RunLoop.main, latest: true)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.objectWillChange.send()
            }*/

        // Setup update publishers
        /*this.cascadableViewUpdateCancellable = cascadableViewUpdateSubject
            .throttle(for: .milliseconds(500), scheduler: RunLoop.main, latest: true)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                try? self?.currentSession?.setCurrentView()
            }*/
		this.currentSession?.setCurrentView()

	}

	//this part is from action
	executeAction(actions: Action[] | Action, dataItem?, viewArguments?) {
		if (Array.isArray(actions)) {
			for (let action of actions) {
				this.executeAction(action, dataItem, viewArguments);
			}
		} else {
			try {
				if (actions.getBool("withAnimation")) {
					//try withAnimation {
					this.executeActionThrows(actions, dataItem, viewArguments)
					//}
				} else {
					//try withAnimation(nil) {
					this.executeActionThrows(actions, dataItem, viewArguments)
					//}
				}
			} catch (error) {
				// TODO: Log error to the user
				debugHistory.error(`${error}`)
			}
		}
	}

	executeActionThrows(action: Action, dataItem?, viewArguments?) {
		// Build arguments dict
		let args = this.buildArguments(action, dataItem, viewArguments);

		// TODO: security implications down the line. How can we prevent leakage? Caching needs to be
		//      per context
		action.context = this;

		if (action.getBool("opensView")) {
			if (typeof action.exec === "function") {
				action.exec(args)
			} else {
				console.log(`Missing exec for action ${action.name}, NOT EXECUTING`)
			}
		} else {
			// Track state of the action and toggle the state variable
			let binding = action.binding;
			if (binding) {
				binding.toggleBool()

				// TODO: this should be removed and fixed more generally
				this.scheduleUIUpdate(true)
			}

			if (typeof action.exec === "function") {
				action.exec(args)
			} else {
				console.log(`Missing exec for action ${action.name}, NOT EXECUTING`)
			}
		}
	}

	buildArguments(action: Action, item?: Item, viewArguments?) {
		let viewArgs = new ViewArguments(this.currentView?.viewArguments, item)
			.merge(viewArguments)
			.resolve(item)

		var args = {}
		for (let [argName, inputValue] of Object.entries(action.values)) {
			if (action.argumentTypes[argName] == undefined) { continue }

			var argValue;
			let expr = inputValue;
			if (expr?.constructor?.name == "Expression") {
				argValue = expr.execute(viewArgs)
			} else {
				argValue = inputValue
			}

			var finalValue

			let dataItem = argValue;
			if (dataItem?.constructor?.name == "Item") {
				finalValue = dataItem
			} else if (typeof argValue.isCVUObject === "function") {
				let dict = argValue;
				if (action.argumentTypes[argName] == ViewArguments.constructor) {
					finalValue = new ViewArguments(dict).resolve(item, viewArgs)
				}
				/*else if (action.argumentTypes[argName] == ItemFamily.constructor) {
					finalValue = this.getItem(Expression.resolve(dict, viewArguments), item)
				}*/ //TODO:
				else if (action.argumentTypes[argName]?.constructor?.name == "CVUStateDefinition") {
					let viewDef = new CVUParsedViewDefinition("[view]")
					viewDef.parsed = dict
					finalValue = CVUStateDefinition.fromCVUParsedDefinition(viewDef)
				}
				else {
					throw `Exception: Unknown argument type specified in action definition ${argName}`
				}
			}
			else if (action.argumentTypes[argName] == ViewArguments.constructor) {
				if (argValue?.constructor?.name == "ViewArguments") {
					let viewArgs = argValue;
					// We explicitly don't copy here. The caller is responsible for uniqueness
					finalValue = viewArgs.resolve(item)
				} else if (argValue?.constructor?.name == "CVUParsedDefinition") {
					// #warning("This seems to not set the head properly")
					let parsedDef = argValue
					finalValue = new ViewArguments(parsedDef).resolve(item, viewArgs)
				} else {
					throw `Exception: Could not parse ${argName}`
				}
			} else if (typeof action.argumentTypes[argName] == "boolean") {
				finalValue = ExprInterpreter.evaluateBoolean(argValue)
			} else if (typeof action.argumentTypes[argName] == "string") {
				finalValue = ExprInterpreter.evaluateString(argValue)
			} else if (typeof action.argumentTypes[argName] == "number") {
				finalValue = ExprInterpreter.evaluateNumber(argValue)
			} else if (action.argumentTypes[argName] == [Action].constructor) {
				finalValue = argValue ?? []
			} else if (action.argumentTypes[argName] == AnyObject.self) {
				finalValue = argValue ?? undefined
			} else if (argValue == undefined) {
				finalValue = undefined;
			} else {
				throw `Exception: Unknown argument type specified in action definition ${argName}:${action.argumentTypes[argName] ?? ""}`
			}

			args[argName] = finalValue
		}

		// Last element of arguments array is the context data item
		args["item"] = item ?? this.currentView?.resultSet.singletonItem

		return args
	}

	getItem(dict, dataItem?: Item) {
		// TODO: refactor: move to function
		let stringType = dict && dict["_type"];
		if (typeof stringType != "string") {
			throw "Missing type attribute to indicate the type of the data item"
		}
		let family = ItemFamily[stringType];
		if (!family) {
			throw `Cannot find find family ${stringType}`
		}
		let ItemType = new (getItemType(family))();
		if (ItemType) {
			throw `Cannot find family ${stringType}`
		}
		var values = dict ?? {}
		if (typeof dict["uid"] != "number") {
			delete values["uid"]
		}
		delete values["_type"]

		return CacheMemri.createItem(ItemType, values)
	}
}

export class SubContext extends MemriContext {
	parent: MemriContext

	constructor(name: string, context: MemriContext, state?: CVUStateDefinition)  {
		let views = new Views()
		super(
			name,
			context.podAPI,
			context.cache,
			context.settings,
			context.installer,
			new Sessions(state),
			views,
			context.navigation,
			context.renderers,
			context.indexerAPI
		)

		this.closeStack = context.closeStack

		views.context = this

		this.sessions?.load(this)
	}
}

/// Represents the entire application user interface. One can imagine in the future there being multiple applications, each aimed at a
///  different way to represent the data. For instance an application that is focussed on voice-first instead of gui-first.
export class RootContext extends MemriContext {
	cancellable?: AnyCancellable

	subContexts

	// TODO: Refactor: Should installer be moved to rootmain?

	constructor(name: string, key: string)  {
		let podAPI = new PodAPI(undefined, key) //TODO: for now
		let cache = new CacheMemri(podAPI)
		let views = new Views()

		globalCache = cache // TODO: remove this and fix edges

		super(
			name,
			podAPI,
			cache,
			settings,
			new Installer(),
			new Sessions(undefined,true),
			views,
			new MainNavigation(),
			new Renderers(),
			new IndexerAPI()
		)

		this.currentView?.context = this

		// TODO: Refactor: This is a mess. Create a nice API, possible using property wrappers
		// Optimize by only doing this when a property in session/view/dataitem has changed
		this.aliases = {
			showSessionSwitcher: new Alias("device/gui/showSessionSwitcher", "bool", () => this.currentSession?.takeScreenShot(true)),
			showNavigation: new Alias("device/gui/showNavigation", "bool", () => this.currentSession?.takeScreenShot()),
		}

		//TODO what is weak?
		cache.scheduleUIUpdate = ($0) => { this.scheduleUIUpdate($0) }
		this.navigation.scheduleUIUpdate = ($0) => { this.scheduleUIUpdate($0) }
	}

	createSubContext(state?: CVUStateDefinition) {
		let subContext = new SubContext("Proxy", this, state)
		this.subContexts.push(subContext)
		return subContext
	}

	boot(isTesting:boolean = false, callback?) {
		//#if (targetEnvironment(simulator)
		if (!isTesting) {
			// Reload for easy adjusting
			this.views.context = this
			this.views.install()
			//this.sessions.install(this);
		}
		//	#endif*/

		// Load views configuration
		this.views.load(this, () => {
			if (isTesting) { return }
			// Load session
			this.sessions.load(this)

			// Update view when sessions changes
			/*this.cancellable = this.sessions.objectWillChange.sink(function () {
				this.scheduleUIUpdate()
			})*/

			// Load current view
			this.currentSession?.setCurrentView()

			callback && callback()
		})
	}

	mockBoot() {
		try {
			this.boot()
			return this
		} catch (error) { console.log(error) }

		return this
	}
}
