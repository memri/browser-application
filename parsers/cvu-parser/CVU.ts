//
//  Viewession.swift
//  memri-parser
//
//  Created by Ruben Daniels on 5/16/20.
//  Copyright © 2020 Memri. All rights reserved.
//


class CVU {
    code;
    main;
    lookup;
    execFunc;
    parsed;
    
    constructor(code, main, lookup, execFunc) {
        
        this.main = main
        this.code = code
        this.lookup = lookup
        this.execFunc = execFunc
    }
    
    parse() {
        if (this.parsed) {
            return this.parsed
        }
        else {
            let lexer = CVULexer(this.code);
            let parser = CVUParser(lexer.tokenize(), this.main, this.lookup, this.execFunc)
            this.parsed =  parser.parse()
            return this.parsed != null ? this.parsed : []
        }
        
    }
}
