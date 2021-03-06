
// TODO: Move to integrate with some of the sessions features so that Sessions can be nested
import {
	CVU,
	CVUParsedRendererDefinition,
	CVUParsedViewDefinition,
	CVUParsedDatasourceDefinition,
	CVUParsedStyleDefinition,
	CVUParsedColorDefinition,
	CVUParsedSessionsDefinition,
	CVUParsedSessionDefinition,
	CVUParsedLanguageDefinition,
	ExprVariableNode, Edge, RealmObjects, RealmObject, ExprLookupNode
} from "../../../router";
import {debugHistory} from "../../../router";
import {Settings} from "../../../router";
import {
	ExprVariableList,
	ExprVariableType
} from "../../../router";
import {ExprInterpreter} from "../../../router";
import {setInMemoryObjectCache} from "../../../router";
import {Languages} from "../../../router";
import {DatabaseController} from "../../../router";
import {CacheMemri} from "../../../router";
//import {RealmObjects} from "../../model/RealmLocal";
import {CVUStateDefinition, dataItemListToArray, getItem, Item} from "../../../router";
import {ViewArguments} from "../../../router";
import {MemriDictionary} from "../../../router";
import {ParseErrors} from "../../../router";
import {CascadingRendererConfig} from "../../../router";

export class Views {
	///
	languages = new Languages()
	///
	context

	recursionCounter = 0
	cvuWatcher
	settingWatcher

	constructor() {
	}

	load(context: MemriContext) {
		// Store context for use within createCascadingView)
		this.context = context

		 this.setCurrentLanguage(this.context.settings.get("user/language") ?? "English")

		this.settingWatcher = this.context.settings.subscribe("device/debug/autoReloadCVU", ($0) => {
			let value = $0;
			if (value) {
				if (value && this.cvuWatcher == undefined) {
					this.listenForChanges()
				} else if (!value && this.cvuWatcher) {
					let c = this.cvuWatcher;
					c.cancel()
					this.cvuWatcher = undefined;
				}
			}
		})
	}

	listenForChanges() {
		if (!this.context?.podAPI.isConfigured) {
			return
		}
		/*
		if DEBUG
		if (DatabaseController.isRunningXcodeTests) {
			return
		}*/

		// Subscribe to changes in CVUStoredDefinition
		this.cvuWatcher = this.context?.cache.subscribe("CVUStoredDefinition", (items) => { // CVUStoredDefinition AND domain='user'
			this.reloadViews();
		})
	}

	// TODO: refactor when implementing settings UI call this when changing the language
	setCurrentLanguage(language) {
		this.languages.currentLanguage = language

		let definitions = this.fetchDefinitions(undefined, undefined, "language")
			.map((item) => this.parseDefinition(item))
			.filter((item) => item != undefined)

		this.languages.load(definitions)
	}

