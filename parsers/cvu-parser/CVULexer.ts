//
//  memri-parser
//
//  Copyright © 2020 Memri. All rights reserved.
//

import {CVUParseErrors} from "./CVUParseErrors"

class Token {
    type: any;
    value: any;
    col: any;
    row: any;

    toString(){
        let stringToken = this.type;
        stringToken += (this.value) ? "," + this.value : "";
        stringToken += (this.row) ? "," + this.row : "";
        stringToken += (this.col) ? "," + this.col : "";
        return stringToken;
    }
}

class Operator extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Operator";
        this.value = value;
    }

}

class Bool extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Bool";
        this.value = value;
    }

}

class Number extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Number";
        this.value = value;
    }

}

class String extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "String";
        this.value = value;
    }

}

class Identifier extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Identifier";
        this.value = value;
    }

}

class NamedIdentifier extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "NamedIdentifier";
        this.value = value;
    }

}

class StringExpression extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "StringExpression";
        this.value = value;
    }

}

class Expression extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Expression";
        this.value = value;
    }

}

class Negation extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Negation";
    }

}

class Comma extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Comma";
    }

}

class Color extends Token {
    value: any;
    type: string;
    col: any;
    row: any;

    constructor(value, row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Color";
        this.value = value;
    }

}

class SemiColon extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "SemiColon";
    }

}

class Colon extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Colon";
    }

}
class Newline extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Newline";
    }

}

class CurlyBracketOpen extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "CurlyBracketOpen";
    }

}

class CurlyBracketClose extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "CurlyBracketClose";
    }

}

class BracketOpen extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "BracketOpen";
    }

}

class BracketClose extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "BracketClose";
    }

}

class Nil extends Token {
    type: string;
    col: any;
    row: any;

    constructor(row, col) {
        super();
        this.row = row;
        this.col = col;
        this.type = "Nil";
    }

}

class EOF extends Token {
    type: string;

    constructor() {
        super();
        this.type = "EOF";
    }

}

export const CVUToken = {
    Operator,
    Bool,
    Number,
    String,
    Identifier,
    NamedIdentifier,
    StringExpression,
    Expression,
    Negation,
    Comma,
    Color,
    SemiColon,
    Colon,
    Newline,
    CurlyBracketOpen,
    CurlyBracketClose,
    BracketOpen,
    BracketClose,
    Nil,
    EOF
};

export var CVUOperator = {
    ConditionAND: "AND",
    ConditionOR: "OR",
    ConditionEquals: "="

    // var precedence: Int {
    //     switch self {
    //         case .ConditionAND: return 20
    //         case .ConditionOR: return 30
    //         case .ConditionEquals: return 35
    //     }
    // }
};
var Mode = {
    idle: 0,
    color: 5,
    comment: 8,
    keyword: 10,
    namedIdentifier: 11,
    number: 20,
    expression: 25,
    string: 30,
    escapedString: 35,
};

let keywords = {
    "true": (ln, ch) => { return new CVUToken.Bool(true, ln, ch) },
    "True": (ln, ch) => { return new CVUToken.Bool(true, ln, ch) },
    "false": (ln, ch) => { return new CVUToken.Bool(false, ln, ch) },
    "False": (ln, ch) => { return new CVUToken.Bool(false, ln, ch) },
    "and": (ln, ch) => { return new CVUToken.Operator(CVUOperator.ConditionAND, ln, ch) },
    "AND": (ln, ch) => { return new CVUToken.Operator(CVUOperator.ConditionAND, ln, ch) },
    "or": (ln, ch) => { return new CVUToken.Operator(CVUOperator.ConditionOR, ln, ch) },
    "OR": (ln, ch) => { return new CVUToken.Operator(CVUOperator.ConditionOR, ln, ch) },
    "equals": (ln, ch) => { return new CVUToken.Operator(CVUOperator.ConditionEquals, ln, ch) },
    "EQUALS": (ln, ch) => { return new CVUToken.Operator(CVUOperator.ConditionEquals, ln, ch) },
    "not": (ln, ch) => { return new CVUToken.Negation(ln, ch) },
    "NOT": (ln, ch) => { return new CVUToken.Negation(ln, ch) },
    "nil": (ln, ch) => { return new CVUToken.Nil(ln, ch) },
    "null": (ln, ch) => { return new CVUToken.Nil(ln, ch) },
};

export class CVULexer {
    constructor(input) {
        this.input = input
    }

