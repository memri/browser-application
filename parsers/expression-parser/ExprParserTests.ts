//
//  ParserTests.swift
//
//  Created by Ruben Daniels on 5/15/20.
//  Copyright © 2020 Memri. All rights reserved.
//
const {ExprParser} = require("./ExprParser");
const {ExprLexer} = require("./ExprLexer");
const assert = require("assert");

const ExprParserTests = {

    testArithmeticOperators: {
        snippet: "(5 + 10 * 4 - 3 / 10) / 10",
        result: "BinaryOpNode(Division, lhs: BinaryOpNode(Minus, lhs: BinaryOpNode(Plus, lhs: NumberNode(5.0), rhs: BinaryOpNode(Multiplication, lhs: NumberNode(10.0), rhs: NumberNode(4.0))), rhs: BinaryOpNode(Division, lhs: NumberNode(3.0), rhs: NumberNode(10.0))), rhs: NumberNode(10.0))",
    },
    testAnd: {
        snippet: "true and false",
        result: "BinaryOpNode(ConditionAND, lhs: BoolNode(true), rhs: BoolNode(false))",
    },

    testOr: {
        snippet: "true or false",
        result: "BinaryOpNode(ConditionOR, lhs: BoolNode(true), rhs: BoolNode(false))"
    },

    testSimpleCondition: {
        snippet: "true ? 'yes' : 'no'",
        result: "ConditionNode(condition: BoolNode(true), trueExp: StringNode(yes), falseExp: StringNode(no))"
    },

    testMultiCondition: {
        snippet: "true ? false and true ? -1 : false or true ? 'yes' : 'no' : -1",
        result: "ConditionNode(condition: BoolNode(true), trueExp: ConditionNode(condition: BinaryOpNode(ConditionAND, lhs: BoolNode(false), rhs: BoolNode(true)), trueExp: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: NumberNode(1.0)), falseExp: ConditionNode(condition: BinaryOpNode(ConditionOR, lhs: BoolNode(false), rhs: BoolNode(true)), trueExp: StringNode(yes), falseExp: StringNode(no))), falseExp: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: NumberNode(1.0)))"
    },

    testLookup: {
        snippet: ".bar and bar.foo(10) and bar[foo = 10] or shouldNeverGetHere",
        result: "BinaryOpNode(ConditionAND, lhs: BinaryOpNode(ConditionAND, lhs: LookupNode([VariableNode(@@DEFAULT@@), VariableNode(bar)]), rhs: CallNode(lookup: LookupNode([VariableNode(bar), VariableNode(foo)]), argument: [NumberNode(10.0)])), rhs: BinaryOpNode(ConditionOR, lhs: LookupNode([VariableNode(bar), LookupNode([BinaryOpNode(ConditionEquals, lhs: LookupNode([VariableNode(foo)]), rhs: NumberNode(10.0))])]), rhs: LookupNode([VariableNode(shouldNeverGetHere)])))"
    },

    testDotLookup: {
        snippet: ".",
        result: "LookupNode([VariableNode(@@DEFAULT@@)])"
    },

    testMinusPlusModifier: {
        snippet: "-5 + -(5+10) - +'5'",
        result: "BinaryOpNode(Minus, lhs: BinaryOpNode(Plus, lhs: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: NumberNode(5.0)), rhs: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: BinaryOpNode(Plus, lhs: NumberNode(5.0), rhs: NumberNode(10.0)))), rhs: NumberExpressionNode(StringNode(5)))"
    },

    testNegation: {
        snippet: "!true",
        result: "NegationNode(BoolNode(true))"
    },

    testStringEscaping: {
        snippet: "'asdadsasd\\'asdasd'",
        result: "StringNode(asdadsasd'asdasd)"
    },

    testTypeConversionToNumber: {
        snippet: "5 + '10.34' + true",
        result: "BinaryOpNode(Plus, lhs: BinaryOpNode(Plus, lhs: NumberNode(5.0), rhs: StringNode(10.34)), rhs: BoolNode(true))"
    },

    testTypeConversionToBool: {
        snippet: "0 ? -1 : 1 ? '' ? -1 : 'yes' : -1",
        result: "ConditionNode(condition: NumberNode(0.0), trueExp: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: NumberNode(1.0)), falseExp: ConditionNode(condition: NumberNode(1.0), trueExp: ConditionNode(condition: StringNode(), trueExp: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: NumberNode(1.0)), falseExp: StringNode(yes)), falseExp: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: NumberNode(1.0))))"
    },

    testSelfUsageInSubExpression: {
        snippet: ".relation[. = me].firstName",
        result: "LookupNode([VariableNode(@@DEFAULT@@, type:propertyOrItem, list:single), VariableNode(relation, type:propertyOrItem, list:list), LookupNode([BinaryOpNode(ConditionEquals, lhs: LookupNode([VariableNode(@@DEFAULT@@, type:propertyOrItem, list:single)]), rhs: LookupNode([VariableNode(me, type:propertyOrItem, list:single)]))]), VariableNode(firstName, type:propertyOrItem, list:single)])"
    },

    testLookupItems: {
        snippet: ".sibling[]",
        result: "LookupNode([VariableNode(@@DEFAULT@@, type:propertyOrItem, list:single), VariableNode(sibling, type:propertyOrItem, list:list)])"
    },

    testLookupReverseEdgeItems: {
        snippet: ".~sibling",
        result: "LookupNode([VariableNode(@@DEFAULT@@, type:propertyOrItem, list:single), VariableNode(sibling, type:reverseEdgeItem, list:single)])"
    },

    testLookupEdges: {
        snippet: "._sibling",
        result: "LookupNode([VariableNode(@@DEFAULT@@, type:propertyOrItem, list:single), VariableNode(sibling, type:edge, list:single)])"
    },

    testLookupReverseEdges: {
        snippet: "._~sibling[]",
        result: "LookupNode([VariableNode(@@DEFAULT@@, type:propertyOrItem, list:single), VariableNode(sibling, type:reverseEdge, list:list)])"
    },

    testStringModeStartWithString: {
        snippet: "Hello {fetchName()}!",
        startMode: "string",
        result: "StringModeNode(expressions: [StringNode(Hello ), CallNode(lookup: LookupNode([VariableNode(fetchName)]), argument: []), StringNode(!)])"
    },

    testStringModeMultipleBlocks: {
        snippet: "Hello {.firstName} {.lastName}",
        startMode: "string",
        result: "StringModeNode(expressions: [StringNode(Hello ), LookupNode([VariableNode(@@DEFAULT@@), VariableNode(firstName)]), StringNode( ), LookupNode([VariableNode(@@DEFAULT@@), VariableNode(lastName)])])"
    },

    testStringModeStartWithExpression: {
        snippet: "{fetchName()} Hello",
        startMode: "string",
        result: "StringModeNode(expressions: [CallNode(lookup: LookupNode([VariableNode(fetchName)]), argument: []), StringNode( Hello)])"
    },

    testStringModeWithQuote: {
        snippet: "Photo AND ANY includes.uid = {.uid}",
        startMode: "string",
        result: "StringModeNode(expressions: [StringNode(Photo AND ANY includes.uid = ), LookupNode([VariableNode(@@DEFAULT@@), VariableNode(uid)]), StringNode()])"
    },

    testExample: {
        snippet: `
        !(test + -5.63537) or 4/3 ? variable.function() : me.address[primary = true].country ? ((4+5 * 10) + test[10]) : 'asdads\\'asdad' + ''
        `,
        result: "ConditionNode(condition: BinaryOpNode(ConditionOR, lhs: NegationNode(BinaryOpNode(Plus, lhs: LookupNode([VariableNode(test)]), rhs: BinaryOpNode(Multiplication, lhs: NumberNode(-1.0), rhs: NumberNode(5.63537)))), rhs: BinaryOpNode(Division, lhs: NumberNode(4.0), rhs: NumberNode(3.0))), trueExp: CallNode(lookup: LookupNode([VariableNode(variable), VariableNode(function)]), argument: []), falseExp: ConditionNode(condition: LookupNode([VariableNode(me), VariableNode(address), LookupNode([BinaryOpNode(ConditionEquals, lhs: LookupNode([VariableNode(primary)]), rhs: BoolNode(true))]), VariableNode(country)]), trueExp: BinaryOpNode(Plus, lhs: BinaryOpNode(Plus, lhs: NumberNode(4.0), rhs: BinaryOpNode(Multiplication, lhs: NumberNode(5.0), rhs: NumberNode(10.0))), rhs: LookupNode([VariableNode(test), LookupNode([NumberNode(10.0)])])), falseExp: BinaryOpNode(Plus, lhs: StringNode(asdads'asdad), rhs: StringNode())))"
    },

    testErrorIncompleteCondition: {
        snippet: "true ? 'yes'",
        error: "ExpectedConditionElse"
    },

    testErrorIncompleteBinaryOp: {
        snippet: "5 +",
        error: "ExpectedExpression(EOF)"
    },

    testErrorUnsupportedBinaryOp: {
        snippet: "5 @ 4",
        error: "UnexpectedToken(Identifier, @, 3)",
    },

    testErrorMissingParenClose: {
        snippet: "(5 + 10",
        error: "ExpectedCharacter())",
    },

    testErrorMissingCallParenClose: {
        snippet: "foo(",
        error: "ExpectedExpression(EOF)"
    },

    testErrorMissingBracketClose: {
        snippet: "test[10",
        error: "ExpectedCharacter(])",
    },

    testErrorMissingQuoteClose: {
        snippet: "'asdads",
        error: "MissingQuoteClose",
    },

    testErrorUsingCurlyBracesNotInStringMode: {
        snippet: "Hello {fetchName()}",
        error: "UnexpectedToken(CurlyBracketOpen, 6)"
    },

    testErrorUsingCurlyBracesInWrongContext: {
        snippet: `a || "Hello {'{fetchName()}'}"`,
        startMode: "string",
        result: ""
    },
}

function parse(snippet, mode) {
    // console.log(snippet)
    let lexer = new ExprLexer(snippet, mode)
    let tokens = lexer.tokenize()
    // console.log(tokens)
    let parser = new ExprParser(tokens)
    return parser.parse()
}

describe("ExprParser", function () {
    Object.keys(ExprParserTests).forEach(function (key) {
        it(key, function () {
            var test = ExprParserTests[key];
            try {
                result = parse(test.snippet, test.startMode)
                if (!test.result) {
                    console.error(key, "expected to throw ", test.error, "but returned ", result);
                    throw new Error(key + " expected to throw error");
                }
                assert.equal(result.toString(), test.result);
            } catch (e) {
                console.error(e)
                if (!test.error) {
                    throw e;
                }
                assert.equal(e.toErrorString(), test.error);
            }
        });
    })
})