	// TODO: Refactor: distinguish between views and sessions
	// Load the default views from the package
	install(overrideCodeForTesting: string, callback) {
		if (overrideCodeForTesting && !this.context) {//TODO:
			callback("Context is not set")
			return
		}
		let code = overrideCodeForTesting ?? getDefaultViewContents()

		var parsedDefinitions: CVUParsedDefinition[]
		try {
			let cvu = new CVU(code, this.context, this.lookupValueOfVariables, this.executeFunction)
			parsedDefinitions = cvu.parse() // TODO: this could be optimized
		} catch (error) {
			if (error instanceof ParseErrors) {
				// TODO: Fatal error handling
				callback(`Parse Error: ${error.toErrorString()}`)
			} else {
				callback(error)
			}
		}

		/*let validator = new CVUValidator();
		if (!validator.validate(parsedDefinitions)) {
			validator.debug()
			if (validator.warnings.length > 0) {
				for (let message of validator.warnings) { debugHistory.warn(message) }
			}
			if (validator.errors.length > 0) {
				for (let message of validator.errors) { debugHistory.error(message) }
				callback(`Exception: Errors in default view set:    \n${validator.errors.join("\n    ")}`)
				return
			}
		}
		*///TODO:
		DatabaseController.asyncOnBackgroundThread(true, callback,() => { // Start write transaction outside loop for performance reasons
			// Loop over lookup table with named views
			for (let def of parsedDefinitions) {
				var values = new MemriDictionary({
					"domain": "defaults",
					"definition": def.toString(),//TODO
				})

				if (def.selector != undefined) { values["selector"] = def.selector }
				if (def.name != undefined) { values["name"] = def.name }

				let selector = def.selector
				if (!selector) {
					throw "Exception: selector on parsed CVU is not defined"
				}

				if (def instanceof CVUParsedViewDefinition) {
					values["itemType"] = "view"
					//                    values["query"] = (def as! CVUParsedViewDefinition)?.query ?? ""
				} else if (def instanceof CVUParsedRendererDefinition) { values["itemType"] = "renderer" }
				else if (def instanceof CVUParsedDatasourceDefinition) { values["itemType"] = "datasource" }
				else if (def instanceof CVUParsedStyleDefinition) { values["itemType"] = "style" }
				else if (def instanceof CVUParsedColorDefinition) { values["itemType"] = "color" }
				else if (def instanceof CVUParsedLanguageDefinition) { values["itemType"] = "language" }
				else if (def instanceof CVUParsedSessionsDefinition) { values["itemType"] = "sessions" }
				else if (def instanceof CVUParsedSessionDefinition) { values["itemType"] = "session" }
				else { throw "Exception: unknown definition" }

				// Store definition
				CacheMemri.createItem("CVUStoredDefinition", values,
					`selector = '${selector}' and domain = 'defaults'`);
			}

			callback(undefined)
		})
	}

	// TODO: This should be moved elsewhere
	static formatDate(date, dateFormat?) {//TODO:
		let showAgoDate = Settings.shared.get("user/general/gui/showDateAgo")

		if (date) {
			// Compare against 36 hours ago
			if (dateFormat != undefined || showAgoDate == false /*|| date
                .timeIntervalSince(Date(timeIntervalSinceNow: -129_600)) < 0*/) {
                //let dateFormatter = DateFormatter()

                /*dateFormatter.dateFormat = dateFormat == "time"
                    ? Settings.shared.get("user/formatting/time")
                    : dateFormat
                        ?? Settings.shared.get("user/formatting/date")
                        ?? "yyyy/MM/dd HH:mm"
				*/
                let options = {};
                if (dateFormat == "time") {
                	options = {hour: "numeric", minute: "numeric"}
				}
				//let format = Settings.shared.get("user/formatting/time");
				return date.toLocaleString('en-US', options);
            }
            else {
				return date.toLocaleString();
            } //TODO:
		} else {
			return "never"
		}
	}

	static formatDateSinceCreated(date) {
		if (date) {
			return date/*.timeDelta*/ ?? ""//TODO:
		} else {
			return "never"
		}
	}

	reloadViews() {
//        guard let defs = items as? [CVUStoredDefinition] else {
//            return
//        }

		// This may not be needed
//        // Determine whether the current view needs reloading
//        for def in defs {
//            var selectors = [String]()
//            if let stack = context?.cascadingView?.cascadeStack {
//                for parsed in stack { selectors.append(parsed.selectors) }
//                ...
//            }
//        }

		this.context?.scheduleCascadingViewUpdate()
	}