    tokenize() {
        var tokens = [];
        tokens.push1 = tokens.push
        tokens.push = function(x) {
            if (!x) debugger
            tokens.push1(x)
        }

        var isMode = Mode.idle;
        var keyword = [];

        function addToken(token) {
            if (isMode == Mode.number) {
                tokens.push(new CVUToken.Number(parseFloat(keyword.join("")), ln, ch))
                keyword = []
                isMode = Mode.idle
            }
            else if (isMode == Mode.color) {
                tokens.push(new CVUToken.Color(keyword.join(""), ln, ch))
                keyword = []
                isMode = Mode.idle
            }
            else if (isMode == Mode.keyword || isMode == Mode.namedIdentifier) {
                let kw = keyword.join("")

                if (keywords.hasOwnProperty(kw)) { tokens.push(keywords[kw](ln, ch)) }
                else if (isMode == Mode.namedIdentifier) {
                    tokens.push(new CVUToken.NamedIdentifier(kw, ln, ch - kw.length - 1))
                }
                else if (kw.length){ tokens.push(new CVUToken.Identifier(kw, ln, ch - kw.length)) }

                keyword = []
                isMode = Mode.idle
            }

            if (token) { tokens.push(token!) }
        }

        var ln = 0, ch = -1, startChar = " "
        var lastChar = " ", isStringExpression = false

        var input = this.input;
        for (var i = 0; i <= input.length; i++) {
            var c = input[i];
            ++ch;

            if (isMode >= Mode.string) {
                if (isMode == Mode.escapedString) {
                    keyword.push(c)
                    isMode = Mode.string
                }
                else if (c == "\\") {
                    isMode = Mode.escapedString
                }
                else if (isMode == Mode.string && (c == startChar)) {
                    if (isStringExpression) {
                        tokens.push(new CVUToken.StringExpression(keyword.join(""), ln, ch))
                    }
                    else {
                        tokens.push(new CVUToken.String(keyword.join(""), ln, ch))
                    }

                    keyword = []
                    isMode = Mode.idle
                    isStringExpression = false
                    continue
                }
                else {
                    keyword.push(c)
                }

                if (c == "{") { isStringExpression = true }

                continue
            }

            if (isMode == Mode.expression) {
                if (c == "}" && lastChar == "}") {
                    if (tokens.pop()) {
                        keyword.pop()

                        tokens.push(new CVUToken.Expression(keyword.join(""), ln, ch - 1))
                        keyword = []
                        isMode = Mode.idle
                    }
                }
                else {
                    keyword.push(c)
                    lastChar = c
                }

                continue
            }

            if (isMode == Mode.comment) {
                if (c == "/" && lastChar == "*") { isMode = Mode.idle }
                lastChar = c
                continue
            }

            switch(c){
                case "\n":
                    addToken(new CVUToken.Newline(ln, ch))
                    ln += 1
                    ch = 0
                    break
                case "!": addToken(new CVUToken.Negation(ln, ch)); break
                case "[": addToken(new CVUToken.BracketOpen(ln, ch)); break
                case "]": addToken(new CVUToken.BracketClose(ln, ch)); break
                case "=": addToken(new CVUToken.Operator(CVUOperator.ConditionEquals, ln, ch)); break
                case ",": addToken(new CVUToken.Comma(ln, ch)); break
                case ":": addToken(new CVUToken.Colon(ln, ch)); break
                case ";": addToken(new CVUToken.SemiColon(ln, ch)); break
                case "'": case '"':
                    isMode = Mode.string
                    startChar = c
                    break
                case " ": case "\t": addToken(); break
                case "/":
                    isMode = Mode.comment; break // TODO check for * after /
                case "-":
                    if (isMode != Mode.idle) { keyword.push("-");break; }
                case "0": case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
                    if (isMode == Mode.idle) { isMode = Mode.number }
                    keyword.push(c)
                    break
                case "#":
                    isMode = Mode.color; break
                case "{":
                    if (lastChar == "{") {
                        isMode = Mode.expression
                    }
                    else { addToken(new CVUToken.CurlyBracketOpen(ln, ch)) }
                    break
                case "}":
                    addToken(new CVUToken.CurlyBracketClose(ln, ch)); break
                case ".":
                    if (isMode == Mode.idle) { 
                        isMode = Mode.namedIdentifier 
                        break
                    }
                    else if (isMode == Mode.number) {
                        keyword.push(c) 
                        break;
                    }
                    // else fallthrough
                default:
                    if (isMode == Mode.idle) { isMode = Mode.keyword }
                    keyword.push(c)
                    break
            }

            lastChar = c
        }

        if (keyword.length > 0) {
            addToken()
        }

        if (isMode == Mode.string) {
            throw new CVUParseErrors.MissingQuoteClose(new CVUToken.EOF())
        }
        else if (isMode == Mode.expression) {
            throw new CVUParseErrors.MissingExpressionClose(new CVUToken.EOF())
        }
        else if (isMode != Mode.idle) {
            // TODO
            throw new Error(`Unhandled error mode: ${isMode}`)
        }

        return tokens
    }
}


/*
function tokenize(string) {
    return new CVULexer(string).tokenize()
}

let snippet = "[color = background] {" +
    "dark: #ff0000" +
    "light: #330000" +
"}";

console.log(tokenize(snippet));
*/

 