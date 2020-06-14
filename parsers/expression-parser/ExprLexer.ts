//
//  memri-parser
//
//  Copyright © 2020 Memri. All rights reserved.
//
const ExprParser = require("./ExprParser");

var ExprToken = exports.ExprToken = {
    Operator: function(value, Int) {
        this.i = Int
        this.type = "Operator"
        this.value = value
    },
    Bool: function(value, Int) {
        this.i = Int
        this.type = "Bool"
        this.value = value
    },
    Identifier: function(value, Int) {
        this.i = Int
        this.type = "Identifier"
        this.value = value
    },
    Number: function(value, Int) {
        this.i = Int
        this.type = "Number"
        this.value = value
    },
    Negation: function(Int) {
        this.i = Int
        this.type = "Negation"
    },
    Comma: function(Int) {
        this.i = Int
        this.type = "Comma"
    },
    ParensOpen: function(Int) {
        this.i = Int
        this.type = "ParensOpen"
    },
    ParensClose: function(Int) {
        this.i = Int
        this.type = "ParensClose"
    },
    CurlyBracketOpen: function(Int) {
        this.i = Int
        this.type = "CurlyBracketOpen"
    },
    CurlyBracketClose: function(Int) {
        this.i = Int
        this.type = "CurlyBracketClose"
    },
    BracketOpen: function(Int) {
        this.i = Int
        this.type = "BracketOpen"
    },
    BracketClose: function(Int) {
        this.i = Int
        this.type = "BracketClose"
    },
    String: function(value, Int) {
        this.i = Int
        this.type = "String"
        this.value = value
    },
    Period: function(Int) {
        this.i = Int
        this.type = "Period"
    },
    Other: function(value, Int) {
        this.i = Int
        this.type = "Other"
        this.value = value
    },
    EOF: function() {
        this.type = "EOF"
    },
};

var ExprOperator = exports.ExprOperator = {
    // ConditionStart: "?",
    // ConditionElse: ":",
    // ConditionAND: "AND",
    // ConditionOR: "OR",
    // ConditionEquals: "=",
    // Plus: "+",
    // Minus: "-",
    // Multiplication: "*",
    // Division: "/",
    ConditionStart: "ConditionStart",
    ConditionElse: "ConditionElse",
    ConditionAND: "ConditionAND",
    ConditionOR: "ConditionOR",
    ConditionEquals: "ConditionEquals",
    Plus: "Plus",
    Minus: "Minus",
    Multiplication: "Multiplication",
    Division: "Division",
}
    
exports.ExprOperatorPrecedence = {
    ConditionStart: 5,
    ConditionElse: 10,
    ConditionAND: 20,
    ConditionOR: 30,
    ConditionEquals: 35,
    Plus: 40,
    Minus: 40,
    Multiplication: 50,
    Division: 50,
}

var Mode = {
    idle: 0,
    keyword: 10,
    number: 20,
    string: 30,
    escapedString: 35,
};

let keywords = {
    "true": (i) => { return new ExprToken.Bool(true, i) },
    "True": (i) => { return new ExprToken.Bool(true, i) },
    "false": (i) => { return new ExprToken.Bool(false, i) },
    "False": (i) => { return new ExprToken.Bool(false, i) },
    "and": (i) => { return new ExprToken.Operator(ExprOperator.ConditionAND, i) },
    "AND": (i) => { return new ExprToken.Operator(ExprOperator.ConditionAND, i) },
    "or": (i) => { return new ExprToken.Operator(ExprOperator.ConditionOR, i) },
    "OR": (i) => { return new ExprToken.Operator(ExprOperator.ConditionOR, i) },
    "equals": (i) => { return new ExprToken.Operator(ExprOperator.ConditionEquals, i) },
    "EQUALS": (i) => { return new ExprToken.Operator(ExprOperator.ConditionEquals, i) }
}
    