	getGlobalReference(name, viewArguments) {
		let realm = DatabaseController.getRealmSync()
		// Fetch the value of the right property on the right object
		switch (name) {
			case "setting":
				let f = function (args?) { // (value:String) -> Any? in
					let value = args[0];
					if (typeof value == "string") {
						let x = Settings.shared.get(value/*, type: Double.self*/);
						if (x) {
							return x
						}
					}
					return ""
				}
				return f;
			case "item":
				return (args) => {   // (value:String) -> Any? in
					let typeName = args[0];
					let uid = args[1];
					if (typeof typeName != "string" || typeof uid != "number") {
						if (args?.length == 0) {
							return this.context?.currentView?.resultSet.singletonItem
						}
						return
					}
					return getItem(typeName, Math.floor(uid))
				}
			case "debug":
				return (args) => {
					if (!args || args.length == 0) {
						debugHistory.info("nil")
						return null
					}
					debugHistory.info(args?.map(($0) => `${$0 ?? ""}`).join(" ") ?? "")
					return null
				}
			case "min":
				return (args) => {
					let first = Number(args[0]) ?? 0//TODO
					let second = Number(args[1]) ?? 0//TODO
					return Math.min(first, second)
				}
			case "max":
				return (args) => {
					let first = Number(args[0]) ?? 0//TODO
					let second = Number(args[1]) ?? 0//TODO
					return Math.max(first, second)
				}
			case "floor":
				return (args) => {
					let value = Number(args[0]) ?? 0//TODO
					return Math.floor(value)
				}
			case "ceil":
				return (args) => {
					let value = Number(args[0]) ?? 0//TODO
					return Math.ceil(value)
				}
			case "me": return realm.objects("Person").filtered("ANY allEdges.type = 'me'")[0]
			case "context": return this.context
			case "sessions": return this.context?.sessions
			case "currentSession":
			case "session": return this.context?.currentSession
			case "currentView":
			case "view": return this.context?.currentView
			case "singletonItem":
				let itemRef = viewArguments?.get(".");
				if (itemRef) {
					return itemRef
				} else {
					let item = this.context?.currentView?.resultSet.singletonItem
					if (item) {
						return item
					}
				}
				throw "Exception: Missing object for property getter"
			default:
				if (/^\$/.test(name))
					name = name.substr(1);
				let value = viewArguments?.get(name)
				if (value) { return value }

				debugHistory.warn(`Undefined variable ${name}`)
				return null
				//throw `Exception: Unknown object for property getter: ${name}`
		}
	}

	lookupValueOfVariables1(lookup: ExprLookupNode, viewArguments?: ViewArguments) {
		let x = this.lookupValueOfVariables(//TODO
			lookup,
			viewArguments,
			false
		)
		return x
	}

