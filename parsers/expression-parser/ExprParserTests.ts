//
//  ParserTests.swift
//
//  Created by Ruben Daniels on 5/15/20.
//  Copyright © 2020 Memri. All rights reserved.
//
import {ExprParser} from "./ExprParser";
import {ExprLexer} from "./ExprLexer";
const assert = require("assert");
var fs = require("fs");

var testCases = fs.readFileSync("tests/ExprParserTests.json", "utf8");
const ExprParserTests = JSON.parse(testCases);

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
                let result = parse(test.snippet, test.startMode)
                if (!test.result) {
                    console.error(key, "expected to throw ", test.error, "but returned ", result);
                    throw new Error(key + " expected to throw error");
                }
                assert.equal(result.toString(), test.result);
            } catch (e) {
                if (!test.error) {
                    console.error(e)
                    throw e;
                }
                assert.equal(e.toErrorString(), test.error);
            }
        });
    })
})
