import {CVU} from "../../memri/cvu/parsers/cvu-parser/CVU";
import {CVUValidator} from "../../memri/cvu/parsers/cvu-parser/CVUValidator";

var fs = require("fs");
import {CVUParser} from "../../memri/cvu/parsers/cvu-parser/CVUParser";
import {CVULexer} from "../../memri/cvu/parsers/cvu-parser/CVULexer";

const assert = require("assert");

var testCases = fs.readFileSync("tests/parsers/CVUValidatorTests.json", "utf8");
const CVUValidatorTests = JSON.parse(testCases);

function parse(snippet) {
    let lexer = new CVULexer(snippet);
    let tokens = lexer.tokenize();
    let parser = new CVUParser(tokens, "",
        undefined, undefined);
    let x = parser.parse();
    return x
}

describe("CVUValidator", function() {
    Object.keys(CVUValidatorTests).forEach(function(key) {
        it (key, function() {
            var test = CVUValidatorTests[key];
            try {
                let validator = new CVUValidator()
                let result = validator.validate(parse(test.snippet));
                if (test.errors || test.warnings) {
                    assert.equal(validator.errors.length, test.errors);
                    assert.equal(validator.warnings.length, test.warnings);
                } else {
                    assert.equal(result, true);
                }

            } catch(e) {
                //console.error(e)
                if (!test.error) {
                    throw e;
                }
            }
        });
    });

    it("testLargeCVU", function () {
        let fileURL = "tests/parsers/example/example.view";
        let code = fs.readFileSync(fileURL, "utf8");

        let viewDef = new CVU(code, "" , undefined, undefined);

        let parsed = viewDef.parse();

        let validator = new CVUValidator();
        validator.validate(parsed);

        assert.equal(validator.errors.length, 5);
        assert.equal(validator.warnings.length, 1);
    });
})