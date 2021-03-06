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
import {CVUStateDefinition, Item, ItemFamily} from "../../router";
import {debugHistory} from "../../router";
import {CVUParsedDefinition, CVUParsedViewDefinition} from "../../router";
import {Settings} from "../../router";
import {Views} from "../../router";
import {PodAPI} from "../../router";
import {Expression} from "../../router";
import {ExprInterpreter} from "../../router";
import {Sessions} from "../../router";
import {Installer} from "../../router";
import {IndexerAPI} from "../../router";
import {MainNavigation} from "../../router";
import {CacheMemri} from "../../router";
import {Realm} from "../../router";
import {ViewArguments} from "../../router";
import {MemriDictionary} from "../../router";
import {DatabaseController} from "../../router";


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

	showSettings = false; //TODO: for Settings sheet @mkslanc
	setNavigationBarItems; //TODO: for NavigationView top menu items @mkslanc
	setNavigationBarTitle; //TODO: for NavigationView top menu title @mkslanc
	setNavigationBarDestination; //TODO: for NavigationView to change view @mkslanc

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

	currentRendererController: RendererController

	views: Views

	settings: Settings

	installer: Installer

	podAPI: PodAPI

	indexerAPI: IndexerAPI

	cache: CacheMemri

	navigation: MainNavigation

	get items(): [] {
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



	scheduleUIUpdate(updateWithAnimation =  false, check?) { // Update UI
		if (typeof this.showNavigationBinding == "function")
			this.showNavigationBinding() //TODO: this is just for test cases @mkslanc
		if (updateWithAnimation) {
			this.currentRendererController?.update()
			// DispatchQueue.main.async(() => {//TODO
			//		withAnimation {
			// 			this.objectWillChange.send()
			//		}
			// })
			return
		}

		if (check) {
			if (!check(this)) { return }
		}

		// Queue an update
		//this.uiUpdateSubject.send() TODO
	}

	scheduleCascadableViewUpdate(immediate =  true) {
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
		if (typeof this.showNavigationBinding == "function")
			this.showNavigationBinding() //TODO: this is just for test cases @mkslanc
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
				if (ds && ds instanceof CVUParsedDatasourceDefinition) {
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
			if (this instanceof RootContext) { // if (type(of: self) == RootMain.self) {
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

			let shouldAnimate = (propName == "showNavigation")

			this.scheduleUIUpdate(shouldAnimate)
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

	getSelection() {
		return this.currentView?.userState.get("selection") ?? []
	}

	setSelection(selection: Item[]) {
		this.currentView?.userState.set("selection", selection)
		this.scheduleUIUpdate();
	}

	get editMode() {
		return this.currentSession?.editMode ?? false;
	}

	set editMode(newValue) {
		if (this.currentSession) this.currentSession.editMode = newValue;
		this.scheduleUIUpdate()
	}

	get allItemsSelected() {
		return this.getSelection().length >= this.items.length
	}

	get selectedIndicesBinding() {
		let items = this.items ?? []
		return this.getSelection().map((el) => items.findIndex(($0) => $0 == el)).filter((el) => el != undefined); //TODO: ?
	}

	set selectedIndicesBinding(selectedIndices) {
		this.setSelection(selectedIndices.map(($0) => this.items[$0]).filter((el) => el != undefined)); //TODO: ?
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
		this.indexerAPI = indexerAPI

		// TODO: FIX
		if (this.currentView)
			this.currentView.context = this
		if (this.indexerAPI)
			this.indexerAPI.context = this

        // Setup update publishers //TODO
		/*this.uiUpdateCancellable = uiUpdateSubject
            .throttle(.milliseconds(300), scheduler: RunLoop.main, latest: true)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.objectWillChange.send()
                self?.currentRendererController?.update()
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

		var args = new MemriDictionary()
		for (let [argName, inputValue] of Object.entries(action.values)) {
			if (action.argumentTypes[argName] == undefined) { continue }

			var argValue;
			let expr = inputValue;
			if (expr instanceof Expression) {
				argValue = expr.execute(viewArgs)
			} else {
				argValue = inputValue
			}

			var finalValue

			let dataItem = argValue;
			if (dataItem instanceof Item) {
				finalValue = dataItem
			} else if (argValue instanceof MemriDictionary) {
				let dict = argValue;
				if (action.argumentTypes[argName] == "ViewArguments") {
					finalValue = new ViewArguments(dict).resolve(item, viewArgs)
				}
				else if (action.argumentTypes[argName] == "ItemFamily") {
					finalValue = this.getItem(Expression.resolve(dict, viewArgs), item)
				} //TODO:
				else if (action.argumentTypes[argName] == "CVUStateDefinition") {
					let viewDef = new CVUParsedViewDefinition(`[${argName}]`)
					viewDef.parsed = dict
					finalValue = CVUStateDefinition.fromCVUParsedDefinition(viewDef)
				}
				else {
					throw `Exception: Unknown argument type specified in action definition ${argName}`
				}
			}
			else if (action.argumentTypes[argName] == "ViewArguments") {
				if (argValue instanceof ViewArguments) {
					let viewArgs = argValue;
					// We explicitly don't copy here. The caller is responsible for uniqueness
					finalValue = viewArgs.resolve(item)
				} else if (argValue instanceof CVUParsedDefinition) {
					// #warning("This seems to not set the head properly")
					let parsedDef = argValue
					finalValue = new ViewArguments(parsedDef).resolve(item, viewArgs)
				} else {
					throw `Exception: Could not parse ${argName}`
				}
			} else if (action.argumentTypes[argName] == "Bool") {
				finalValue = ExprInterpreter.evaluateBoolean(argValue)
			} else if (action.argumentTypes[argName] == "String") {
				finalValue = ExprInterpreter.evaluateString(argValue)
			} else if (action.argumentTypes[argName] == "Int" || action.argumentTypes[argName] == "Double") {
				finalValue = ExprInterpreter.evaluateNumber(argValue)
			} else if (action.argumentTypes[argName] == "[Action]") {
				finalValue = argValue ?? []
			} else if (action.argumentTypes[argName] == "AnyObject") {
				finalValue = argValue ?? undefined
			} else if (argValue == undefined) {
				finalValue = undefined;
			} else {
				throw `Exception: Unknown argument type specified in action definition ${argName}:${action.argumentTypes[argName] ?? ""}`
			}

			args[argName] = finalValue
		}

		// Last element of arguments array is the context data item
		if (args["item"] == undefined) {
			args["item"] = item ?? this.currentView?.resultSet.singletonItem
		}

		return args
	}

	getItem(dict, dataItem?: Item) {
		let realm = DatabaseController.getRealmSync()

		if (!dict) {
			throw "Missing properties"
		}


		let stringType = dict && dict["_type"];
		if (typeof stringType != "string") {
			throw "Missing type attribute to indicate the type of the data item"
		}
		let family = ItemFamily[stringType];
		if (!family) {
			throw `Cannot find find family ${stringType}`
		}
		/*let ItemType = new (getItemType(family))();
		if (!ItemType) {
			throw `Cannot find family ${stringType}`
		}*/
		var values = new MemriDictionary()
		var edges = new MemriDictionary()

		for (let [key, value] of Object.entries(dict)) {
			if (key == "_type" || key == "uid") { continue }
			// if (schema[key] != nil) { values[key] = value }//TODO
			else if (value instanceof Item) { edges[key] = value }
			else if (Array.isArray(value) && value[0] instanceof Item) { edges[key] = value }
			else {
				values[key] = value
				// throw `Passed invalid value as ${key}`//TODO
			}
		}

		let item = CacheMemri.createItem(family, values)

		for (let [edgeType, value] of Object.entries(edges)) {
			if (Array.isArray(value) && value[0] instanceof Item) {
				for (let target of value) {
					item.link(target, edgeType)
				}
			}
			else if (value instanceof Item) {
				item.link(value, edgeType, null, null, true)
			}
		}

		return item
	}

	loadedImages = 0; //TODO: counter for onLoad images event @mkslanc
	updateViewHeight;
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
			context.indexerAPI
		)
		this.parent = context;
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

	constructor(name: string)  {
		let podAPI = new PodAPI(undefined, undefined) //TODO: for now
		let cache = new CacheMemri(podAPI)
		let views = new Views()

		globalCache = cache // TODO: remove this and fix edges

		super(
			name,
			podAPI,
			cache,
			new Settings(),
			new Installer(),
			new Sessions(undefined,true),
			views,
			new MainNavigation(),
			new IndexerAPI()
		)
		if (this.currentView)
			this.currentView.context = this

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
		if (!this.subContexts)
			this.subContexts = []
		this.subContexts.push(subContext)
		return subContext
	}

	boot(isTesting:boolean = false, callback?) {
		let doBoot = () => {
			try {
				// Load views configuration
				this.views.load(this)

				// Stop here is we're testing
				if (isTesting) {
					callback && callback(undefined)
					return
				}

				// Load session
				this.sessions.load(this)

				// Update view when sessions changes
				/*this.cancellable = this.sessions.objectWillChange.sink(function () {
                    this.scheduleUIUpdate()
                })*/

				// Load current view
				this.currentSession?.setCurrentView()

				// Start syncing
				this.cache.sync.load()

				callback && callback(undefined)
			} catch (error) {
				callback && callback(error)
			}
		}

		if (!isTesting) {
			DatabaseController.clean((error) => {
				// DispatchQueue.main.async {//TODO
					if (error) {
						callback(error)
						return
					}

					// #if targetEnvironment(simulator)
					// Reload for easy adjusting
					this.views.context = this

					this.views.install(null, (error) => {//TODO
						// DispatchQueue.main.async {
							if (error) {
								callback(error)
								return
							}

							doBoot()
						// }
					})
					// #else
					doBoot()
					// #endif
				// }
			})
		}
		else {
			doBoot()
		}


	}

	mockBoot() {
		this.boot(false, function(){})
		return this
	}
}
