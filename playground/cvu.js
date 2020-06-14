"use strict";

var ace = require("ace-builds")
require("ace-builds/src-noconflict/mode-javascript");

var oop = ace.require("ace/lib/oop");
var TextMode = ace.require("ace/mode/text").Mode;
var FoldMode = ace.require("ace/mode/folding/cstyle").FoldMode;
var TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules;

var CvuHighlightRules = function() {
    var keywordMapper = this.createKeywordMapper({
        "constant.language":
            "false|Infinity|NaN|nil|no|null|null|off|on|super|this|true|undefined|yes",
        "keyword":
            "and|AND|or|OR|equals|EQUALS|not|NOT"
    }, "identifier");

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used
    this.$rules = {
        "start": [
            {
                token: "comment.start",
                regex: "\\/\\*",
                next: "comment"
            }, {
                token: "paren.lparen",
                regex: "[[({]"
            }, {
                token: "paren.rparen",
                regex: "[\\])}]"
            }, {
                token: "text",
                regex: "\\s+"
            }, {
                token: "variable",
                regex: "\\b\\w+(?=\\s*:)"
            },
            {
                include: "expressions"
            }
        ],
        "string": [
            {
                token: "constant.language.escape",
                regex: /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|['"\\\/bfnrt])/
            }, {
                token: "string",
                regex: '{',
                push: "expressions",
            }, {
                token: "string",
                regex: '["\']',
                next: "start",
                onMatch: function (value, currentState, stack) {
                    if (value == stack[1]) {
                        stack.shift();
                        stack.shift();
                        this.next = stack.shift();
                    } else {
                        this.next = '';
                    }
                    return this.token;
                },
            }, {
                defaultToken: "string"
            }
        ],
        "comment": [
            {
                token: "comment.end",
                regex: "\\*\\/",
                next: "start"
            }, {
                defaultToken: "comment"
            }
        ],
        "expressions": [
            {
                token: "string",
                regex: '["\']',
                next: "string",
                onMatch: function (value, currentState, stack) {
                    stack.unshift(this.next, value, currentState);
                    return this.token;
                },
            },
            {
                token: "constant.numeric", // hex
                regex: "(?:0[xX]|#)[0-9a-fA-F]+\\b"
            }, {
                token: "constant.numeric", // float
                regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }, {
                token: "constant.language.boolean",
                regex: "(?:[Tt]rue|[Ff]alse)\\b"
            },
            {
                token: keywordMapper,
                regex: "\\b\\w+\\b"
            }, {
                token: "keyword.operator",
                regex: "[=!+*/-]"
            }, {
                token: "punctuation.operator",
                regex: "[?:.,;]"
            },
            {
                token: "paren.lparen",
                regex: "[[(]"
            }, {
                token: "paren.rparen",
                regex: "[\\])]"
            },
            {
                token: "string",
                regex: "}",
                onMatch: function (value, currentState, stack) {
                    if (stack[0] == "expressions") {
                        stack.shift();
                        this.next = stack.shift();
                    }
                    return this.token;
                },
            },
        ]
    };
    this.normalizeRules();
};

oop.inherits(CvuHighlightRules, TextHighlightRules);

exports.CvuHighlightRules = CvuHighlightRules;
 

var Mode = function() {
    this.HighlightRules = CvuHighlightRules;
    this.foldingRules = new FoldMode();
};
oop.inherits(Mode, TextMode);

(function() {
    this.blockComment = { start: "/*", end: "*/" };
    this.$id = "ace/mode/cvu";

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        if (state == "start") {
            var match = line.match(/^.*(?:[{\[])\s*$/);
            if (match) {
                indent += tab;
            }
        }

        return indent;
    };
}).call(Mode.prototype);

exports.Mode = Mode;