	lookupValueOfVariables(lookup: ExprLookupNode, viewArguments?: ViewArguments, isFunction =  false) {//TODO
		var value
		var first = true

		// TODO: support language lookup: {$name}
		// TODO: support viewArguments lookup: {name}

		this.recursionCounter += 1

		if (this.recursionCounter > 4) {
			this.recursionCounter = 0
			throw `Exception: Recursion detected while expanding variable ${lookup.toExprString()}`
		}

		var i = 0
		for (var node of lookup.sequence) {
			i += 1
			if (node instanceof ExprVariableNode) {
				if (first) {
					// TODO: move to CVU validator??
					if (node.list == ExprVariableList.list || node.type != ExprVariableType.propertyOrItem) {
						this.recursionCounter = 0
						throw "Unexpected edge lookup. No source specified"
					}


				let name = node.name == "@@DEFAULT@@" ? "singletonItem" : node.name;
				try {
					value = this.getGlobalReference(name, viewArguments)
					first = false

					if (isFunction && i == lookup.sequence.length) {
						break
					}

				} catch (error) {
					this.recursionCounter = 0
					throw error
				}
			} else
			if (isFunction && i == lookup.sequence.length && value && value instanceof Item) {
				value = value.functions[node.name]
				if (value == undefined) {
					// TODO: parse [blah]
					this.recursionCounter = 0
					let message = "Exception: Invalid function call. Could not find"
					throw `${message} ${node.name}`
				}
				break
			} else {
					let dataItem = value
					let v = value
					if (dataItem instanceof Item) {
						switch (node.name) {
							case "genericType": value = dataItem.genericType;
								break;
							default:
								if (node.list == ExprVariableList.single) {
								switch (node.type) {
									case ExprVariableType.reverseEdge: value = dataItem.reverseEdge(node.name)
										break;
									case ExprVariableType.reverseEdgeItem: value = dataItem.reverseEdge(node.name)?.source()
										break;
									case ExprVariableType.edge: value = dataItem.edge(node.name)
										break;
									case ExprVariableType.propertyOrItem: value = dataItem.get(node.name)
										break;
								}
							} else {
								switch (node.type) {
									case ExprVariableType.reverseEdge: value = dataItem.reverseEdges(node.name)
										break;
									case ExprVariableType.reverseEdgeItem: value = dataItem.reverseEdges(node.name)?.sources()
										break;
									case ExprVariableType.edge: value = dataItem.edges(node.name)
										break;
									case ExprVariableType.propertyOrItem: value = dataItem.edges(node.name)?.items()
										break;
								}
							}
						}
					} else if (typeof v === "number") { //TODO: check if timestamp catches here
						switch (node.name) {
							case "currency":
								value =  "$" + v;
								break;
							default:
								break
						}
					} else if (typeof v === "string") {
						switch (node.name) {
							case "uppercased": value = v.toUpperCase(); break
							case "lowercased": value = v.toLowerCase(); break
							case "camelCaseToWords": value = v.camelCaseToWords(); break
							case "plural": value = v + "s"; break;
							case "firstUppercased": value = v.capitalizingFirst(); break
							case "plainString": value = v.strippingHTMLtags(); break
							case "count": value = v.length; break
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on string`)
								break
						}
					} else if (value instanceof Date || typeof value == "number") {//Most likely number will be timestamp
						let date = value;
						switch (node.name) {
							case "format":
								if (!isFunction) {
									throw "You must call .format() as a function"
								}
								if (typeof value == "number")
									date = new Date(date);
								value = (args) => {
									if (args.length == 0) {
										return Views.formatDate(date);
									} else {
										return Views.formatDate(date, args[0]);
									}
								}
								break;
							/*case "timeSince1970": value = date.timeIntervalSince1970
                            case "timeSinceNow": value = date.timeIntervalSinceNow*/
							default:
								// TODO: Warn
								debugHistory.warn("Could not find property \(node.name) on string")
						}
					} else if (v instanceof Edge) {
						switch (node.name) {
							case "source": value = v.source(); break;
							case "target": value = v.target(); break
							case "item": value = v.target(); break
							case "label": value = v.edgeLabel; break
							case "type": value = v.type; break
							case "sequence": value = v.sequence; break
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on edge`)
								break
						}
					} else if (v instanceof RealmObjects) {//TODO
						switch (node.name) {
							case "count": value = v.length; break
							case "first": value = v[0]; break
							case "last": value = v[v.length - 1]; break
							//                        case "sum": value = v.sum; break
							// case "min": value = v.min; break//TODO
							// case "max": value = v.max; break//TODO
							case "items": value = v.items(); break
							// // TODO: Add sort")
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on list of edge`)
								break
						}
					}
					/*else if (v?.constructor?.name == "RealmSwift.Results<Item>") {//TODO
						switch (node.name) {
							case "count": value = v.length; break
							case "first": value = v[0]; break
							case "last": value = v[v.length - 1]; break
							// // TODO: Add sort")
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on list of items`);
								break
						}
					}*/
					else if (Array.isArray(v)) {
						switch (node.name) {
							case "count": value = v.length; break
							case "first": value = v[0]; break
							case "last": value = v[v.length - 1]; break
							// // TODO: Add sort")
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on list`);
								break
						}
					}

					else if (v?.constructor?.name == "RealmObjects.ListBase") {//TODO
						switch (node.name) {
							case "count": value = v.length; break//TODO
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node} on list`)
								break
						}
					} else if (v && typeof v.subscript == "function") {//Subscriptable
						value = v.get(node.name)
					}
					// CascadingRenderer??
					else if (v instanceof RealmObject) {//TODO:
						if (v[node.name] == null) {
							// TODO: error handling
							this.recursionCounter = 0
							throw `No variable with name ${node.name}`
						} else {
							value = v[node.name] // How to handle errors?
						}
					}
					else if (`${value ?? ""}` != "undefined"/*TODO*/) { //// TODO: Fix Any issue")
						this.recursionCounter = 0
						throw `Unexpected fetch ${node.name} on ${value}`
					}
				}
			}
			// .addresses[primary = true] || [0]
			else if (node instanceof ExprLookupNode) {
				// TODO: This is implemented very slowly first. Let's think about an optimization

				let interpret = new ExprInterpreter(node, this.lookupValueOfVariables, this.executeFunction)
				let list = dataItemListToArray(value) //value; //TODO:
				let args = viewArguments?.copy() ?? new ViewArguments();
				let expr = node.sequence[0]

				for (let item in list) {
					args.set(".", list[item]);
					let hasFound = interpret.execSingle(expr, args); //TODO: ? ?? false
					if (hasFound &&
						ExprInterpreter.evaluateBoolean(hasFound)) {
						value = list[item];
						break;
					}
				}
			}

			if (value == undefined) {
				break
			}
		}

		this.recursionCounter -= 1

		return value
	}
	lookupValueOfVariables = this.lookupValueOfVariables.bind(this)

	executeFunction(lookup, args, viewArguments?) {
		let f = this.lookupValueOfVariables(lookup,
										   viewArguments,
										   true)

		if (f /*as? ([Any?]?) -> Any*/) {//TODO
			if (typeof f == "function") {
				return f(args);
			}
			else if (`${f}` != "undefined"/*TODO*/) { //// TODO: Temporary hack to detect nil that is not nil — .dateAccessed.format where .dateAccessed is nil")
				throw `Could not find function to execute: ${lookup.toExprString()}`
			}
		}

		let x = undefined;
		return x
	}
	executeFunction = this.executeFunction.bind(this)

	fetchDefinitions(selector?: string, name?: string, type?: string, query?: string, domain?: string) {
		var filter = [];

		if (selector) { filter.push(`selector = '${selector}'`) }
		else {
			if (type) { filter.push(`itemType = '${type}'`) }
			if (name) { filter.push(`name = '${name}'`) }
			if (query) { filter.push(`query = '${query}'`) }
		}

		if (domain) { filter.push(`domain = '${domain}'`) }

		return DatabaseController.sync(false,  (item) =>
				item.objects("CVUStoredDefinition")
					.filtered(filter.join(" AND "))
					.map ( (def) => (def["_type"] == "CVUStoredDefinition") ? def: undefined)
		)  ?? []//TODO
	}

	// TODO: REfactor return list of definitions
	parseDefinition(viewDef?) {
		let strDef = viewDef.definition; //TODO:
		if (!viewDef || (!strDef)) {
			throw "Exception: Missing CVU definition"
		}

		let context = this.context
		if (!context) {
			throw "Exception: Missing Context"
		}

		if (viewDef.definition) {
			let definition = viewDef.definition
			let viewDefParser = new CVU(definition, context,
									this.lookupValueOfVariables,
									this.executeFunction)
			setInMemoryObjectCache(strDef, viewDefParser); //TODO

			let firstDefinition = viewDefParser.parse()[0]
			if (firstDefinition) {
				// TODO: potentially turn this off to optimize
				/*let validator = new CVUValidator()
				if (!validator.validate([firstDefinition])) {
					validator.debug()
					if (validator.warnings.length > 0) {
						for (var message of validator.warnings) { debugHistory.warn(message) }
					}
					if (validator.errors.length > 0) {
						for (var message of validator.errors) { debugHistory.error(message) }
						throw `Exception: Errors in default view set:    \n${validator.errors.join("\n    ")}`
					}
				}*/ //TODO:

				return firstDefinition
			}
		} else {
			throw "Exception: Missing view definition"
		}

		return null
	}

	/// Takes a stored definition and fetches the view definition or when its a session definition, the currentView of that session
	getViewStateDefinition(stored: CVUStoredDefinition) {
		var view: CVUStateDefinition
		if (stored.itemType == "view") {
			view = CVUStateDefinition.fromCVUStoredDefinition(stored)
		} else if (stored.itemType == "session") {
			let parsed = this.parseDefinition(stored);
			if (!parsed) {
				throw "Unable to parse state definition"
			}
			let list = parsed.get("views");
			let p = list[parsed.get("currentViewIndex") ?? 0]; //TODO:
			if
			(Array.isArray(list) && list[0] instanceof CVUParsedViewDefinition && p && typeof p == "number") {
				view = CVUStateDefinition.fromCVUParsedDefinition(p)
			} else {
				throw "Invalid definition type"
			}
		} else {
			throw "Invalid definition type"
		}

		return view
	}

	// TODO: Refactor: Consider caching cascadingView based on the type of the item
	renderItemCell(item?: Item, //TODO:
							   rendererNames = [],
							   viewOverride?,
							   viewArguments = new ViewArguments()) {
		try {
			let context = this.context
			if (!context) {
				throw "Exception: MemriContext is not defined in views"
			}

			if (!item) {
				throw "Exception: No item is passed to render cell"
			}

			function searchForRenderer(viewDefinition) {
				let parsed = context.views.parseDefinition(viewDefinition)
				for (var def of parsed?.get("rendererDefinitions")) {//TODO
					for (var name of rendererNames) {
						if (def.name == name) {
							if (def.get("children") != undefined) {
								cascadeStack.push(def)
								return true
							}
						}
					}
				}
				return false
			}

			var cascadeStack = []

			// If there is a view override, find it, otherwise
			if (viewOverride) {
				let viewDefinition = context.views.fetchDefinitions(viewOverride)[0]
				if (viewDefinition) {
					if (viewDefinition.itemType == "renderer") {
						let parsed = context.views.parseDefinition(viewDefinition)
						if (parsed && parsed instanceof CVUParsedRendererDefinition) {
							if (parsed.get("children") != undefined) { cascadeStack.push(parsed) }
							else {
								throw `Exception: Specified view does not contain any UI elements: ${viewOverride}`
							}
						} else {
							throw `Exception: View definition is missing: ${viewOverride}`
						}
					} else if (viewDefinition.itemType == "view") {
						searchForRenderer(viewDefinition)
					} else {
						throw `Exception: incompatible view type of ${viewDefinition.itemType ?? ""}, expected renderer or view`
					}
				} else {
					throw `Exception: Could not find view to override: ${viewOverride}`
				}
			} else {
				// Find views based on datatype
				outerloop: for (var needle of [`${item.genericType}[]`, "*[]"]) {
					for (var key of ["user", "defaults"]) {
						let viewDefinition = context.views.fetchDefinitions(needle, undefined, undefined, undefined, key)[0]
						if (viewDefinition) {
							if (searchForRenderer(viewDefinition)) { break outerloop}
						}
					}
				}
			}

			// If we cant find a way to render using one of the views,
			// then find a renderer for one of the renderers
			if (cascadeStack.length == 0) {
				for (var name of rendererNames) {
					for (var key of ["user", "defaults"]) {
						let viewDefinition = context.views.fetchDefinitions(undefined, name, "renderer", key)[0]
						if (viewDefinition) {
							let parsed = context.views.parseDefinition(viewDefinition)
							if (parsed instanceof CVUParsedRendererDefinition) {
								if (parsed.get("children") != undefined) { cascadeStack.push(parsed) }
							}
						}
					}
				}
			}

			if (cascadeStack.length == 0) {
				throw `Exception: Unable to find a way to render this element: ${item.genericType}`
			}

			// Create a new view
			let cascadingRendererConfig = new CascadingRendererConfig(undefined, cascadeStack, context.currentView)

			// Return the rendered UIElements in a UIElementView
			return cascadingRendererConfig.render(item, "*", viewArguments)
		} catch (error) {
			debugHistory.error(`Unable to render ItemCell: ${error}`)

			// TODO: Refactor: Log error to the user
			/*return new UIElementView(new UIElement(.Text,
										   {text: "Could not render this view"}), item)*/ //TODO:
		}
	}
}

