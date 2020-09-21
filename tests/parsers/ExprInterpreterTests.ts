//
//  InterpreterTests.swift
//
//  Created by Ruben Daniels on 5/15/20.
//  Copyright © 2020 Memri. All rights reserved.
//
import {ExprParser} from "../../memri/cvu/parsers/expression-parser/ExprParser";
import {ExprLexer} from "../../memri/cvu/parsers/expression-parser/ExprLexer";
import {ExprInterpreter} from "../../memri/cvu/parsers/expression-parser/ExprInterpreter";
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
        snippet: "true or false",
        result: true,
    },

    testEqualsTrue: {
        snippet: "1 = '1'",
        result: true,
    },

    testEqualsFalse: {
        snippet: "1 = 2",
        result: false,
    },

    testAndValue: {
        snippet: "true and 10",
        result: 10,
    },

    testOrValue: {
        snippet: "10 or 0",
        result: 10,
    },

    testSimpleCondition: {
        snippet: "true ? 'yes' : 'no'",
        result: "yes",
    },
    
    testMultiCondition: {
        snippet: "true ? false and true ? -1 : false or true ? 'yes' : 'no' : -1",
        result: "yes",
    },

    testConditionEquals: {
        snippet: "true = false",
        result: false,
    },

    testConditionNotEquals: {
        snippet: "true != false",
        result: true,
    },

    testConditionGreaterThan: {
        snippet: "5 > 10",
        result: false,
    },

    testConditionGreaterThanOrEqual: {
        snippet: "5 >= 5",
        result: true,
    },

    testConditionLessThan: {
        snippet: "5 < 10",
        result: true,
    },

    testConditionLessThanOrEqual: {
        snippet: "5 <= 5",
        result: true,
    },
    
    testLookup: {
        snippet: ".bar and bar.foo(10) and bar[foo = 10] or shouldNeverGetHere",
        result: true,
        results: [],
        lookup: function (lookup, viewArgs) {
            this.results.push(lookup)
            return true
        },
        execFunc: function (lookup, args, viewArgs) {
            this.results.push(lookup)
            try {assert.equal(args[0], 10)} catch (e) {console.log(e)}
            return true
        },
        callBack: function (result) {
            assert.equal(this.results.length, 3)

            assert.equal(this.results[0].toString(), "LookupNode([VariableNode(@@DEFAULT@@, type:propertyOrItem, list:single), VariableNode(bar, type:propertyOrItem, list:single)])")
            assert.equal(this.results[1].toString(), "LookupNode([VariableNode(bar, type:propertyOrItem, list:single), VariableNode(foo, type:propertyOrItem, list:single)])")
            assert.equal(this.results[2].toString(), "LookupNode([VariableNode(bar, type:propertyOrItem, list:list), LookupNode([BinaryOpNode(ConditionEquals, lhs: LookupNode([VariableNode(foo, type:propertyOrItem, list:single)]), rhs: NumberNode(10.0))])])")
        }
    },

    testMinusPlusModifier: {
        snippet: "-5 + -(5+10) - +'5'",
        result: -25,
    },
    
    testNegation: {
        snippet: "!true",
        result: false,
    },

    testNegationWithLookup: {
        snippet: "!.label",
        result: true,
        lookup: function (lookup) {
            return null
        },
        execFunc: function (lookup, args) {
            return true
        }
    },
    
    testStringEscaping: {
        snippet: "asdadsasd\\'asdasd",//TODO
        startMode: "string",
        result: "asdadsasd'asdasd",
    },
    
    testTypeConversionToNumber: {
        snippet: "5 + '10.34' + true",
        result: 16.34,
    },
    
    testNanStringToInt: {
        snippet: "+'asdasd'",
        callBack: function (result) {
            assert.ok(Number.isNaN(result));
        }
    },
    
    testTypeConversionToBool: {
        snippet: "0 ? -1 : 1 ? '' ? -1 : 'yes' : -1",
        result: "yes",
    },

    testTypeConversionStringToBool: {
        snippet: "''",
        result: false,
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
        lookup: function (lookup, viewArgs) {
            throw new Error("Undefined variable")
        },
        execFunc: function (lookup, args, viewArgs) {
            return 1//TODO???
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
                if (test.lookup) test.lookup = test.lookup.bind(test)
                if (test.execFunc) test.execFunc = test.execFunc.bind(test)

                let result = exec(test.snippet, test.startMode, test.lookup, test.execFunc)
                if (test.callBack) test.callBack(result)
                if (test.result == undefined) {
                    if (test.error) {
                        console.error(key, "expected to throw ", test.error, "but returned ", result);
                        throw new Error(key + " expected to throw error");
                    }
                    return;
                }
                assert.equal(result, test.result);
            } catch(e) {
                console.error(e)
                if (!test.error) {
                    throw e;
                }
                assert.equal(e.message, test.error);
            }
        });
    })
})