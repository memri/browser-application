var fs = require("fs");
import {CVU} from "../../memri/cvu/parsers/cvu-parser/CVU";
import {CVUParser} from "../../memri/cvu/parsers/cvu-parser/CVUParser";
import {CVULexer} from "../../memri/cvu/parsers/cvu-parser/CVULexer";

const assert = require("assert");

var testCases = fs.readFileSync("tests/parsers/CVUParserTests.json", "utf8");
const CVUParserTests = JSON.parse(testCases);

function toCVUString(list) {
    return list.map(x => x.toCVUString(0, "    ")).join("\n\n").replace(/\n\s+\n"/, "\n\n")
}

function parse(snippet) {
    let lexer = new CVULexer(snippet);
    let tokens = lexer.tokenize();
    let parser = new CVUParser(tokens, "",
        undefined, undefined);
    let x = parser.parse();
    return x
}

describe("CVUParser", function() {
    Object.keys(CVUParserTests).forEach(function(key) {
        it (key, function() {
            var test = CVUParserTests[key];
            try {
                let result = toCVUString(parse(test.snippet))
                if (!test.result && test.error) {
                    console.error(key, "expected to throw ", test.error, "but returned ", result);
                    throw new Error(key + " expected to throw error");
                }
                assert.equal(result, test.result ? test.result: test.snippet);
            } catch(e) {
                //console.error(e)
                if (!test.error) {
                    throw e;
                }
                assert.equal(e.toErrorString(), test.error);
            }
        });
    });

    it("testSerialization", function () {
        let fileURL = "tests/parsers/example/example.view";
        let code = fs.readFileSync(fileURL, "utf8");

        let viewDef = new CVU(code, "" , undefined, undefined);

        let codeClone = toCVUString(viewDef.parse());
        //        print(codeClone) // .prefix(1500))

        let viewDefClone = new CVU(codeClone, "", undefined, undefined);

        let codeCloneClone = toCVUString(viewDefClone.parse());
        assert.equal(codeClone, codeCloneClone);
    });
})