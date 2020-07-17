
// TODO: Move to integrate with some of the sessions features so that Sessions can be nested
import {CVU} from "../../parsers/cvu-parser/CVU";
import {CVUValidator} from "../../parsers/cvu-parser/CVUValidator";
import {debugHistory} from "./ViewDebugger";
import {
	CVUParsedColorDefinition,
	CVUParsedDatasourceDefinition, CVUParsedLanguageDefinition,
	CVUParsedRendererDefinition, CVUParsedSessionDefinition, CVUParsedSessionsDefinition, CVUParsedStyleDefinition,
	CVUParsedViewDefinition
} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {CVUParseErrors, ParseErrors} from "../../parsers/cvu-parser/CVUParseErrors";
import {settings} from "../../model/Settings";
import {
	ExprLookupNode,
	ExprVariableList,
	ExprVariableNode,
	ExprVariableType
} from "../../parsers/expression-parser/ExprNodes";
import {UserState} from "./UserState";
import {CascadingView} from "./CascadingView";
import {ExprInterpreter} from "../../parsers/expression-parser/ExprInterpreter";
import {getInMemoryObjectCache, setInMemoryObjectCache} from "../../model/InMemoryObjectCache";
import {realmWriteIfAvailable} from "../../gui/util";
import {ActionFamily} from "./Action";
import {Languages} from "./Languages";

export class Views {
	///
	languages = new Languages()
	///
	context

	recursionCounter = 0
	realm
	CVUWatcher
	settingWatcher

	constructor(rlm?) {
		this.realm = rlm
	}

	load(mn, callback) {
		// Store context for use within createCascadingView)
		this.context = mn

		 this.setCurrentLanguage(this.context?.settings.get("user/language") ?? "English")

		this.settingWatcher = this.context?.settings.subscribe("device/debug/autoReloadCVU").forEach(function (item) {
			let value = item;
			if (typeof item == "boolean") {
				if (value && this.CVUWatcher == undefined) {
					this.listenForChanges()
				} else if (!value && this.CVUWatcher) {
					this.CVUWatcher.cancel()
					this.CVUWatcher = undefined;
				}
			}
		}.bind(this)) //TODO: maybe i wrong;

		// Done
		 callback()
	}