exports.ExprLexer = class ExprLexer {
    constructor(input, startInStringMode) {
        this.input = input
        this.startInStringMode = startInStringMode
    }
    
    tokenize() {
        var tokens = []
        var startInStringMode = this.startInStringMode
        
        var isMode = startInStringMode ? Mode.string : Mode.idle
        var keyword = []
        var startChar;
        
        function addToken(token) {
            if (isMode == Mode.number) {
                tokens.push(new ExprToken.Number(parseFloat(keyword.join("")), i))
                keyword = []
                isMode = Mode.idle
            }
            else if (isMode == Mode.keyword) {
                let kw = keyword.join("")
                
                if (keywords.hasOwnProperty(kw)) { tokens.push(keywords[kw](i)) }
                else { tokens.push(new ExprToken.Identifier(kw, i)) }
                
                keyword = []
                isMode = Mode.idle
            }
            
            if (token) { tokens.push(token) }
        }
        var input = this.input;
        
        for (var i = 0; i < input.length; i++) {
            var c = input[i];
            
            if (isMode >= Mode.string) {
                if (isMode == Mode.string
                  && (c == startChar || startChar == null && startInStringMode && c == "{")) {
                    if (keyword.length > 0 || i > 0 || c != "{") {
                        addToken(new ExprToken.String(keyword.join(""), i))
                    }
                    if (c == "{") { addToken(new ExprToken.CurlyBracketOpen(i)) }
                    keyword = []
                    isMode = Mode.idle
                    continue;
                }
                
                if (isMode == Mode.escapedString) {
                    keyword.push(c)
                    isMode = Mode.string
                }
                else if (c == "\\") {
                    isMode = Mode.escapedString
                }
                else {
                    keyword.push(c)
                }
                
                continue;
            }
            
            switch(c){
            case "*": addToken(new ExprToken.Operator(ExprOperator.Multiplication, i)); break
            case "/": addToken(new ExprToken.Operator(ExprOperator.Division, i)); break
            case "+": addToken(new ExprToken.Operator(ExprOperator.Plus, i)); break
            case "-": addToken(new ExprToken.Operator(ExprOperator.Minus, i)); break
            case "!": addToken(new ExprToken.Negation(i)); break
            case "?": addToken(new ExprToken.Operator(ExprOperator.ConditionStart, i)); break
            case ":": addToken(new ExprToken.Operator(ExprOperator.ConditionElse, i)); break
            case "(": addToken(new ExprToken.ParensOpen(i)); break
            case ")": addToken(new ExprToken.ParensClose(i)); break
            case "[": addToken(new ExprToken.BracketOpen(i)); break
            case "]": addToken(new ExprToken.BracketClose(i)); break
            case "=": addToken(new ExprToken.Operator(ExprOperator.ConditionEquals, i)); break
            case ",": addToken(new ExprToken.Comma(i)); break
            case "'": case '"':
                isMode = Mode.string; break
            case ".":
                if (isMode == Mode.number) { keyword.push(c) }
                else { addToken(new ExprToken.Period(i)) }
                break
            case " ": case "\t": case "\n": addToken(); break
            case "0": case "1":case "2":case "3":case "4":case "5":case "6":case "7":case "8":case "9":
                if (isMode == Mode.idle) { isMode = Mode.number }
                keyword.push(c)
                break
            case "{":
                if (startInStringMode) {
                    addToken(new ExprToken.CurlyBracketOpen(i))
                    isMode = Mode.idle
                }
                else { throw ExprParser.ExprParseErrors.UnexpectedToken(new ExprToken.CurlyBracketOpen(i)) }
                break
            case "}":
                if (startInStringMode) {
                    addToken(new ExprToken.CurlyBracketClose(i))
                    isMode = Mode.string
                }
                else { throw ExprParser.ExprParseErrors.UnexpectedToken(new ExprToken.CurlyBracketOpen(i)) }
                break
            default:
                isMode = Mode.keyword
                keyword.push(c)
            }
        }
        
        if (keyword.length > 0) {
            addToken()
        }
        
        if (startInStringMode) {
            if (keyword.length > 0) {
                addToken(new ExprToken.String(keyword.join(""), input.length - keyword.length))
            }
        }
        else if (isMode == Mode.string) {
            throw ExprParser.ExprParseErrors.MissingQuoteClose
        }
        
        return tokens
    }
}
function tokenize(string) {
    return new exports.ExprLexer(string).tokenize()
}
// tokenize("(5 + 10 * 4 - 3 / 10) / 10")
// console.log(tokenize(`a || "Hello {'{fetchName()}'}"`))
