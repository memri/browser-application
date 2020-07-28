//
//  Session.swift
//  memri
//
//  Created by Koen van der Veen on 10/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {DatabaseController} from "../model/DatabaseController";
import {CVUParsedSessionsDefinition} from "../parsers/cvu-parser/CVUParsedDefinition";
import {EdgeSequencePosition, CVUStateDefinition} from "../model/items/Item";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {CacheMemri} from "../model/Cache";
import {Session} from "./Session";
import {settings} from "../model/Settings";

export class Sessions /*: ObservableObject, Equatable*/ {
    /// TBD
    get currentSessionIndex() {
        return Number(this.parsed? this.parsed["currentSessionIndex"] ?? 0: 0);
    }

    set currentSessionIndex(value) {
        this.setState("currentSessionIndex", Number(value))
    }
    
    uid
    parsed?: CVUParsedSessionsDefinition
    get state() {
		return DatabaseController.read((realm) => {
            return realm.objectForPrimaryKey("CVUStateDefinition", this.uid);
        })
    }

    /// TBD
    context: MemriContext
    isDefault: boolean = false
    
    sessions = []/*= [Session]()*/ //TODO:
    cancellables= []
    
    get count() {
        return this.sessions.length;
    }
    
	get currentSession() {
        return this.sessions[this.currentSessionIndex];
	}

	get currentView() {
		return this.currentSession?.currentView;
	}
    
    subscript(index: number): Session {
        return this.sessions[index];
    }

    constructor(state?: CVUStateDefinition, isDefault: boolean = false) {
        if (state) {
            let uid = state.uid;
            if (!uid) {
                throw "CVU state object is unmanaged"
            }
            this.uid = uid
        } else if (isDefault) {
            this.isDefault = isDefault
            // Load default sessions for this device
            this.uid = settings.get("device/sessions/uid")
        }
        
        // Setup update publishers
        /*this.persistCancellable = persistSubject
            .throttle(for: .milliseconds(300), scheduler: RunLoop.main, latest: true)
            .sink { [weak self] in
                DatabaseController.writeAsync { _ in
                    try self?.persist()
                }
            }*/ //TODO: wtf?
        /*DatabaseController.writeAsync (()=>{
            this?.persist()
        })*/
    }

    load(context: MemriContext, state?) {//TODO: added this for JS
        if (this.isDefault && this.uid == undefined) {
            this.uid = settings.get("device/sessions/uid")
            if (this.uid == undefined) {
                throw "Could not find stored sessions to load from"
            }
        }

        this.context = context
        this.sessions = []

        DatabaseController.tryRead((realm) => {
            console.log(realm.objects("CVUStateDefinition"));
            if (!state)
                state = realm.objectForPrimaryKey("CVUStateDefinition", this.uid); //TODO:
            if (state) {
                if (!(state?.constructor?.name == "CVUStateDefinition"))
                    state = new CVUStateDefinition(state);
                let p = context.views.parseDefinition(state);
                if (!(p?.constructor?.name == "CVUParsedSessionsDefinition")) {
                    throw "Unable to parse state definition"
                }
                this.parsed = p;

                // Check if there are sessions in the db
                let storedSessionStates = state
                    .edges("session")
                    .sorted("sequence")
                    .items("CVUStateDefinition");
                if (storedSessionStates && storedSessionStates.length > 0) {
                    for (let sessionState of storedSessionStates) {
                        this.sessions.push(new Session(new CVUStateDefinition(sessionState), this));
                    }
                }
                // Or if the sessions are encoded in the definition
                else if (Array.isArray(p["sessionDefinitions"]) && p["sessionDefinitions"].length > 0 && p["sessionDefinitions"][0]?.constructor?.name == "CVUParsedSessionDefinition") {
                    let parsedSessions = p["sessionDefinitions"];
                    DatabaseController.tryWriteSync((realm) => {
                        for (let parsed of parsedSessions) {
                            let sessionState = CVUStateDefinition.fromCVUParsedDefinition(parsed)
                            state.link(sessionState, "session", EdgeSequencePosition.last);
                            this.sessions.push(new Session(sessionState, this))
                        }
                    });

                    this.parsed["sessionDefinitions"] = undefined;
                } else {
                    throw "CVU state definition is missing sessions"
                }
            }
            // Create a default session
            else {
                this.sessions.push(new Session(undefined, this));
            }
        })
    }
    