	listenForChanges() {
		// Subscribe to changes in CVUStoredDefinition
		this.CVUWatcher = this.context?.cache.subscribe("CVUStoredDefinition").forEach(function (items) { // CVUStoredDefinition AND domain='user'
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

			let validator = new CVUValidator();
			if (!validator.validate(parsedDefinitions)) {
				validator.debug()
				if (validator.warnings.length > 0) {
					for (let message of validator.warnings) { debugHistory.warn(message) }
				}
				if (validator.errors.length > 0) {
					for (let message of validator.errors) { debugHistory.error(message) }
					throw `Exception: Errors in default view set:    \n${validator.errors.join("\n    ")}`
				}
			}

			// Loop over lookup table with named views
			for (let def in parsedDefinitions) {
				var values = {
					"selector": parsedDefinitions[def].selector,
					"name": parsedDefinitions[def].name,
					"domain": "defaults",
					"definition": parsedDefinitions[def].toString(),//TODO
				}
				let selector = parsedDefinitions[def].selector
				if (!selector) {
					throw "Exception: selector on parsed CVU is not defined"
				}

				if (def instanceof CVUParsedViewDefinition) {
					values["type"] = "view"
					//                    values["query"] = (def as! CVUParsedViewDefinition)?.query ?? ""
				} else if (def instanceof CVUParsedRendererDefinition) { values["type"] = "renderer" }
			else if (def instanceof CVUParsedDatasourceDefinition) { values["type"] = "datasource" }
			else if (def instanceof CVUParsedStyleDefinition) { values["type"] = "style" }
			else if (def instanceof CVUParsedColorDefinition) { values["type"] = "color" }
			else if (def instanceof CVUParsedLanguageDefinition) { values["type"] = "language" }
			else if (def instanceof CVUParsedSessionsDefinition) { values["type"] = "sessions" }
			else if (def instanceof CVUParsedSessionDefinition) { values["type"] = "session" }
			else { throw "Exception: unknown definition" }

				// Store definition
				/*Cache.createItem(CVUStoredDefinition.self, values: values,
					unique: "selector = '\(selector)' and domain = 'defaults'")*/ //TODO
			}
		} catch (error) {
			if (error instanceof ParseErrors) {
				// TODO: Fatal error handling
				throw `Parse Error: ${error.toErrorString()}`
			} else {
				throw error
			}
		}
	}

	formatDate(date) {
		let showAgoDate = settings.get("user/general/gui/showDateAgo")

		if (date) {
			/*// Compare against 36 hours ago
			if (showAgoDate == false || date.timeIntervalSince(new Date(-129_600)) < 0) {//TODO
				let dateFormatter = new DateFormatter()

				dateFormatter.dateFormat = Settings.get("user/formatting/date") ?? "yyyy/MM/dd HH:mm"
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

	formatDateSinceCreated(date) {
		if (date) {
			return date/*.timeDelta*/ ?? ""//TODO:
		} else {
			return "never"
		}
	}

	reloadViews(items) {
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
			case "me": return this.realm.objects(Person.constructor).filter("ANY allEdges.type = 'me'")[0] //TODO:
			case "context": return this.context
			case "sessions": return this.context?.sessions
			case "currentSession":
			case "session": return this.context?.currentSession
			case "view": return this.context?.cascadingView
			case "dataItem":
				let itemRef = viewArguments?.get(".");
				let item = this.context?.cascadingView.resultSet.singletonItem
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
			if (node instanceof ExprVariableNode) {
				if (first) {
					// TODO: move to CVU validator??
					if (node.list == ExprVariableList.list || node.type != ExprVariableType.propertyOrItem) {
						throw "Unexpected edge lookup. No source specified"
					}


				let name = node.name == "@@DEFAULT@@" ? "dataItem" : node.name;
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
			if (isFunction && i == lookup.sequence.length) {
				value = value?.functions[node.name]
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
					} else if (v instanceof Edge) {//TODO
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
					} else if (v instanceof RealmSwift.Results) {//TODO
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
					} else if (v instanceof RealmSwift.ListBase) {//TODO
						switch (node.name) {
							case "count": value = v.length; break//TODO
							default:
								// TODO: Warn
								debugHistory.warn(`Could not find property ${node.name} on list`)
								break
						}
					} else if (v instanceof MemriContext) {
						value = v[node.name]
					} else if (v instanceof UserState) {
						value = v.get(node.name)
					} else if (v instanceof CascadingView) {
						value = v[node.name]
					} else if (v instanceof CascadingDatasource) {
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
			else if (node instanceof ExprLookupNode) {
				// TODO: This is implemented very slowly first. Let's think about an optimization

				let interpret = new ExprInterpreter(node, this.lookupValueOfVariables, this.executeFunction)
				let list =/* dataItemListToArray(value as Any)*/ value; //TODO:
				let args = new ViewArguments().clone(viewArguments, false)
				let expr = node.sequence[0]

				for (let item in list) {
					args.set(".", list[item]);
					let hasFound = interpret.execSingle(expr, args);
					if (hasFound &&
						new ExprInterpreter().evaluateBoolean(hasFound)) {
						value = list[item];
						break;
					}
				}
			}

			if (value == undefined) {
				break
			}
		}

		// Format a date
		let date = value
		if (date instanceof Date) {
			value = this.formatDate(date)
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

		return this.realm.objects(CVUStoredDefinition.constructor)
			.filter(filter.join(" AND "))//TODO
			/*.map (function (def){  CVUStoredDefinition in def })*///TODO
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

		let cached = getInMemoryObjectCache(strDef); //TODO
		if (cached instanceof CVU) {
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
				let validator = new CVUValidator()
				if (!validator.validate([firstDefinition])) {
					validator.debug()
					if (validator.warnings.length > 0) {
						for (var message of validator.warnings) { debugHistory.warn(message) }
					}
					if (validator.errors.length > 0) {
						for (var message of validator.errors) { debugHistory.error(message) }
						throw `Exception: Errors in default view set:    \n${validator.errors.join("\n    ")}`
					}
				}

				return firstDefinition
			}
		} else {
			throw "Exception: Missing view definition"
		}

		return null
	}

	createCascadingView(sessionView?) {
		let context = this.context
		if (!context) {
			throw "Exception: MemriContext is not defined in views"
		}
		var cascadingView;
		let viewFromSession = sessionView ?? context.sessions.currentSession.currentView
		if (viewFromSession) {
			cascadingView = new CascadingView().fromSessionView(viewFromSession, context);
		} else {
			throw "Unable to find currentView"
		}


		// TODO: REFACTOR: move these to a better place (context??)

		// turn off editMode when navigating
		if (context.sessions?.currentSession?.isEditMode == true) {
			realmWriteIfAvailable(this.realm, function () {
				context.sessions.currentSession.isEditMode = false
			})
		}

		// hide filterpanel if (view doesnt have a button to open it
		if (context.sessions?.currentSession?.showFilterPanel ?? false) {
			if (cascadingView.filterButtons.filter(function(item){ return item.name == ActionFamily.toggleFilterPanel }).length == 0) {
				realmWriteIfAvailable(this.realm, function () {
					context.sessions.currentSession.showFilterPanel = false
				})
			}
		}

		return cascadingView
	}

	// TODO: Refactor: Consider caching cascadingView based on the type of the item
	renderItemCell(dataItem?,
							   rendererNames = [],
							   viewOverride?,
							   viewArguments?) {
		try {
			let context = this.context
			if (!context) {
				throw "Exception: MemriContext is not defined in views"
			}

			if (!dataItem) {
				throw "Exception: No item is passed to render cell"
			}

			function searchForRenderer(viewDefinition) {
				let parsed = context.views.parseDefinition(viewDefinition)
				for (var def of parsed["renderDefinitions"]) {//TODO
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
						if (parsed && parsed instanceof CVUParsedRendererDefinition) {
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
				outerloop: for (var needle of [`${dataItem.genericType}[]`, "*[]"]) {
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
							if (parsed instanceof CVUParsedRendererDefinition) {
								if (parsed["children"] != undefined) { cascadeStack.push(parsed) }
							}
						}
					}
				}
			}

			if (cascadeStack.length == 0) {
				throw `Exception: Unable to find a way to render this element: ${dataItem.genericType}`
			}

			// Create a new view
			let cascadingRenderConfig = new CascadingRenderConfig(cascadeStack, viewArguments)

			// Return the rendered UIElements in a UIElementView
			return cascadingRenderConfig.render(dataItem)
		} catch (error) {
			debugHistory.error(`Unable to render ItemCell: ${error}`)

			// TODO: Refactor: Log error to the user
			/*return new UIElementView(new UIElement(.Text,
										   {text: "Could not render this view"}), dataItem)*/ //TODO:
		}
	}
}

function getDefaultViewContents() {
	let urls = Bundle.main.urls("cvu", ".")
	return (urls ?? []).map (function(item){ return String(item)}).filter(function (item) {
		return item != undefined;
	}).join("\n")
}
