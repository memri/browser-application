import {CVU} from "./CVU";
import {CVUValidator} from "./CVUValidator";

var fs = require("fs");
import {CVUParser} from "./CVUParser";
import {CVULexer} from "./CVULexer";

const assert = require("assert");

var testCases = fs.readFileSync("tests/CVUValidatorTests.json", "utf8");
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

    it("testSerialization", function () {
        let fileURL = "playground/example.view";
        let code = fs.readFileSync(fileURL, "utf8");

        let viewDef = new CVU(code, "" , undefined, undefined);

        let parsed = viewDef.parse();

        let validator = new CVUValidator();
        validator.validate(parsed);

        assert.equal(validator.errors.length, 0);
        assert.equal(validator.warnings.length, 1);
    });
})