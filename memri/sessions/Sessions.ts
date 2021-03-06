//
//  Session.swift
//  memri
//
//  Created by Koen van der Veen on 10/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVUParsedSessionDefinition, DatabaseController} from "../../router";
import {CVUParsedSessionsDefinition} from "../../router";
import {EdgeSequencePosition, CVUStateDefinition} from "../../router";
import {debugHistory} from "../../router";
import {CacheMemri} from "../../router";
import {Session} from "../../router";
import {Settings} from "../../router";

export class Sessions /*: ObservableObject, Equatable*/ {
    /// TBD
    get currentSessionIndex() {
        return Number(this.parsed? this.parsed.get("currentSessionIndex") ?? 0: 0);
    }

    set currentSessionIndex(value) {
        this.setState("currentSessionIndex", Number(value))
    }
    
    uid
    parsed?: CVUParsedSessionsDefinition
    get state() {
		return DatabaseController.sync(false,(realm) => {
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
            this.uid = Settings.shared.get("device/sessions/uid")
        }
        
        // Setup update publishers
        /*this.persistCancellable = persistSubject
            .throttle(for: .milliseconds(300), scheduler: RunLoop.main, latest: true)
            .sink { [weak self] in
                DatabaseController.asyncOnBackgroundThread { _ in
                    try self?.persist()
                }
            }*/ //TODO: wtf?
        /*DatabaseController.writeAsync (()=>{
            this?.persist()
        })*/
    }

    load(context: MemriContext) {//TODO: added this for JS
        if (this.isDefault && this.uid == undefined) {
            this.uid = Settings.shared.get("device/sessions/uid") || CacheMemri.getDeviceID();
            if (this.uid == undefined) {
                throw "Could not find stored sessions to load from"
            }
        }

        this.context = context
        this.sessions = []

        DatabaseController.trySync(false, (realm) => {
            console.log(realm.objects("CVUStateDefinition"));
            let state = realm.objectForPrimaryKey("CVUStateDefinition", this.uid);
            if (state) {
                let p = context.views.parseDefinition(state);
                if (!(p instanceof CVUParsedSessionsDefinition)) {
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
                        this.sessions.push(new Session(sessionState, this));
                    }
                }
                // Or if the sessions are encoded in the definition
                else if (Array.isArray(p.get("sessionDefinitions")) && p.get("sessionDefinitions").length > 0 && p.get("sessionDefinitions")[0] instanceof CVUParsedSessionDefinition) {
                    let parsedSessions = p.get("sessionDefinitions");
                    DatabaseController.trySync(true, () => {
                        for (let parsed of parsedSessions) {
                            let sessionState = CVUStateDefinition.fromCVUParsedDefinition(parsed)
                            state.link(sessionState, "session", EdgeSequencePosition.last);
                            this.sessions.push(new Session(sessionState, this))
                        }
                    });

                    this.parsed.set("sessionDefinitions", undefined);
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
        this.parsed.set(name, value);
        this.schedulePersist()
    }
    
	setCurrentSession(state?: CVUStateDefinition|Session) {
        if (state instanceof Session) {
            let session = state;
            // If the session already exists, we simply update the session index
            let index = this.sessions.findIndex((s) => {
                return s.uid == session.uid
            })
            if (index > -1) {
                this.currentSessionIndex = index
            }

            // Otherwise lets create a new session
            else {
                // Add session to list
                this.sessions.push(session)
                this.currentSessionIndex = this.sessions.length - 1
            }

            session.state?.accessed();

            this.schedulePersist()
        } else {
            if (!(state instanceof CVUStateDefinition))
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
	}
    
    persistSubject /*= PassthroughSubject<Void, Never>()*///TODO:
    persistCancellable
    schedulePersist() { //this.persistSubject.send()
        }
    
    persist(state) {
        DatabaseController.trySync (false, (realm)=>{
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
            state?.set("definition", this.parsed?.toCVUString(0, "    "))
            
            for (let session of this.sessions) {
                session.persist()
                let s = session.state;
                if (s) {
                    state?.link(s, "session", EdgeSequencePosition.last, undefined,false,false);
                }
                else {
                    debugHistory.warn("Unable to store session. Missing stored CVU")
                }
            }

        })
        return state;
    }

	install(context: MemriContext, callback) {
        DatabaseController.asyncOnCurrentThread(true, callback, (realm)=>{
            let templateQuery = "selector = '[sessions = defaultSessions]'";
            let template = realm.objects("CVUStoredDefinition").filtered(templateQuery)[0];
            let parsed = context.views.parseDefinition(template);
            if (!template || !parsed) {
                throw "Installation is corrupt. Cannot recover."
            }
            
            let defs = (parsed.get("sessionDefinitions") ?? {}) //TODO:
            let allSessions = defs.map((item) => {
                return CVUStateDefinition.fromCVUParsedDefinition(item)
            })
            let state = CacheMemri.createItem("CVUStateDefinition")
            for (let session of allSessions) {
                state.link(session, "session", EdgeSequencePosition.last)
            }

            // uid is always set
            this.uid = state.uid;
            Settings.shared.set("device/sessions/uid", state.uid ?? -1);

            this.parsed = parsed /*as? CVUParsedSessionsDefinition*/
            console.log(realm.objects("CVUStoredDefinition"));
            //delete this.parsed?.parsed["sessionDefinitions"]; //TODO:
            
            this.persist(state)
            this.load(context)

            callback(undefined);
        })
	}

	/// Clear all sessions and create a new one
	clear() {}
    
   /* public static func == (lt: Sessions, rt: Sessions) -> Bool {
        lt.uid == rt.uid
    }*/
}
