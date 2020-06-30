
// TODO: Move to integrate with some of the sessions features so that Sessions can be nested
class Views {
	///
	languages = new Languages()//TODO
	///
	context

	recursionCounter = 0
	realm

	constructor(rlm) {
		this.realm = rlm
	}

	load(mn, callback) {
		// Store context for use within createCascadingView)
		this.context = mn

		 this.setCurrentLanguage(this.context?.settings.get("user/language") ?? "English")

		// Done
		 callback()
	}

	// TODO: refactor when implementing settings UI call this when changing the language
	setCurrentLanguage(language) {
		this.languages.currentLanguage = language

		let definitions = this.fetchDefinitions("language")
			.compactMap(function(item) { this.parseDefinition(item) })//TODO

		this.languages.load(definitions)
	}

	install() {
		// Load the default views from the package
		 this.loadStandardViewSetIntoDatabase()
	}

	// TODO: Refactor: distinguish between views and sessions
	loadStandardViewSetIntoDatabase() {
		let context = this.context
		if (!context) {
			throw "Context is not set"
		}

		let code = this.getDefaultViewContents()

		try {
			let cvu = new CVU(code, context, this.lookupValueOfVariables, this.executeFunction)
			let parsedDefinitions = cvu.parse() // TODO: this could be optimized

			let validator = new CVUValidator()
			if (!validator.validate(parsedDefinitions)) {
				validator.debug()
				if (validator.warnings.length > 0) {
					for (var message of validator.warnings) { debugHistory.warn(message) }
				}
				if (validator.errors.length > 0) {
					for (var message of validator.errors) { debugHistory.error(message) }
					throw `Exception: Errors in default view set:    \n${validator.errors.join("\n    ")}`
				}
			}

			// Loop over lookup table with named views
			for (var def of parsedDefinitions) {
				var values = {
					selector: def.selector,
					name: def.name,
					domain: "defaults", // TODO: Refactor, is it default or defaults
					definition: def.description,
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

				values["memriID"] = "defaults:" + (def.selector ?? "unknown")

				// Store definition
				 realm.write { realm.create(CVUStoredDefinition.constructor,
											   values, .modified) }//TODO
			}
		} catch (error) {
			if (error instanceof CVUParseErrors) {
				// TODO: Fatal error handling
				throw `Parse Error: ${error.toString(code)}`
			} else {
				throw error
			}
		}
	}

	formatDate(date) {
		let showAgoDate = Settings.get("user/general/gui/showDateAgo")

		if (date) {
			// Compare against 36 hours ago
			if (showAgoDate == false || date.timeIntervalSince(new Date(-129_600)) < 0) {//TODO
				let dateFormatter = new DateFormatter()

				dateFormatter.dateFormat = Settings.get("user/formatting/date") ?? "yyyy/MM/dd HH:mm"
				dateFormatter.locale = Locale("en_US")
				dateFormatter.timeZone = TimeZone(0)

				return dateFormatter.string(date)
			} else {
				return date.timestampString ?? ""
			}
		} else {
			return "never"
		}
	}

	formatDateSinceCreated(date) {
		if (date) {
			return date.timeDelta ?? ""
		} else {
			return "never"
		}
	}

	resolveEdge(_) {
		// TODO: REFACTOR: implement
		throw "not implemented"
	}

	getGlobalReference(name, viewArguments) {
		// Fetch the value of the right property on the right object
		switch (name) {
			case "context": return this.context
			case "sessions": return this.context?.sessions
			case "currentSession": fallthrough//TODO
			case "session": return this.context?.currentSession
			case "view": return this.context?.cascadingView
			case "dataItem":
				let itemRef = viewArguments.get(".")
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
				throw `Exception: Unknown object for property getter: ${name}`
		}
	}

	lookupValueOfVariables1(lookup, viewArguments) {
		let x = this.lookupValueOfVariables(//TODO
			lookup,
			viewArguments,
			false
		)
		return x
	}

	lookupValueOfVariables(lookup, viewArguments, isFunction =  false) {//TODO
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

			if (isFunction && i == lookup.sequence.length) {
				value = (value)?.functions[(node as? ExprVariableNode)?.name ?? ""]//TODO
				if (value == null) {
					// TODO: parse [blah]
					this.recursionCounter = 0
					let message = "Exception: Invalid function call. Could not find"
					throw `${message} ${(node/* as? ExprVariableNode*//*TODO*/)?.name ?? ""}`
				}
				break
			}

			if (node instanceof ExprVariableNode) {
				if (first) {
					let name = node.name == "__DEFAULT__" ? "dataItem" : node.name
					try {
						value = this.getGlobalReference(name, viewArguments)
						first = false
					} catch (error) {
						this.recursionCounter = 0
						throw error
					}
				} else {
					let dataItem = value
					let v = value
					if (dataItem instanceof DataItem) {
						if (dataItem.objectSchema[node.name] == null) {
							// TODO: Warn
							console.log(`Invalid property access '${node.name}'`)
							debugHistory.warn(`Invalid property access '${node.name}'`)
							this.recursionCounter -= 1
							return null
						} else {
							value = dataItem[node.name]
						}
					} else if (typeof v === "string") {
						switch (node.name) {
							case "uppercased": value = v.toUpperCase(); break
							case "lowercased": value = v.toLowerCase(); break
							case "camelCaseToWords": value = v.camelCaseToWords(); break//TODO
							case "plural": value = v + "s"; break // TODO:
							case "firstUppercased": value = v.capitalizingFirst(); break//TODO
							default:
								// TODO: Warn
								break
						}
					} else if (v instanceof RealmSwift.List<Edge>) {//TODO
						switch (node.name) {
							case "count": value = v.length; break
							case "first": value = v[0]; break
							case "last": value = v[v.length - 1]; break
							//                        case "sum": value = v.sum; break
							case "min": value = v.min; break//TODO
							case "max": value = v.max; break//TODO
							default:
								// TODO: Warn
								break
						}
					} else if (v instanceof RealmSwift.ListBase) {//TODO
						switch (node.name) {
							case "count": value = v.length; break//TODO
							default:
								// TODO: Warn
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
					else if (typeof v === "object") {
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
				// TODO: REFACTOR: parse and query
			}

			let edge = value
			if (edge instanceof Edge) {
				value = this.resolveEdge(edge)
			}
		}

		// Format a date
		let date = value
		if (date instanceof Date) {
			value = this.formatDate(date)
		}

		// TODO: check for string mode
		//        // Get the image uri from a file
		//        else if (let file = value as? File) {
		//            if (T.self == String.self) {
		//                value = file.uri
		//            }
		//        }

		//        if (let lastPart = lastPart, lastObject?.objectSchema[lastPart]?.isArray ?? false,
		//           let className = lastObject?.objectSchema[lastPart]?.objectClassName) {
//
		//            // Convert Realm List into Array
		//            value = DataItemFamily(rawValue: className.lowercased())!.getCollection(value as Any)
		//        }

		this.recursionCounter -= 1

		return value
	}

	executeFunction(lookup, args, viewArguments) {
		let f = this.lookupValueOfVariables(lookup,
										   viewArguments,
										   true)

		if (f /*as? ([Any?]?) -> Any*/) {//TODO
			return f(args)
		}

		let x = null
		return x
	}

	fetchDefinitions(selector =  null, name =  null, type =  null, query =  null, domain =  null) {
		var filter = []

		if (selector) { filter.push(`selector = '${selector}'`) }
		else {
			if (type) { filter.push(`type = '${type}'`) }
			if (name) { filter.push(`name = '${name}'`) }
			if (query) { filter.push(`query = '${query}'`) }
		}

		if (domain) { filter.push(`domain = '${domain}'`) }

		return realm.objects(CVUStoredDefinition.constructor)
			.filter(filter.join(" AND "))//TODO
			.map (function (){ (def) -> CVUStoredDefinition in def })//TODO
	}

	// TODO: REfactor return list of definitions
	parseDefinition(viewDef) {
		if (!viewDef) {
			throw "Exception: Missing CVU definition"
		}

		let context = this.context
		if (!context) {
			throw "Exception: Missing Context"
		}

		let cached = InMemoryObjectCache.get(`memriID: ${viewDef.memriID}`)
		if (cached instanceof CVU) {
			return cached.parse()[0]
		} else if (viewDef.definition) {
			let definition = viewDef.definition
			let viewDefParser = new CVU(definition, context,
									this.lookupValueOfVariables,
									this.executeFunction)
			 InMemoryObjectCache.set(`memriID: ${viewDef.memriID}`, viewDefParser)

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

	createCascadingView(sessionView =  null) {
		let context = this.context
		if (!context) {
			throw "Exception: MemriContext is not defined in views"
		}

		let viewFromSession = sessionView ?? context.sessions.currentSession.currentView
		let cascadingView = new CascadingView().fromSessionView(viewFromSession, context)

		// TODO: REFACTOR: move these to a better place (context??)

		// turn off editMode when navigating
		if (context.sessions.currentSession.isEditMode == true) {
			realmWriteIfAvailable(realm) {//TODO
				context.sessions.currentSession.isEditMode = false
			}
		}

		// hide filterpanel if (view doesnt have a button to open it
		if (context.sessions.currentSession.showFilterPanel) {
			if (cascadingView.filterButtons.filter(function(item){ item.name == .toggleFilterPanel })).length == 0 {//TODO
				realmWriteIfAvailable(realm) {
					context.sessions.currentSession.showFilterPanel = false
				}
			}
		}

		return cascadingView
	}

	// TODO: Refactor: Consider caching cascadingView based on the type of the item
	renderItemCell(dataItem,
							   rendererNames = [],
							   viewOverride = null,
							   viewArguments) {
		try {
			let context = this.context
			if (!context) {
				throw "Exception: MemriContext is not defined in views"
			}

			function searchForRenderer(viewDefinition) {
				let parsed = context.views.parseDefinition(viewDefinition)
				for (var def of parsed["renderDefinitions"]) {//TODO
					for (var name of rendererNames) {
						// TODO: Should this first search for the first renderer everywhere
						//       before trying the second renderer?
						if (def.name == name) {
							if (def["children"] != null) {
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
							if (parsed["children"] != null) { cascadeStack.push(parsed) }
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
								if (parsed["children"] != null) { cascadeStack.push(parsed) }
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
			return new UIElementView(new UIElement(.Text,
										   {text: "Could not render this view"}), dataItem)
		}
	}
}

function getDefaultViewContents() {
	let urls = Bundle.main.urls("cvu", ".")
	return (urls ?? []).compactMap (function(item){ String(item)/*TODO*/ }).join("\n")
}
