//
//  memri-parser
//
//  Copyright © 2020 Memri. All rights reserved.
//
import {ExprParseErrors} from "./ExprParser";

class Token {
    type: any;
    value: any;
    i: any;

    toString() {
        let stringToken = this.type;
        stringToken += (this.value) ? ", " + this.value : "";
        stringToken += (this.i) ? ", " + this.i : "";
        return stringToken;
    }
}

class Operator extends Token {
    value: any;
    type: string;
    i: any;

    constructor(value, i) {
        super();
        this.i = i;
        this.type = "Operator";
        this.value = value;
    }

}

class Bool extends Token {
    value: any;
    type: string;
    i: any;

    constructor(value, i) {
        super();
        this.i = i;
        this.type = "Bool";
        this.value = value;
    }

}

class Number extends Token {
    value: any;
    type: string;
    i: any;

    constructor(value, i) {
        super();
        this.i = i;
        this.type = "Number";
        this.value = value;
    }

}

class String extends Token {
    value: any;
    type: string;
    i: any;

    constructor(value, i) {
        super();
        this.i = i;
        this.type = "String";
        this.value = value;
    }

}

class Identifier extends Token {
    value: any;
    type: string;
    i: any;

    constructor(value, i) {
        super();
        this.i = i;
        this.type = "Identifier";
        this.value = value;
    }

}

class Negation extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "Negation";
    }

}

class Comma extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "Comma";
    }

}

class CurlyBracketOpen extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "CurlyBracketOpen";
    }

}

class CurlyBracketClose extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "CurlyBracketClose";
    }

}

class BracketOpen extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "BracketOpen";
    }

}

class BracketClose extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "BracketClose";
    }

}

class Period extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "Period";
    }

}

class EOF extends Token {
    type: string;

    constructor() {
        super();
        this.type = "EOF";
    }

}

class Other extends Token {
    value: any;
    type: string;
    i: any;

    constructor(value, i) {
        super();
        this.i = i;
        this.type = "Other";
        this.value = value;
    }

}

class ParensOpen extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "ParensOpen";
    }

}

class ParensClose extends Token {
    value: any;
    type: string;
    i: any;

    constructor(i) {
        super();
        this.i = i;
        this.type = "ParensClose";
    }

}

export const ExprToken = {
    Operator,
    Bool,
    Identifier,
    Number,
    Negation,
    Comma,
    ParensOpen,
    ParensClose,
    CurlyBracketOpen,
    CurlyBracketClose,
    BracketOpen,
    BracketClose,
    String,
    Period,
    Other,
    EOF
};

export var ExprOperator  = {
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
    
export var ExprOperatorPrecedence = {
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
    
export class ExprLexer {
    input
    startInStringMode

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

        var startChar = null
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
                    startChar = null
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
                isMode = Mode.string
                startChar = c
                break
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
                else { throw new ExprParseErrors.UnexpectedToken(new ExprToken.CurlyBracketOpen(i)) }
                break
            case "}":
                if (startInStringMode) {
                    addToken(new ExprToken.CurlyBracketClose(i))
                    isMode = Mode.string
                }
                else { throw new ExprParseErrors.UnexpectedToken(new ExprToken.CurlyBracketOpen(i)) }
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
            throw new ExprParseErrors.MissingQuoteClose
        }
        
        return tokens
    }
}


