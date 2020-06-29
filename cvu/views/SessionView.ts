//
//  SessionView.swift
//  memri
//
//  Created by Koen van der Veen on 29/04/2020.
//  Copyright © 2020 memri. All rights reserved.
//

class SessionView extends DataItem {
 
    get genericType (){return "SessionView"}
 
    name = null
    viewDefinition = null
    userState = null
    viewArguments = null
    datasource = null // TODO refactor: fix cascading
    session = null
    
    get computedTitle() {
//        let value = this.name || this.title
//        let rendererName = this.rendererName
//        let query = this.datasource.query
//        if (value) { return value }
//        else if (rendererName) {
//            return `A ${rendererName} showing: ${query ?? ""}`
//        }
//        else if (query) {
//            return `Showing: ${query}`
//        }
        return "[No Name]"
    }
    
    constructor(values){
        super(values);
        
        this.computedDescription = function () {//TODO
            console.log("MAKE THIS DISSAPEAR")
            return this.computedTitle();
        }
    }
    
    mergeState(view) {
        realmWriteIfAvailable(this.realm, function () {//TODO
            let us = view.userState
            if (us) {
                if (this.userState == null) { this.userState = new UserState() }
                Object.assign(this.userState, us);//TODO
            }
            let args = view.viewArguments
            if (args) {
                if (this.viewArguments == null) { this.viewArguments = new ViewArguments() }
                Object.assign(this.viewArguments, args);//TODO
            }
        })
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
            us = Object.assign({}, parsed["userState"]);
        }
        if (viewArguments == null && parsed["viewArguments"] instanceof ViewArguments) {//TODO
            args = Object.assign({}, parsed["viewArguments"]);
        }
        
        var values = {//TODO
            selector: parsed.selector || stored.selector || "[view]",
            name: typeof parsed["name"] === 'string' ? parsed["name"] : stored?.name || "",
            viewDefinition: stored || new CVUStoredDefinition({
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