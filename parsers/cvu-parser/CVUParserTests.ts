//
//  ViewParserTests.swift
//
//  Created by Ruben Daniels on 5/20/20.
//  Copyright © 2020 Memri. All rights reserved.
//
import {CVUParser} from "./CVUParser";
import {CVULexer} from "./CVULexer";
import {CVUSerializer} from "./CVUToString";

const assert = require("assert");

/*const CVUParserTests = {

    testArithmeticOperators: {
        snippet: `
        [color = background] {
            dark: #ff0000
            light: #330000
        }
        `,
        result: "BinaryOpNode(Division, lhs: BinaryOpNode(Minus, lhs: BinaryOpNode(Plus, lhs: NumberNode(5.0), rhs: BinaryOpNode(Multiplication, lhs: NumberNode(10.0), rhs: NumberNode(4.0))), rhs: BinaryOpNode(Division, lhs: NumberNode(3.0), rhs: NumberNode(10.0))), rhs: NumberNode(10.0))",
    },
}*/

class CVUParserTests {
    setUpWithError() {

    }

    tearDownWithError() {
    }

    parse(snippet) {
        let lexer = new CVULexer(snippet);
        let tokens = lexer.tokenize();
        let parser = new CVUParser(tokens, "",
            "", "");
        let x = parser.parse()
        return x
    }

    toCVUString(list) {
       /* list.map(function (x) {
            x => toCVUString(0, "    ")
        }).join("\n\n");*/
       return new CVUSerializer().valueToString(list[0], 0, "    ");
       //return new CVUParsedDefinition(undefined, undefined, "user", list).toCVUString(0, "    ");
    }

    parseToCVUString(snippet) {
        return this.toCVUString(this.parse(snippet))
    }

    testColorDefinition() {
        let snippet = `
              Person {
            sequence: labels 5 "other" test
        }
        `;
        let wow = this.parseToCVUString(snippet);
         console.log(wow);
    }

}
let cl = new CVUParserTests();
cl.testColorDefinition();