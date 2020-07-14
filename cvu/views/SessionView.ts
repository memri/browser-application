//
//  SessionView.swift
//  memri
//
//  Created by Koen van der Veen on 29/04/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVUParsedDatasourceDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {UserState, ViewArguments} from "./UserState";
import {realmWriteIfAvailable} from "../../gui/util";
import {DataItem} from "../../model/DataItem";
import {Datasource} from "../../context/Datasource";

export class SessionView extends DataItem {
 
    get genericType (){return "SessionView"}
 
    name?: string
    viewDefinition?: CVUStoredDefinition
    userState?: UserState
    viewArguments?: ViewArguments
    datasource?: Datasource // TODO refactor: fix cascading
    session?: Session
    
    get computedTitle() {
        //        if let value = self.name ?? self.title { return value }
        //        else if let rendererName = self.rendererName {
        //            return "A \(rendererName) showing: \(self.datasource?.query ?? "")"
        //        }
        //        else if let query = self.datasource?.query {
        //            return "Showing: \(query)"
        //        }
        return "[No Name]"
    }
    
    constructor(){
        super();
        
        this.computedDescription = function () {//TODO
            console.log("MAKE THIS DISSAPEAR")
            return this.computedTitle();
        }
    }
    
    mergeState(view: SessionView) {
        realmWriteIfAvailable(this.realm, function () {
            let us = view.userState
            if (us) {
                if (this.userState == null) { this.userState = new UserState() }
                Object.assign(this.userState, us);
            }
            let args = view.viewArguments
            if (args) {
                if (this.viewArguments == null) { this.viewArguments = new ViewArguments() }
                Object.assign(this.viewArguments, args);
            }
        }.bind(this))
    }
    
    fromCVUDefinition(parsed = null, stored = null, viewArguments = null, userState = null, datasource = null) {
        
        if (parsed == null && stored == null) {
            throw "Missing CVU definition"
        }
        
        var ds = datasource
        var us = userState
        var args = viewArguments

        let src = parsed && parsed["datasourceDefinition"]
        if (ds == null && src && src instanceof CVUParsedDatasourceDefinition) {
            ds = new Datasource().fromCVUDefinition(src, viewArguments)//TODO
        }
        if (userState == null && parsed["userState"] instanceof UserState) {//TODO
            us = parsed["userState"]?.clone();
        }
        if (viewArguments == null && parsed["viewArguments"] instanceof ViewArguments) {//TODO
            args = parsed["viewArguments"].clone();
        }
        
        var values = {//TODO
            selector: parsed?.selector ?? stored?.selector ?? "[view]",
            name: typeof parsed["name"] === 'string' ? parsed["name"] : stored?.name || "",
            viewDefinition: stored ?? new CVUStoredDefinition({ //TODO
                type: "view",
                selector: parsed?.selector,
                domain: parsed?.domain,
                definition: parsed?.toCVUString(0, "    ")
            })
        }

        if (args) { values["viewArguments"] = args }
        if (us) { values["userState"] = us }
        if (ds) { values["datasource"] = ds }
        
        return new SessionView(values)//TODO
    }

}