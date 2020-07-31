//
//  Session.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import {debugHistory} from "../cvu/views/ViewDebugger";
import {CVUParsedSessionDefinition} from "../parsers/cvu-parser/CVUParsedDefinition";
import {DatabaseController} from "../model/DatabaseController";
import {CascadableView} from "../cvu/views/CascadableView";
import {Realm} from "../model/RealmLocal";
import {CacheMemri} from "../model/Cache";
import {ActionFamily} from "../cvu/views/Action";
import {CVUStateDefinition, EdgeSequencePosition} from "../model/items/Item";

export class Session  /*extends Equatable, Subscriptable*/ {
    subscript() {
        //mock function;
    }

    /// The name of the item.
    get name() { return this.parsed.get("name") }
    set name(value) { this.setState("name", value) }
    /// TBD
    get currentViewIndex(){ return Number(this.parsed.get("currentViewIndex") ?? 0) }
    set currentViewIndex(value) { this.setState("currentViewIndex", Number(value)) }
    /// TBD
    get editMode(){ return Boolean(this.parsed.get("editMode")) ?? false }
    set editMode(value) { this.setState("editMode", value) }
    /// TBD

    get showContextPane(){ return Boolean(this.parsed.get("showContextPane")) ?? false }
    set showContextPane(value) { this.setState("showContextPane", value) }
    /// TBD
    get showFilterPanel(){ return Boolean(this.parsed.get("showFilterPanel")) ?? false }
    set showFilterPanel(value) { this.setState("showFilterPanel", value) }

    /// TBD
    get screenshot(){
        return this.state?.edge("screenshot")?.item(File)
    }
    set screenshot(value) {
        let file = value
        if (file) {
            try { this.state?.link(file, "screenshot", true) }
            catch (error) {
                debugHistory.error(`Unable to store screenshot: ${error}`)
            }
        }
        else {
            // Remove file: not implemented
            console.log("NOT IMPLEMENTED")
        }
    }

    uid?: Number
    parsed?: CVUParsedSessionDefinition
    get state() {
		return DatabaseController.read ((realm) => {
            realm.objectForPrimaryKey("CVUStateDefinition", this.uid)
        })
    }
    
    /// TBD
    views = []
    /// TBD
    sessions?: Sessions
    context?: MemriContext
    
	cancellables: AnyCancellable[] = []
    lastViewIndex: number = -1


    get swiftUIEditMode(){
        if (this.editMode) { return EditMode.active }
        else { return EditMode.inactive }
    }
    set swiftUIEditMode(value) {
        if (value == EditMode.active) { this.editMode = true }
        else { this.editMode = false }
    }

	get hasHistory() {
		return this.currentViewIndex > 0
	}

	get currentView(): CascadableView {
        return this.views[this.currentViewIndex]
	}

    constructor(state: CVUStateDefinition, sessions: Sessions) {
        this.sessions = sessions
        this.context = sessions.context
        
        if (state) {
            let uid = state.uid
            if (!uid) {
                throw "CVU state object is unmanaged"
            }
            
            this.uid = uid

            let p = this.context?.views.parseDefinition(state)
            
            if (!(p?.constructor?.name == "CVUParsedSessionDefinition")) {
                throw "Unable to parse state definition"
            }
            
            this.parsed = p
        
            // Check if there are views in the db

            let storedViewStates = state
                .edges("view")
                .sorted("sequence")
                .items("CVUStateDefinition")

            let parsedViews = this.parsed.get("viewDefinitions")

            if (storedViewStates && storedViewStates.length > 0) {
                for (let viewState of storedViewStates) {
                    this.views.push(new CascadableView(viewState, this))
                }
            }
            // Or if the views are encoded in the definition
            else if (parsedViews && parsedViews.length > 0 && parsedViews[0]?.constructor?.name == "CVUParsedViewDefinition")
            {
                DatabaseController.tryWriteSync(() => {
                    for (let parsed of parsedViews) {
                        let viewState = CVUStateDefinition.fromCVUParsedDefinition(parsed)
                        state.link(viewState, "view", EdgeSequencePosition.last)
                        this.views.push(new CascadableView(new CVUStateDefinition(viewState), this))
                    }
                })
                
                delete this.parsed?.get("viewDefinitions")
            }
            else {
                throw "CVU state definition is missing views"
            }
        }
        else {
            // Do nothing and expect a call to setCurrentView later
        }
    }

    get(propName) {
        switch (propName) {
            case "name": return this.name;
            case "editMode": return this.editMode
            case "showContextPane": return this.showContextPane
            case "showFilterPanel": return this.showFilterPanel
            case "screenshot": return this.screenshot
            default: return undefined;
        }
    }

    set(propName, value) {
        switch (propName) {
            case "name":
                this.name = value;
                break;
            case "editMode":
                this.editMode = value ?? false
                break;
            case "showContextPane":
                this.showContextPane = value ?? false
                break;
            case "showFilterPanel":
                this.showFilterPanel = value ?? false
                break;
            case "screenshot":
                this.screenshot = value
                break;
            default:
                // Do nothing
                debugHistory.warn(`Unable to set property: ${propName}`)
                return
        }
    }
/*
subscript(propName: String) -> Any? {
        get {
            switch propName {
            case "name": return name
            case "editMode": return editMode
            case "showContextPane": return showContextPane
            case "showFilterPanel": return showFilterPanel
            case "screenshot": return screenshot
            default: return nil
            }
        }
        set(value) {
            switch propName {
            case "name": name = value as? String
            case "editMode": editMode = value as? Bool ?? false
            case "showContextPane": showContextPane = value as? Bool ?? false
            case "showFilterPanel": showFilterPanel = value as? Bool ?? false
            case "screenshot": screenshot = value as? File
            default:
                // Do nothing
                debugHistory.warn("Unable to set property: \(propName)")
                return
            }
        }
    }

 */
    
