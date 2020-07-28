
// TODO: Move to integrate with some of the sessions features so that Sessions can be nested
import {CVU} from "../../parsers/cvu-parser/CVU";
import {debugHistory} from "./ViewDebugger";
import {settings} from "../../model/Settings";
import {
	ExprVariableList,
	ExprVariableType
} from "../../parsers/expression-parser/ExprNodes";
import {ExprInterpreter} from "../../parsers/expression-parser/ExprInterpreter";
import {setInMemoryObjectCache} from "../../model/InMemoryObjectCache";
import {getItem} from "../../gui/util";
import {Languages} from "./Languages";
import {DatabaseController} from "../../model/DatabaseController";
import {CacheMemri} from "../../model/Cache";
import {dataItemListToArray} from "../../model/schema";
import {RealmObjects} from "../../model/RealmLocal";
import {CVUStateDefinition} from "../../model/items/Item";
import {ViewArguments} from "./CascadableDict";

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

	load(context: MemriContext, callback) {
		// Store context for use within createCascadingView)
		this.context = context

		 this.setCurrentLanguage(this.context.settings.get("user/language") ?? "English")

		/*this.settingWatcher = this.context.settings.subscribe("device/debug/autoReloadCVU").forEach(function (item) {
			let value = item;
			if (typeof item == "boolean") {
				if (value && this.cvuWatcher == undefined) {
					this.listenForChanges()
				} else if (!value && this.cvuWatcher) {
					this.cvuWatcher.cancel()
					this.cvuWatcher = undefined;
				}
			}
		}.bind(this)) //TODO: maybe i wrong;*/

		// Done
		 callback()
	}

	listenForChanges() {
		if (!this.context?.podAPI.isConfigured) {
			return;
		}
		// Subscribe to changes in CVUStoredDefinition
		this.cvuWatcher = this.context?.cache.subscribe("CVUStoredDefinition").forEach(function (items) { // CVUStoredDefinition AND domain='user'
		this.reloadViews(items)
		}.bind(this))
	}

	// TODO: refactor when implementing settings UI call this when changing the language
	setCurrentLanguage(language) {
		this.languages.currentLanguage = language

		let definitions = this.fetchDefinitions("language")
			.map(function (item) {
				this.parseDefinition(item)
			}.bind(this)).filter(function (item) {
				return item != undefined;
			})

		this.languages.load(definitions)
	}

	// TODO: Refactor: distinguish between views and sessions
	// Load the default views from the package
	install() {
		if (!this.context) {
			throw "Context is not set"
		}
		let code = getDefaultViewContents()

		try {
			let cvu = new CVU(code, this.context, this.lookupValueOfVariables, this.executeFunction)
			let parsedDefinitions = cvu.parse() // TODO: this could be optimized

			/*let validator = new CVUValidator();
			if (!validator.validate(parsedDefinitions)) {
				validator.debug()
				if (validator.warnings.length > 0) {
					for (let message of validator.warnings) { debugHistory.warn(message) }
				}
				if (validator.errors.length > 0) {
					for (let message of validator.errors) { debugHistory.error(message) }
					throw `Exception: Errors in default view set:    \n${validator.errors.join("\n    ")}`
				}
			}*///TODO:
			DatabaseController.tryWriteSync(() => { // Start write transaction outside loop for performance reasons
				// Loop over lookup table with named views
				for (let def of parsedDefinitions) {
					var values = {
						"domain": "defaults",
						"definition": def.toString(),//TODO
					}

					if (def.selector != undefined) { values["selector"] = def.selector }
					if (def.name != undefined) { values["name"] = def.name }

					let selector = def.selector
					if (!selector) {
						throw "Exception: selector on parsed CVU is not defined"
					}

					if (def?.constructor?.name == "CVUParsedViewDefinition") {
						values["type"] = "view"
						//                    values["query"] = (def as! CVUParsedViewDefinition)?.query ?? ""
					} else if (def?.constructor?.name == "CVUParsedRendererDefinition") { values["type"] = "renderer" }
					else if (def?.constructor?.name == "CVUParsedDatasourceDefinition") { values["type"] = "datasource" }
					else if (def?.constructor?.name == "CVUParsedStyleDefinition") { values["type"] = "style" }
					else if (def?.constructor?.name == "CVUParsedColorDefinition") { values["type"] = "color" }
					else if (def?.constructor?.name == "CVUParsedLanguageDefinition") { values["type"] = "language" }
					else if (def?.constructor?.name == "CVUParsedSessionsDefinition") { values["type"] = "sessions" }
					else if (def?.constructor?.name == "CVUParsedSessionDefinition") { values["type"] = "session" }
					else { throw "Exception: unknown definition" }

					// Store definition
					CacheMemri.createItem("CVUStoredDefinition", values,
                        `selector = '${selector}' and domain = 'defaults'`);
				}
			})
		} catch (error) {
			if (error?.constructor?.name == "ParseErrors") {
				// TODO: Fatal error handling
				throw `Parse Error: ${error.toErrorString()}`
			} else {
				throw error
			}
		}
	}

	static formatDate(date, dateFormat?) {//TODO:
		let showAgoDate = settings.get("user/general/gui/showDateAgo")

		if (date) {
			/*// Compare against 36 hours ago
			if (dateFormat != undefined || showAgoDate == false || date.timeIntervalSince(new Date(-129_600)) < 0) {//TODO
				let dateFormatter = new DateFormatter()

				dateFormatter.dateFormat = dateFormat ?? Settings.get("user/formatting/date") ?? "yyyy/MM/dd HH:mm"
				dateFormatter.locale = Locale("en_US")
				dateFormatter.timeZone = TimeZone(0)

				return dateFormatter.string(date)
			} else {
				return date.timestampString ?? ""
			}*/ //TODO:
			return date;
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
		let realm = DatabaseController.getRealm()
		// Fetch the value of the right property on the right object
		switch (name) {
			case "setting":
				let f = function (args?) { // (value:String) -> Any? in
					//#warning("@Toby - how can we re-architect this?")
					let value = args[0];
					if (typeof value == "string") {
						let x = settings.get(value/*, type: Double.self*/);
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
					return getItem(typeName, uid)
				}
			case "me": return realm.objects("Person").filtered("ANY allEdges.type = 'me'")[0]
			case "context": return this.context
			case "sessions": return this.context?.sessions
			case "currentSession":
			case "session": return this.context?.currentSession
			case "currentView":
			case "view": return this.context?.cascadingView
			case "singletonItem":
				let itemRef = viewArguments?.get(".");
				let item = this.context?.currentView?.resultSet.singletonItem
				if (itemRef) {
					return itemRef
				} else if (item) {
					return item
				} else {
					throw "Exception: Missing object for property getter"
				}
			default:
				let value = viewArguments.get(name)
				if (value) { return value }
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
			throw `Exception: Recursion detected while expanding variable ${lookup}`
		}

		var i = 0
		for (var node of lookup.sequence) {
			i += 1
			if (node?.constructor?.name == "ExprVariableNode") {
				if (first) {
					// TODO: move to CVU validator??
					if (node.list == ExprVariableList.list || node.type != ExprVariableType.propertyOrItem) {
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
			if (isFunction && i == lookup.sequence.length && value && value?.constructor?.name == "Item") {
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
					if (dataItem?.constructor?.name == "Item") {
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
					} else if (typeof v === "string") {
						switch (node.name) {
							case "uppercased": value = v.toUpperCase(); break
							case "lowercased": value = v.toLowerCase(); break
							case "camelCaseToWords": value = v.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()); break//TODO
							case "plural": value = v + "s"; break;
							case "firstUppercased": value = v.charAt(0).toUpperCase() + v.slice(1); break
							case "plainString": value = v/*.strippingHTMLtags()*/; //TODO: strip html tags
							default:
								// TODO: Warn
								break
						}
					} else if (value?.constructor?.name == "Date") {
						switch (node.name) {
							case "format":
							/*guard isFunction else { throw "You must call .format() as a function" }

                            value = { (args: [Any?]?) -> Any? in
                            if args?.count == 0 { return Views.formatDate(date) }
                            else { return Views.formatDate(date, dateFormat: args?[0] as? String) }
                        }
                        case "timeSince1970": value = date.timeIntervalSince1970
                        case "timeSinceNow": value = date.timeIntervalSinceNow*/
							default:
								// TODO: Warn
								debugHistory.warn("Could not find property \(node.name) on string")
						}
					} else if (v?.constructor?.name == "Edge") {//TODO
						switch (node.name) {
							case "source": value = v.source(); break;
							case "target": value = v.target(); break
							case "item": value = v.item(); break
							case "label": value = v.edgeLabel; break
							case "type": value = v.type; break
							case "sequence": value = v.sequence; break
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on edge`)
								break
						}
					} else if (v?.constructor?.name == "RealmObjects") {//TODO
						switch (node.name) {
							case "count": value = v.length; break
							case "first": value = v[0]; break
							case "last": value = v[v.length - 1]; break
							//                        case "sum": value = v.sum; break
							case "min": value = v.min; break//TODO
							case "max": value = v.max; break//TODO
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on list of edge`)
								break
						}
					} else if (v?.constructor?.name == "Realm".List) {//TODO
						switch (node.name) {
							case "count": value = v.length; break//TODO
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on list`)
								break
						}
					} else if (typeof v.subscript == "function") {//Subscriptable
						value = v[node.name]
					}
					// CascadingRenderer??
					else if (typeof v === "object") {//TODO:
						if (v.objectSchema[node.name] == null) {
							// TODO: error handling
							this.recursionCounter = 0
							throw `No variable with name ${node.name}`
						} else {
							value = v[node.name] // How to handle errors?
						}
					}
				}
			}
			// .addresses[primary = true] || [0]
			else if (node?.constructor?.name == "ExprLookupNode") {
				// TODO: This is implemented very slowly first. Let's think about an optimization

				let interpret = new ExprInterpreter(node, this.lookupValueOfVariables, this.executeFunction)
				let list = dataItemListToArray(value) //value; //TODO:
				let args = viewArguments?.copy() ?? new ViewArguments();
				let expr = node.sequence[0]

				for (let item in list) {
					args.set(".", list[item]);
					let hasFound = interpret.execSingle(expr, args);
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

	executeFunction(lookup, args, viewArguments?) {
		let f = this.lookupValueOfVariables(lookup,
										   viewArguments,
										   true)

		if (f /*as? ([Any?]?) -> Any*/) {//TODO
			if (typeof f == "function") {
				return f(args);
			} else {
				throw `Could not find function to execute: ${lookup.toString()}`
			}
		}

		let x = undefined;
		return x
	}

	fetchDefinitions(selector?: string, name?: string, type?: string, query?: string, domain?: string) {
		var filter = [];

		if (selector) { filter.push(`selector = '${selector}'`) }
		else {
			if (type) { filter.push(`type = '${type}'`) }
			if (name) { filter.push(`name = '${name}'`) }
			if (query) { filter.push(`query = '${query}'`) }
		}

		if (domain) { filter.push(`domain = '${domain}'`) }

		return DatabaseController.read((item) => item.objects("CVUStoredDefinition")
			.filtered(filter.join(" AND ")).map ( (def) => { return (def["_type"] == "CVUStoredDefinition")? def: undefined}) )  ?? []//TODO
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
		//#warning("Turned off caching temporarily due to issue with UserState being cached wrongly (and then changed in cache)")
		let cached = -1; //InMemoryObjectCache.get(strDef)
		if (cached?.constructor?.name == "CVU") {//TODO:?????
			return cached.parse()[0]
		} else if (viewDef.definition) {
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
		if (stored.type == "view") {
			view = CVUStateDefinition.fromCVUStoredDefinition(stored)
		} else if (stored.type == "session") {
			let parsed = this.parseDefinition(stored);
			if (!parsed) {
				throw "Unable to parse state definition"
			}
			let list = parsed["views"];
			let p = list[parsed["currentViewIndex"] ?? 0];
			if
			(Array.isArray(list) && list[0]?.constructor?.name == "CVUParsedViewDefinition" && p && typeof p == "number") {
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
	renderItemCell(item?: Item,
							   rendererNames = [],
							   viewOverride?,
							   viewArguments?) {
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
				for (var def of parsed["rendererDefinitions"]) {//TODO
					for (var name of rendererNames) {
						// TODO: Should this first search for the first renderer everywhere
						//       before trying the second renderer?
						if (def.name == name) {
							if (def["children"] != undefined) {
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
					if (viewDefinition.type == "renderer") {
						let parsed = context.views.parseDefinition(viewDefinition)
						if (parsed && parsed?.constructor?.name == "CVUParsedRendererDefinition") {
							if (parsed["children"] != undefined) { cascadeStack.push(parsed) }
							else {
								throw `Exception: Specified view does not contain any UI elements: ${viewOverride}`
							}
						} else {
							throw `Exception: View definition is missing: ${viewOverride}`
						}
					} else if (viewDefinition.type == "view") {
						searchForRenderer(viewDefinition)
					} else {
						throw `Exception: incompatible view type of ${viewDefinition.type ?? ""}, expected renderer or view`
					}
				} else {
					throw `Exception: Could not find view to override: ${viewOverride}`
				}
			} else {
				// Find views based on datatype
				outerloop: for (var needle of [`${item.genericType}[]`, "*[]"]) {
					for (var key in ["user", "defaults"]) {
						let viewDefinition = context.views.fetchDefinitions(needle, key)[0]
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
						let viewDefinition = context.views.fetchDefinitions(name, "renderer", key)[0]
						if (viewDefinition) {
							let parsed =  context.views.parseDefinition(viewDefinition)
							if (parsed?.constructor?.name == "CVUParsedRendererDefinition") {
								if (parsed["children"] != undefined) { cascadeStack.push(parsed) }
							}
						}
					}
				}
			}

			if (cascadeStack.length == 0) {
				throw `Exception: Unable to find a way to render this element: ${item.genericType}`
			}

			// Create a new view
			let cascadingRenderConfig = new CascadingRenderConfig(undefined, cascadeStack, context.currentView) //TODO:

			// Return the rendered UIElements in a UIElementView
			return cascadingRenderConfig.render(item, viewArguments)
		} catch (error) {
			debugHistory.error(`Unable to render ItemCell: ${error}`)

			// TODO: Refactor: Log error to the user
			/*return new UIElementView(new UIElement(.Text,
										   {text: "Could not render this view"}), item)*/ //TODO:
		}
	}
}

function getDefaultViewContents() {
	//let urls = Bundle.main.urls("cvu", ".")
	var defaultsCVU = {
		"all-items-with-label": require("text-loader!../defaults/named/all-items-with-label.cvu"),
		"choose-item-by-query": require("text-loader!../defaults/named/choose-item-by-query.cvu"),
		"filter-starred": require("text-loader!../defaults/named/filter-starred.cvu"),
		"calendar": require("text-loader!../defaults/renderer/calendar.cvu"),
		"chart": require("text-loader!../defaults/renderer/chart.cvu"),
		"generalEditor": require("text-loader!../defaults/renderer/generalEditor.cvu"),
		"list": require("text-loader!../defaults/renderer/list.cvu"),
		"map": require("text-loader!../defaults/renderer/map.cvu"),
		"messages": require("text-loader!../defaults/renderer/messages.cvu"),
		"thumbnail": require("text-loader!../defaults/renderer/thumbnail.cvu"),
		"sessions": require("text-loader!../defaults/session/sessions.cvu"),
		"defaults": require("text-loader!../defaults/styles/defaults.cvu"),
		"Address": require("text-loader!../defaults/type/Address.cvu"),
		"Any": require("text-loader!../defaults/type/Any.cvu"),
		"AuditItem": require("text-loader!../defaults/type/AuditItem.cvu"),
		"Country": require("text-loader!../defaults/type/Country.cvu"),
		"Importer": require("text-loader!../defaults/type/Importer.cvu"),
		"ImporterInstance": require("text-loader!../defaults/type/ImporterInstance.cvu"),
		"Indexer": require("text-loader!../defaults/type/Indexer.cvu"),
		"IndexerRun": require("text-loader!../defaults/type/IndexerRun.cvu"),
		"Label": require("text-loader!../defaults/type/Label.cvu"),
		"Location": require("text-loader!../defaults/type/Location.cvu"),
		//"Mixed": require("text-loader!../defaults/type/Mixed.cvu"),
		"Note": require("text-loader!../defaults/type/Note.cvu"),
		"Person": require("text-loader!../defaults/type/Person.cvu"),
		"Photo": require("text-loader!../defaults/type/Photo.cvu"),
		"Session": require("text-loader!../defaults/type/Session.cvu"),
		"SessionView": require("text-loader!../defaults/type/SessionView.cvu")
	};
	let viewContents= [];
	for (let cvu in defaultsCVU) {
		viewContents.push(defaultsCVU[cvu]);
	}
	return viewContents.join("\n").replace(/\r/g,"");
}
