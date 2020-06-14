//
//  Parser.swift
//
//  Based on work by Matthew Cheok on 15/11/15.
//  Copyright © 2015 Matthew Cheok. All rights reserved.
//  Copyright © 2020 memri. All rights reserved.
//
const {ExprLexer, ExprToken, ExprOperator, ExprOperatorPrecedence} = require("./ExprLexer");
const ExprNodes = require("./ExprNodes");

var ExprParseErrors = exports.ExprParseErrors = {
    UnexpectedToken: function (value) {
        this.value = value;
        this.type = "UnexpectedToken";
    },
    UndefinedOperator: function (value) {
        this.value = value;
        this.type = "UndefinedOperator";
    },
    ExpectedCharacter: function (value) {
        this.value = value;
        this.type = "ExpectedCharacter";
    },
    ExpectedExpression: function (value) {
        this.value = value;
        this.type = "ExpectedExpression";
    },
    ExpectedArgumentList: function () {
        this.type = "ExpectedArgumentList"
    },
    ExpectedIdentifier: function () {
        this.type = "ExpectedIdentifier"
    },
    ExpectedConditionElse: function () {
        this.type = "ExpectedConditionElse"
    },
    MissingQuoteClose: function () {
        this.type = "MissingQuoteClose"
    },
};

class ExprParser {
    index = 0;
    lastToken = undefined;
    countStringModeNodes = 0;

    constructor(tokens) {
        this.tokens = tokens;
    }

    peekCurrentToken() {
        return this.index >= this.tokens.length
            ? new ExprToken.EOF()
            : this.tokens[this.index]
    }

    popCurrentToken() {
        if (this.index >= this.tokens.length) {
            this.lastToken = new ExprToken.EOF();
            return new ExprToken.EOF();
        }

        this.lastToken = this.tokens[this.index];
        ++this.index;
        let token = this.lastToken;
        return token ? token : new ExprToken.EOF() // Check for out of bound?
    }

    parse() {
        this.index = 0;
        const result = this.parseExpression();
        let token = this.popCurrentToken();
        if (token.constructor == ExprToken.EOF) {
            return result;
        }
        throw new ExprParseErrors.UnexpectedToken(this.lastToken);
    }

    parseExpression() {
        let node = this.parsePrimary();
        return this.parseBinaryOp(node);
    }

    parsePrimary(skipOperator = false) {
        switch (this.peekCurrentToken().constructor) {
            case ExprToken.Negation:
                return this.parseNegation();
            case ExprToken.Identifier:
                return this.parseIdentifier();
            case ExprToken.Number:
                return this.parseNumber();
            case ExprToken.String:
                return this.parseString();
            case ExprToken.Bool:
                return this.parseBool();
            case ExprToken.CurlyBracketOpen:
                return this.parseCurlyBrackets();
            case ExprToken.ParensOpen:
                return this.parseParens();
            case ExprToken.Period:
                return this.parsePeriod();
            case ExprToken.Operator:
                if (!skipOperator) {
                    return this.parseOperator();
                }
            default:
                throw ExprParseErrors.ExpectedExpression(this.popCurrentToken())
        }
    }

    parseLookupExpression() {
        return this.parseExpression(); // TODO maybe: This could be limited to int and string
    }

    parseIntExpressionComponent() {
        return this.parsePrimary(true);
    }

