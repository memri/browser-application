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
import {debugHistory} from "../cvu/views/ViewDebugger";
import {CVUParsedDatasourceDefinition} from "../parsers/cvu-parser/CVUParsedDefinition";
import {realmWriteIfAvailable} from "../gui/util";
import {settings} from "../model/Settings";
import {Views} from "../cvu/views/Views";
import {PodAPI} from "../api/api";
import {Datasource} from "./Datasource";

export var globalCache

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

class MemriContext {
	name = ""
	/// The current session that is active in the application
	currentSession?: Session

	cascadingView?: CascadingView

	sessions?: Sessions

	views: Views

	settings: Settings

	installer: Installer

	podAPI: PodAPI

	indexerAPI: IndexerAPI

	cache: Cache

	realm: Realm

	navigation: MainNavigation

	renderers: Renderers

	get items(){
		return this.cascadingView?.resultSet.items ?? []
	}
	set items(items) {
		// Do nothing
		console.log("THIS SHOULD NEVER BE PRINTED2")
	}

	get item() {
		return this.cascadingView?.resultSet.singletonItem
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
		let lastVisibleIndex = this.closeStack.findIndex(function (el) {
			return el.wrappedValue.isPresented;
		}) //TODO:
		if (lastVisibleIndex >= 0) {
			this.closeStack[lastVisibleIndex].wrappedValue.dismiss()
			this.closeStack = this.closeStack.slice(0, lastVisibleIndex)
		}
	}

	scheduled = false
	scheduledComputeView = false

	scheduleUIUpdate(immediate =  false, check?) { // Update UI
		let outcome = function() {
			// Reset scheduled
			this.scheduled = false

			// Update UI
			this.objectWillChange.send()
		}.bind(this);
		if (immediate) {
			// Do this straight away, usually for the sake of correct animation
			outcome()
			return
		}

		if (check) {
			if (!check(this)) { return }
		}
		// Don't schedule when we are already scheduled
		if (this.scheduled) { return }
		// Prevent multiple calls to the dispatch queue
		this.scheduled = true

		// Schedule update
		/*DispatchQueue.main.async {//TODO
			outcome()
		}*/
	}

	scheduleCascadingViewUpdate(immediate =  false) {
		let outcome = function() {
			// Reset scheduled
			this.scheduledComputeView = false

			// Update UI
			try { this.updateCascadingView() }
			catch (error) {
				// TODO: User error handling
				// TODO: Error Handling
				debugHistory.error(`Could not update CascadingView: ${error}`)
			}
		}.bind(this)
		if (immediate) {
			// Do this straight away, usually for the sake of correct animation
			outcome()
			return
		}
		// Don't schedule when we are already scheduled
		if (!this.scheduledComputeView) {
			// Prevent multiple calls to the dispatch queue
			this.scheduledComputeView = true

			// Schedule update
			/*DispatchQueue.main.async {//TODO
				outcome()
			}*/
		}
	}

	updateCascadingView() {
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
	}

	maybeLogRead() {
		let item = this.cascadingView?.resultSet.singletonItem
		if (item) {
			let auditItem = Cache.createItem(AuditItem.constructor, {action: "read"})//TODO
			item.link(auditItem, "changelog")
		}
	}