    setState(name: string, value?) {
        if (this.parsed == undefined) { this.parsed = new CVUParsedSessionDefinition() }
        this.parsed.set(name, value);
        this.schedulePersist()
    }
    
    schedulePersist() {
        this.sessions?.schedulePersist()
    }
    
    persist() {
        DatabaseController.tryWriteSync((realm: Realm) => {
            var state = realm.objectForPrimaryKey("CVUStateDefinition", this.uid)
            if (state == undefined) {
                debugHistory.warn("Could not find stored session CVU. Creating a new one.")

                state = CacheMemri.createItem("CVUStateDefinition", {})

                let uid = state?.uid;
                if (!uid) {
                    throw "Exception: could not create state definition"
                }

                this.uid = uid
            }

            state?.set("definition", this.parsed?.toCVUString(0, "    "))

            let stateViewEdges = state?.edges("view")?.sorted("sequence")
            if (stateViewEdges) {
                var i = 0
                for (let edge of stateViewEdges) {
                    if (edge.targetItemID == this.views[i].uid) {
                        i += 1
                        continue
                    }
                    else {
                        break
                    }
                }
                if (i < stateViewEdges.length) {
                    for (let j = stateViewEdges.length - 1; j < i; j--) {
                        state?.unlink(stateViewEdges[j])
                    }
                }
            }

            for (let view of this.views) {
                view.persist()

                let s = view.state
                if (s) {
                    state?.link(s, "view", ".last", false)
                }
                else {
                    debugHistory.warn("Unable to store view. Missing state CVU")
                }
            }
        })
    }

    setCurrentView (
        state?: CVUStateDefinition,
        viewArguments?: ViewArguments
    ) {
        let storedView = state ?? this.currentView?.state
		if (!storedView) {
            throw "Exception: Unable fetch stored CVU state"
        }
		if (!(storedView?.constructor?.name == "CVUStateDefinition"))
		    storedView = new CVUStateDefinition(storedView);
        
        var nextIndex: number
        
        // If the session already exists, we simply update the session index
        let index = this.views.findIndex((view) => view.uid == storedView.uid)
        if (index > -1) {
            nextIndex = index
        }
        // Otherwise lets create a new session
        else {
            if (this.currentViewIndex + 1 < this.views.length) {
                // Remove all items after the current index
                this.views.splice(this.currentViewIndex + 1);
            }
            
            // Add session to list
            this.views.push(new CascadableView(storedView, this))
            nextIndex = this.views.length - 1
        }
        
        let isReload = this.lastViewIndex == nextIndex && this.sessions?.currentSession == this
        this.lastViewIndex = nextIndex
        
        if (!isReload) { storedView.accessed() }
        
        let nextView = this.views[nextIndex]
        nextView.viewArguments?.deepMerge(viewArguments);

        nextView.load((error) => {
            let item = nextView.resultSet.singletonItem
            if (!isReload && error == undefined && item) {
                item.accessed()
            }
        })
        
        if (this.sessions?.currentSession != this) {
            this.sessions?.setCurrentSession(this.state)
        }

        this.currentViewIndex = nextIndex
        
        if (!isReload) {
            // turn off editMode when navigating
            if (this.editMode) { this.editMode = false }

            // hide filterpanel if view doesnt have a button to open it
            if (this.showFilterPanel) {
                if (this.currentView?.filterButtons.find(($0) => $0.name == ActionFamily.toggleFilterPanel) == undefined) {
                    this.showFilterPanel = false
                }
            }

            this.schedulePersist()
        }
        
        // Update the UI
        this.currentView?.context?.scheduleUIUpdate(true)
    }

    takeScreenShot(immediate: boolean = false) {
        /*let view = UIApplication.shared.windows[0].rootViewController?.view
		if (view) {
            let uiImage = view.takeScreenShot()
			if (uiImage) {
                
                let doIt = () => {
                    try {
                        if (this.screenshot == undefined) {
                            let file = CacheMemri.createItem("File")
                            this.screenshot = file
                        }

                        this.screenshot?.write(uiImage)
                    } catch(error) {
                        debugHistory.error(`Unable to write screenshot: ${error}`)
                    }
                }
                
                if (immediate) { doIt() }
                else {
                    // DispatchQueue.global(".userInitiated").async(function() {
                        doIt()
                    // })
                }

				return
			}
		}

		debugHistory.error("Unable to create screenshot")*/
	}

	/*public static func == (lt: Session, rt: Session) -> Bool {
		lt.uid == rt.uid
	}*/
}

/*extension UIView {
	takeScreenShot() -> UIImage? {
		UIGraphicsBeginImageContextWithOptions(bounds.size, false, UIScreen.main.scale)
		drawHierarchy(in: bounds, afterScreenUpdates: true)

		if let image = UIGraphicsGetImageFromCurrentImageContext() {
			UIGraphicsEndImageContext()
			return image
		}

		return nil
	}
}*/