//TODO: this is our way to load default views @mkslanc
function getDefaultViewContents() {
	//let urls = Bundle.main.urls("cvu", ".")
	var defaultsCVU = {
		"AnnotationListExample": require("text-loader!../../Resources/defaultCVU/annotation/AnnotationListExample.cvu"),
		"AnnotationUIExample": require("text-loader!../../Resources/defaultCVU/annotation/AnnotationUIExample.cvu"),
		"all-items-with-label": require("text-loader!../../Resources/defaultCVU/named/all-items-with-label.cvu"),
		"choose-item-by-query": require("text-loader!../../Resources/defaultCVU/named/choose-item-by-query.cvu"),
		"filter-starred": require("text-loader!../../Resources/defaultCVU/named/filter-starred.cvu"),
		"inbox": require("text-loader!../../Resources/defaultCVU/named/inbox.cvu"),
		"calendar": require("text-loader!../../Resources/defaultCVU/renderer/calendar.cvu"),
		"chart": require("text-loader!../../Resources/defaultCVU/renderer/chart.cvu"),
		"generalEditor": require("text-loader!../../Resources/defaultCVU/renderer/generalEditor.cvu"),
		"list": require("text-loader!../../Resources/defaultCVU/renderer/list.cvu"),
		"map": require("text-loader!../../Resources/defaultCVU/renderer/map.cvu"),
		"messages": require("text-loader!../../Resources/defaultCVU/renderer/messages.cvu"),
		"thumbnail": require("text-loader!../../Resources/defaultCVU/renderer/thumbnail.cvu"),
		"sessions": require("text-loader!../../Resources/defaultCVU/session/sessions.cvu"),
		"Account": require("text-loader!../../Resources/defaultCVU/type/Account.cvu"),
		"Address": require("text-loader!../../Resources/defaultCVU/type/Address.cvu"),
		"Any": require("text-loader!../../Resources/defaultCVU/type/Any.cvu"),
		"AuditItem": require("text-loader!../../Resources/defaultCVU/type/AuditItem.cvu"),
		"Country": require("text-loader!../../Resources/defaultCVU/type/Country.cvu"),
		"CryptoKey": require("text-loader!../../Resources/defaultCVU/type/CryptoKey.cvu"),
		"EmailMessage": require("text-loader!../../Resources/defaultCVU/type/EmailMessage.cvu"),
		"FaceCluster": require("text-loader!../../Resources/defaultCVU/type/FaceCluster.cvu"),
		"Importer": require("text-loader!../../Resources/defaultCVU/type/Importer.cvu"),
		"ImporterRun": require("text-loader!../../Resources/defaultCVU/type/ImporterRun.cvu"),
		"Indexer": require("text-loader!../../Resources/defaultCVU/type/Indexer.cvu"),
		"IndexerRun": require("text-loader!../../Resources/defaultCVU/type/IndexerRun.cvu"),
		"Label": require("text-loader!../../Resources/defaultCVU/type/Label.cvu"),
		"Location": require("text-loader!../../Resources/defaultCVU/type/Location.cvu"),
		"Message": require("text-loader!../../Resources/defaultCVU/type/Message.cvu"),
		"MessageChannel": require("text-loader!../../Resources/defaultCVU/type/MessageChannel.cvu"),
		//"Mixed": require("text-loader!../../Resources/defaultCVU/type/Mixed.cvu"),
		"Note": require("text-loader!../../Resources/defaultCVU/type/Note.cvu"),
		"Person": require("text-loader!../../Resources/defaultCVU/type/Person.cvu"),
		"Photo": require("text-loader!../../Resources/defaultCVU/type/Photo.cvu"),
		"ReceiptDemo": require("text-loader!../../Resources/defaultCVU/type/ReceiptDemo.cvu"),
		"Session": require("text-loader!../../Resources/defaultCVU/type/Session.cvu"),
		"SessionView": require("text-loader!../../Resources/defaultCVU/type/SessionView.cvu"),
		"DemoExample": require("text-loader!../../Resources/defaultCVU/user/DemoExample.cvu"),
	};
	let viewContents= [];
	for (let cvu in defaultsCVU) {
		viewContents.push(defaultsCVU[cvu]);
	}
	return viewContents.join("\n").replace(/\r/g,"");
}
