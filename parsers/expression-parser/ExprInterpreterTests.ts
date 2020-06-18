//
//  InterpreterTests.swift
//
//  Created by Ruben Daniels on 5/15/20.
//  Copyright © 2020 Memri. All rights reserved.
//
const {ExprParser} = require("./ExprParser");
const {ExprLexer} = require("./ExprLexer");
const {ExprInterpreter} = require("./ExprInterpreter");
const assert = require("assert");

const ExprInterpreterTests = {

    testArithmeticOperators: {
        snippet: "(5 + 10 * 4 - 3 / 10) / 10",
        result: (5 + 10 * 4 - 3 / 10) / 10,
    },

    testAnd: {
        snippet: "true and false",
        result: false,
    },
    
    testOr: {
        snippet: "true and false",
        result: true,
    },
    
    testSimpleCondition: {
        snippet: "true ? 'yes' : 'no'",
        startMode: "string",
        result: "yes",
    },
    
    testMultiCondition: {
        snippet: "true ? false and true ? -1 : false or true ? 'yes' : 'no' : -1",
        startMode: "string",
        result: "yes",
    },
    
    testLookup: {
        snippet: "true ? false and true ? -1 : false or true ? 'yes' : 'no' : -1",
        startMode: "string",
        result: true,
        results: [],
        lookup: function (lookup, viewArgs) {
            this.results.push(lookup)
            return true
        },
        execFunc: function (lookup, args, viewArgs) {
            this.results.push(lookup)
            assert.equal(args[0], 10)
            return true
        },
        callBack: function (result) {
            assert.equal(this.results.count, 3)

            assert.equal(this.results[0].description, "LookupNode([VariableNode(__DEFAULT__), VariableNode(bar)])")
            assert.equal(this.results[1].description, "LookupNode([VariableNode(bar), VariableNode(foo)])")
            assert.equal(this.results[2].description, "LookupNode([VariableNode(bar), LookupNode([BinaryOpNode(ConditionEquals, lhs: LookupNode([VariableNode(foo)]), rhs: NumberNode(10.0))])])")
        }
    },

    testMinusPlusModifier: {
        snippet: "-5 + -(5+10) - +'5'",
        startMode: "string",
        result: -25,
    },
    
    testNegation: {
        snippet: "!true",
        result: false,
    },
    
    testStringEscaping: {
        snippet: "'asdadsasd\\'asdasd'",
        startMode: "string",
        result: "asdadsasd'asdasd",
    },
    
    testTypeConversionToNumber: {
        snippet: "5 + '10.34' + true",
        startMode: "string",
        result: 16.34,
    },
    
    testNanStringToInt: {
        snippet: "+'asdasd'",
        startMode: "string",
        callBack: function (result) {
            assert.ok(result.isNaN());//TODO
        }
    },
    
    testTypeConversionToBool: {
        snippet: "0 ? -1 : 1 ? '' ? -1 : 'yes' : -1",
        startMode: "string",
        result: "yes",
    },
    
    testStringModeStartWithString: {
        snippet: "Hello {fetchName()}!",
        startMode: "string",
        result: "Hello Memri!",
        execFunc: function (lookup, args, viewArgs) {
            return "Memri"
        },
    },
    
    testStringModeStartWithExpression: {
        snippet: "{fetchName()} Hello",
        startMode: "string",
        result: "Memri Hello",
        execFunc: function (lookup, args, viewArgs) {
            return "Memri"
        },
    },
    
    testExample: {
        snippet: `
        !(test + -5.63537) or 4/3 ? variable.function() : me.address[primary = true].country ? ((4+5 * 10) + test[10]) : 'asdads\\'asdad' + ''
        `,
        startMode: "string",
        result: 20,
        lookup: function (lookup, viewArgs) {
            return 10
        },
        execFunc: function (lookup, args, viewArgs) {
            return 20
        },
    },
    
    testErrorLookupFailure: {
        snippet: ".bar",
        result: 20,
        lookup: function (lookup, viewArgs) {
            throw "Undefined variable"
        },
        execFunc: function (lookup, args, viewArgs) {
            1//TODO???
        },
        error: "Undefined variable"
        // XCTFail()//TODO???
    },
    
//    testPerformanceExample: {
//        // This is an example of a performance test case.
//        measure {
//            // Put the code you want to measure the time of here.
//        }
//    }

}

function parse(snippet, mode) {
    let lexer = new ExprLexer(snippet, mode)//TODO mode
    let tokens =  lexer.tokenize()
    let parser = new ExprParser(tokens)
    return parser.parse()
}

function exec(snippet, mode, lookup, execFunc) {
    let tree =  parse(snippet, mode)
    let interpreter = new ExprInterpreter(tree, lookup, execFunc)//TODO
    return interpreter.execute(null)//TODO
}


describe("ExprInterpreter", function() {
    Object.keys(ExprInterpreterTests).forEach(function(key) {
        it (key, function() {
            var test = ExprInterpreterTests[key];
            try {
                if (test.lookup) test.lookup.bind(test)
                if (test.execFunc) test.execFunc.bind(test)

                result = exec(test.snippet, test.startMode, test.lookup, test.execFunc)
                if (test.callBack) test.callBack(result)
                if (!test.result) {
                    if (test.error) {
                        console.error(key, "expected to throw ", test.error, "but returned ", result);
                        throw new Error(key + " expected to throw error");
                    }
                    return;
                }
                assert.equal(result.toString(), test.result);
            } catch(e) {
                console.error(e)
                if (!test.error) {
                    throw e;
                }
                assert.equal(e.toErrorString(), test.error);
            }
        });
    })
})