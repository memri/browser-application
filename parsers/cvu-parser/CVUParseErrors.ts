//
//  CVUParseErrors.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


export const CVUParseErrors = {
    UnexpectedToken: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "UnexpectedToken"
    },
    UnknownDefinition: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "UnknownDefinition"
    },
    ExpectedCharacter: function(Character, CVUToken){
        this.Character = Character
        this.CVUToken = CVUToken
        this.type = "ExpectedCharacter"
    },
    ExpectedDefinition: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "ExpectedDefinition"
    },
    ExpectedIdentifier: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "ExpectedIdentifier"
    },
    
    ExpectedKey: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "ExpectedKey"
    },
    ExpectedString: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "ExpectedString"
    },
    
    MissingQuoteClose: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "MissingQuoteClose"
    },
    MissingExpressionClose: function(CVUToken){
        this.CVUToken = CVUToken
        this.type = "MissingExpressionClose"
    },
    
    /*function toString(code) {
        var message = ""
        var parts:[Any]
        
        function loc(parts) {
            if parts[2] as? String == "" { return "at the end of the file" }
            else { return "at line:\(parts[2] as! Int + 1) and character:\(parts[3] as! Int + 1)" }
        }
        function displayToken(parts) {
            "\(parts[0])" + ((parts[1] as? String ?? "x") != "" ? "('\(parts[1])')" : "")
        }
        
        switch self {
        case let .UnexpectedToken(token):
            parts = token.toParts()
            message = "Unexpected \(displayToken(parts)) found \(loc(parts))"
        case let .UnknownDefinition(token):
            parts = token.toParts()
            message = "Unknown Definition type '\(displayToken(parts))' found \(loc(parts))"
        case let .ExpectedCharacter(char, token):
            parts = token.toParts()
            message = "Expected Character \(char) and found \(displayToken(parts)) instead \(loc(parts))"
        case let .ExpectedDefinition(token):
            parts = token.toParts()
            message = "Expected Definition and found \(displayToken(parts)) instead \(loc(parts))"
        case let .ExpectedIdentifier(token):
            parts = token.toParts()
            message = "Expected Identifier and found \(displayToken(parts)) instead \(loc(parts))"
        case let .ExpectedKey(token):
            parts = token.toParts()
            message = "Expected Key and found \(displayToken(parts)) instead \(loc(parts))"
        case let .ExpectedString(token):
            parts = token.toParts()
            message = "Expected String and found \(displayToken(parts)) instead \(loc(parts))"
        case let .MissingQuoteClose(token):
            parts = token.toParts()
            message = "Missing quote \(loc(parts))"
        case let .MissingExpressionClose(token):
            parts = token.toParts()
            message = "Missing expression close token '}}' \(loc(parts))"
        }
        
        let lines = code.split(separator: "\n")
        if (let line = parts[2] as? Int) {
            let ch = parts[3] as? Int ?? 0
            let beforeLines = lines[max(0, line - 10)...line-1].joined(separator: "\n")
            let afterLines = lines[line...min(line + 10, lines.count)].joined(separator: "\n")
            
            return message + "\n\n"
                + beforeLines + "\n"
                + Array(0..<ch-1).map{_ in "-"}.joined() + "^\n"
                + afterLines
        }
        else {
            return message
        }
    }*/
};