    parseNumber() {
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.Number) {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }
        let value = token.value;
        return new ExprNodes.ExprNumberNode(value);
    }

    parseString() {
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.String) {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }
        let value = token.value;
        return new ExprNodes.ExprStringNode(value)
    }

    parseBool() {
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.Bool) {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }
        let value = token.value;
        return new ExprNodes.ExprBoolNode(value)
    }

    parsePeriod() {
        let token = this.peekCurrentToken();
        if (token.constructor != ExprToken.Period) {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }

        return this.parseIdentifier(new ExprNodes.ExprVariableNode("__DEFAULT__"))
    }

    parseOperator() {
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.Operator) {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }
        let op = token.value;
        if (op == ExprOperator.Minus) {
            let exp = this.parseIntExpressionComponent();
            return new ExprNodes.ExprBinaryOpNode(ExprOperator.Multiplication, new ExprNodes.ExprNumberNode(-1), exp);
        } else if (op == ExprOperator.Plus) {
            let exp = this.parseIntExpressionComponent();
            return new ExprNodes.ExprNumberExpressionNode(exp);
        } else {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }
    }

    parseNegation() {
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.Negation) {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }

        let exp = this.parsePrimary();

        return new ExprNodes.ExprNegationNode(exp);
    }

    parseCurlyBrackets() {
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.CurlyBracketOpen) {
            throw ExprParseErrors.ExpectedCharacter("{");
        }

        return this.parseStringMode()
    }

    parseParens() {
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.ParensOpen) {
            throw ExprParseErrors.ExpectedCharacter("(");
        }

        let exp = this.parseExpression();
        token = this.popCurrentToken();
        if (token.constructor != ExprToken.ParensClose) {
            throw ExprParseErrors.ExpectedCharacter(")");
        }

        return exp;
    }

    parseIdentifier(defaultNode) {
        var sequence = [];

        if (defaultNode) {
            sequence.push(defaultNode)
        } else {
            let token = this.popCurrentToken();
            if (token.constructor != ExprToken.Identifier) {
                throw ExprParseErrors.UnexpectedToken(this.lastToken);
            }
            let name = token.value;
            sequence.push(new ExprNodes.ExprVariableNode(name));
        }

        while (true) {
            let token = this.peekCurrentToken();
            if (token.constructor == ExprToken.BracketOpen) {
                this.popCurrentToken();

                let exp = this.parseLookupExpression();
                sequence.push(new ExprNodes.ExprLookupNode([exp]));

                token = this.popCurrentToken();
                if (token.constructor != ExprToken.BracketClose) {
                    throw ExprParseErrors.ExpectedCharacter("]");
                }
            }
            token = this.peekCurrentToken();
            if (token.constructor == ExprToken.Period) {
                this.popCurrentToken();
            } else {
                break;
            }
            token = this.popCurrentToken();
            if (token.constructor == ExprToken.Identifier) {
                let name = token.value;
                sequence.push(new ExprNodes.ExprVariableNode(name));
            } else {
                throw ExprParseErrors.ExpectedIdentifier;
            }
        }

        let node = new ExprNodes.ExprLookupNode(sequence);
        let token = this.peekCurrentToken();
        if (token.constructor != ExprToken.ParensOpen) {
            return node;
        }

        this.popCurrentToken();

        var argumentsJs = [];
        token = this.peekCurrentToken();
        if (token.constructor == ExprToken.ParensClose) {
            // Do nothing
        } else {
            while (true) {
                let argument = this.parseExpression();
                argumentsJs.push(argument);
                let token = this.peekCurrentToken();
                if (token.constructor == ExprToken.ParensClose) {
                    break;
                }
                token = this.popCurrentToken();
                if (token.constructor != ExprToken.Comma) {
                    throw ExprParseErrors.ExpectedArgumentList;
                }
            }
        }

        this.popCurrentToken();
        return new ExprNodes.ExprCallNode(node, argumentsJs);
    }

    getCurrentTokenPrecedence() {
        if (this.index >= this.tokens.length) return -1;

        let nextToken = this.peekCurrentToken();
        if (nextToken.constructor != ExprToken.Operator) {
            if (ExprToken.CurlyBracketOpen == nextToken.constructor) return 1;
            if (ExprToken.CurlyBracketClose == nextToken.constructor) return 2;

            return -1;
        }
        let op = nextToken.value;
        return ExprOperatorPrecedence[op];
    }

    parseBinaryOp(node, exprPrecedence = 0) {
        var lhs = node;
        while (true) {
            let tokenPrecedence = this.getCurrentTokenPrecedence();
            if (tokenPrecedence < exprPrecedence) {
                return lhs;
            }

            let nextToken = this.peekCurrentToken();
            let op = nextToken.value;
            if (ExprToken.Operator == nextToken.constructor && op == ExprOperator.ConditionElse) {
                return lhs
            }
            if (ExprToken.CurlyBracketClose == nextToken.constructor) {
                return lhs
            }

            let token = this.popCurrentToken();
            if (token.constructor != ExprToken.Operator) {
                if (ExprToken.CurlyBracketOpen == this.lastToken.constructor) {
                    return this.parseStringMode(lhs);
                }

                throw ExprParseErrors.UnexpectedToken(this.lastToken);
            }
            op = token.value;
            if (op == ExprOperator.ConditionStart) {
                return this.parseConditionOp(lhs)
            }

            var rhs = this.parsePrimary();
            let nextPrecedence = this.getCurrentTokenPrecedence();

            if (tokenPrecedence < nextPrecedence) {
                rhs = this.parseBinaryOp(rhs, tokenPrecedence + 1)
            }
            lhs = new ExprNodes.ExprBinaryOpNode(op, lhs, rhs);
        }
    }

    parseConditionOp(conditionNode) {
        let trueExp = this.parseExpression();
        let token = this.popCurrentToken();
        if (token.constructor != ExprToken.Operator) {
            throw ExprParseErrors.ExpectedConditionElse;
        }
        let op = token.value;
        if (op != ExprOperator.ConditionElse) {
            throw ExprParseErrors.ExpectedConditionElse;
        }

        let falseExp = this.parseExpression();

        return new ExprNodes.ExprConditionNode(conditionNode, trueExp, falseExp);
    }

    parseStringMode(firstNode) {
        ++this.countStringModeNodes;
        if (this.countStringModeNodes > 1) {
            throw ExprParseErrors.UnexpectedToken(this.lastToken);
        }

        var expressions = [];
        if (firstNode) {
            expressions.push(firstNode)
        }

        while (true) {
            let nextToken = this.peekCurrentToken();
            if (ExprToken.EOF == nextToken.constructor) {
                break
            }
            if (ExprToken.String == nextToken.constructor) {
                expressions.push(this.parseString());
                continue;
            }
            if (ExprToken.CurlyBracketOpen == nextToken.constructor) {
                this.popCurrentToken();
            }

            expressions.push(this.parseExpression());
            let token = this.popCurrentToken();
            if (token.constructor != ExprToken.CurlyBracketClose) {
                if (ExprToken.EOF == this.lastToken.constructor) {
                    break;
                }
                throw ExprParseErrors.ExpectedCharacter("}");
            }
        }

        return new ExprNodes.ExprStringModeNode(expressions);
    }
}

// let lexer = new ExprLexer.ExprLexer("Hello {fetchName()}!", true);
// let tokens =  lexer.tokenize();
// let parser = new ExprParser(tokens);
// let result =  parser.parse();


exports.ExprParser = ExprParser