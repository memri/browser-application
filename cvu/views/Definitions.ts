//
//  Definitions.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//


class CVUStoredDefinition extends DataItem {
    constructor() { //TODO
        super();
    }
    type
    name
    selector
    definition
    query
    domain = "user"
    get genericType (){return "CVUStoredDefinition"}
}
