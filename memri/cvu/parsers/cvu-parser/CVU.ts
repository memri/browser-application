//
//  Viewession.swift
//  memri-parser
//
//  Created by Ruben Daniels on 5/16/20.
//  Copyright © 2020 Memri. All rights reserved.
//


import {CVUParser} from "../../../../router";
import {CVULexer} from "../../../../router";

export class CVU {
    code;
    context;
    lookup;
    execFunc;
    parsed;
    
    constructor(code, context, lookup, execFunc) {
        
        this.context = context
        this.code = code
        this.lookup = lookup
        this.execFunc = execFunc
    }
    
    parse() {
        if (this.parsed) {
            return this.parsed
        }
        else {
            let lexer = new CVULexer(this.code);
            let parser = new CVUParser(lexer.tokenize(), this.context, this.lookup, this.execFunc)
            this.parsed = parser.parse()
            return this.parsed != null ? this.parsed : []
        }
        
    }
}