    setState(name:string, value?) {
        if (this.parsed == undefined) { this.parsed = new CVUParsedSessionsDefinition() }
        this.parsed[name] = value;
        this.schedulePersist()
    }
    
	setCurrentSession(state?: CVUStateDefinition) {
        if (!(state?.constructor?.name == "CVUStateDefinition"))
            state = new CVUStateDefinition(state);
        let storedSession = state ?? this.currentSession?.state;
        if (!storedSession) {
            throw "Exception: Unable to fetch stored CVU state for session"
        }

        // If the session already exists, we simply update the session index
        let index = this.sessions.findIndex((session) => {
            return session.uid == storedSession.uid
        })
        if (index > -1) {
            this.currentSessionIndex = index
        }
        // Otherwise lets create a new session
        else {
            // Add session to list
            this.sessions.push(new Session(storedSession, this))
            this.currentSessionIndex = this.sessions.length - 1
        }
        
        storedSession.accessed()
        
        this.schedulePersist()
	}
    
    persistSubject /*= PassthroughSubject<Void, Never>()*///TODO:
    persistCancellable
    schedulePersist() { //this.persistSubject.send()
        }
    
    persist(state?) {
        DatabaseController.tryWriteSync ((realm)=>{
            //var state = realm.objectForPrimaryKey("CVUStateDefinition", this.uid)
            if (state == undefined) {
                debugHistory.warn("Could not find stored sessions CVU. Creating a new one.")
                
                state = CacheMemri.createItem("CVUStateDefinition", {})
                let uid = state?.uid;
                if (!uid) {
                    throw "Exception: could not create stored definition"
                }
                
                this.uid = uid
            }
            //state = new CVUStateDefinition(state); //TODO: need better way
            state?.set("definition", this.parsed?.toCVUString(0, "    "))
            
            for (let session of this.sessions) {
                session.persist()
                let s = session.state;
                if (s) {
                    state?.link(s, "session", EdgeSequencePosition.last, false);
                }
                else {
                    debugHistory.warn("Unable to store session. Missing stored CVU")
                }
            }

        })
        return state;
    }

	install(context: MemriContext) {
        DatabaseController.tryWriteSync((realm)=>{
            let templateQuery = "selector = '[sessions = defaultSessions]'";
            let template = realm.objects("CVUStoredDefinition").filtered(templateQuery)[0];
            let parsed = context.views.parseDefinition(template);
            //let state = realm.objectForPrimaryKey("CVUStateDefinition", this.uid);
            if (!template || !parsed /*|| !state*/) {
                throw "Installation is corrupt. Cannot recover."
            }
            
            let defs = (parsed.parsed["sessionDefinitions"] ?? {}) //
            let allSessions = defs.map((item) => {
                return CVUStateDefinition.fromCVUParsedDefinition(item)
            })
            let state = CacheMemri.createItem("CVUStateDefinition")
            state = new CVUStateDefinition(state); //TODO: should be a better way
            for (let session of allSessions) {
                state.link(session, "session", EdgeSequencePosition.last)
            }

            // uid is always set
            this.uid = state.uid;
            settings.set("device/sessions/uid", state.uid ?? -1);

            this.parsed = parsed /*as? CVUParsedSessionsDefinition*/
            console.log(realm.objects("CVUStoredDefinition"));
            //delete this.parsed?.parsed["sessionDefinitions"]; //TODO:
            
            state = this.persist(state)
            this.load(context, state)
        })
	}

	/// Clear all sessions and create a new one
	clear() {}
    
   /* public static func == (lt: Sessions, rt: Sessions) -> Bool {
        lt.uid == rt.uid
    }*/
}
