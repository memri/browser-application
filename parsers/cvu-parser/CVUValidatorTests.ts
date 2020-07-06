import {CVU} from "./CVU";
import {CVUValidator} from "./CVUValidator";

var fs = require("fs");
const {CVUParser} = require("./CVUParser");
const {CVULexer} = require("./CVULexer");

const assert = require("assert");

const CVUParserTests = {

    testColorDefinition: {
        snippet:
`[color = "background"] {
    dark: #ff0000
    light: #330000
}`,
    },
    testStyleDefinition: {
        snippet:
`[style = my-label-text] {
    color: highlight
    border: background 1
}`,
        result:
`[style = "my-label-text"] {
    color: highlight
    border: background 1
}`
    },
    testRendererDefinition: {
        snippet:
`[renderer = "generalEditor"] {
    sequence: labels starred other dates
}`,
    },
    testLanguageDefinition: {
        snippet:
`[language = "Dutch"] {
    addtolist: "Voeg toe aan lijst..."
    sharewith: "Deel met..."
}`
    },
    testNamedViewDefinition: {
        snippet:
`.defaultButtonsForItem {
    editActionButton: toggleEditMode
}`
    },
    testTypeViewDefinition: {
        snippet:
`Person {
    title: "{.firstName}"
}`
    },
    testListViewDefinition: {
        snippet:
`Person[] {
    title: "All People"
}`
    },
    testMultipleDefinitions: {
        snippet:
`[color = "background"] {
    dark: #ff0000
    light: #330000
}

[style = "my-label-text"] {
    border: background 1
    color: highlight
}`,
        result:
`[color = background] {
    dark: #ff0000
    light: #330000
}

[style = my-label-text] {
    border: "background" 1
    color: "highlight"
}`
    },
    testUIElementProperties: {
        snippet:
`[renderer = "list"] {
    VStack {
        alignment: lkjlkj
        font: 14

        Text {
            align: top
            textAlign: center
            font: 12 light
        }
        Text {
            maxheight: 500
            cornerRadius: 10
            border: #ff0000 1
        }
    }
}`, errors: 1, warnings: 1},
    testActionProperties: {
        snippet:
`Person {
    viewArguments: { readonly: true }

    navigateItems: [
        openView {
            title: 10
            arguments: {
                view: {
                    defaultRenderer: timeline

                    datasource {
                        query: "AuditItem appliesTo:{.id}"
                        sortProperty: dateCreated
                        sortAscending: true
                    }

                    [renderer = "timeline"] {
                        timeProperty: dateCreated
                    }
                }
            }
        }
        openViewByName {
            title: "{$starred} {type.plural()}"
            arguments: {
                name: "filter-starred"
                include: "all-{type}"
            }
        }
        openViewByName {
            title: "{$all} {type.lowercased().plural()}"
            arguments: {
                name: "all-{type}"
            }
        }
    ]
}`,
        errors: 1, warnings: 0
    },
};

function toCVUString(list) {
    return list.map(x => x.toCVUString(0, "    ")).join("\n\n")
}

function parse(snippet) {
    let lexer = new CVULexer(snippet);
    let tokens = lexer.tokenize();
    let parser = new CVUParser(tokens, "",
        undefined, undefined);
    let x = parser.parse();
    return x
}

describe("CVUValidator", function() {
    Object.keys(CVUParserTests).forEach(function(key) {
        it (key, function() {
            var test = CVUParserTests[key];
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