	maybeLogUpdate() {
		if (this.cascadingView?.context == undefined) { return }

		let syncState = this.cascadingView?.resultSet.singletonItem?.syncState
		if (syncState.changedInThisSession) {
			let fields = syncState.updatedFields
			// TODO: serialize
			let item = this.cascadingView?.resultSet.singletonItem
			if (item) {
				let auditItem = Cache.createItem(AuditItem.constructor, {//TODO
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
	}

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

	getSubscript(propName) {
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

	setSubscript(propName, newValue) {
		let alias = this.aliases[propName]
		if (alias) {
			this.settings.set(alias.key, newValue)//TODO

			let x = newValue
			if (typeof x === "boolean") { x ? alias.on() : alias.off() }

			this.scheduleUIUpdate(true)
		} else {
			console.log(`Cannot set property ${propName}, does not exist on context`)
		}
	}


	get showSessionSwitcher() {
		return this["showSessionSwitcher"] == true
	}

	set showSessionSwitcher(value) {
		this["showSessionSwitcher"] = value
	}

	get showNavigationBinding() {
		return //TODO
		// [weak self] in self?.showNavigation ?? false
	}

	set showNavigationBinding(value) {
		// [weak self] in self?.showNavigation = $0//TODO
	}

	get showNavigation() {
		return this["showNavigation"] == true
	}

	set showNavigation(value) {
		this["showNavigation"] = value
	}

	constructor(
		name,
		podAPI,
		cache,
		realm,
		settings,
		installer,
		sessions = null,//TODO
		views,
		cascadingView = null,//TODO
		navigation,
		renderers,
		indexerAPI
	) {
		this.name = name
		this.podAPI = podAPI
		this.cache = cache
		this.realm = realm
		this.settings = settings
		this.installer = installer
		this.sessions = sessions
		this.views = views
		this.cascadingView = cascadingView
		this.navigation = navigation
		this.renderers = renderers
		this.indexerAPI = indexerAPI

		// TODO: FIX
		this.cascadingView?.context = this
		this.indexerAPI.context = this
	}
}

class SubContext extends MemriContext {
	parent: MemriContext

	constructor(name: string, context: MemriContext, session: Session)  {
		let views = new Views(context.realm)
		super(
			name,
			context.podAPI,
			context.cache,
			context.realm,
			context.settings,
			context.installer,
			Cache.createItem(Sessions.constructor),
			views,
			undefined, //            cascadingView: context.cascadingView,,
			context.navigation,
			context.renderers,
			context.indexerAPI
		)

		this.parent = context

		this.closeStack = context.closeStack

		views.context = this

		this.sessions?.setCurrentSession(session)
	}
}

/// Represents the entire application user interface. One can imagine in the future there being multiple applications, each aimed at a
///  different way to represent the data. For instance an application that is focussed on voice-first instead of gui-first.
class RootContext extends MemriContext {
	cancellable?: AnyCancellable

	subContexts = []

	// TODO: Refactor: Should installer be moved to rootmain?
	podAPI = new PodAPI(key)
	cache = new Cache(this.podAPI);
	realm = this.cache.realm;

	constructor(name: string, key: string)  {
		super(
			name,
			podAPI,
			cache,
			realm,
			settings(realm),
			new Installer(realm),
			Cache.createItem(Sessions.constructor, {uid: Cache.getDeviceID()}),
			new Views(realm),
			undefined,
			new MainNavigation(realm),
			new Renderers(),
			new IndexerAPI()
		)

		globalCache = this.cache // TODO: remove this and fix edges

		MapHelper.shared.realm = this.realm // TODO: How to access realm in a better way?

		this.cascadingView?.context = this

		let takeScreenShot = function(){
			// Make sure to record a screenshot prior to session switching
			this.currentSession?.takeScreenShot() // Optimize by only doing this when a property in session/view/dataitem has changed
		}

		// TODO: Refactor: This is a mess. Create a nice API, possible using property wrappers
		this.aliases = {
			showSessionSwitcher: new Alias("device/gui/showSessionSwitcher", "bool", takeScreenShot),
			showNavigation: new Alias("device/gui/showNavigation", "bool", takeScreenShot),
		}

		//this.cache.scheduleUIUpdate = { [weak self] in self?.scheduleUIUpdate($0) }//TODO
		//this.navigation.scheduleUIUpdate = { [weak self] in self?.scheduleUIUpdate($0) }//TODO

		// Make settings global so it can be reached everywhere
		this.globalSettings = this.settings//TODO
	}

	createSubContext(session) {
		let subContext = new SubContext("Proxy", this, session)
		this.subContexts.push(subContext)
		return subContext
	}

	boot() {
		// Make sure memri is installed properly
		this.installer.installIfNeeded(this, function () {
			/*#if (targetEnvironment(simulator)
			// Reload for easy adjusting
			self.views.context = self
			self.views.install()
			#endif*/

			// Load views configuration
			this.views.load(this, function() {
				// Update view when sessions changes
				this.cancellable = this.sessions?.objectWillChange.sink(function () {
					this.scheduleUIUpdate()
				})

				this.currentSession?.access()
				this.currentSession?.currentView?.access()

				// Load current view
				this.updateCascadingView()

				//callback?()
			}.bind(this))
		});
	}

	mockBoot() {
		try {
			this.boot()
			return this
		} catch (error) { console.log(error) }

		return this
	}
}
