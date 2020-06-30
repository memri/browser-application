//
//  Definitions.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//


class CVUStoredDefinition extends DataItem {
    constructor(args) {
        super();
    }
    type = null
    name = null
    selector = null
    definition = null
    query = null
    domain = "user"
    get genericType (){return "CVUStoredDefinition"}
}
