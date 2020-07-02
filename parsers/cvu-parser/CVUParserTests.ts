
const {CVUParser} = require("./CVUParser");
const {CVULexer} = require("./CVULexer");

const assert = require("assert");

const CVUParserTests = {

    testColorDefinition: {
        snippet:
`[color = background] {
    dark: #ff0000
    light: #330000
}`,
        result:
`[color = background] {
    dark: #ff0000
    light: #330000
}`,
    },
    testStyleDefinition: {//TODO: there is no sort now
        snippet:
`[style = my-label-text] {
    color: highlight
    border: background 1
}`,
        result:
`[style = my-label-text] {
    border: "background" 1
    color: "highlight"
}`
    },
    testRendererDefinition: {
        snippet:
`[renderer = generalEditor] {
    sequence: labels starred other dates
}`,
        result:
`[renderer = generalEditor] {
    sequence: "labels" "starred" "other" "dates"
}`
    },
    testLanguageDefinition: {
        snippet:
`[language = Dutch] {
    addtolist: "Voeg toe aan lijst..."
    sharewith: "Deel met..."
}`
    },
    testNamedViewDefinition: {
        snippet:
`.defaultButtonsForDataItem {
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
`[color = background] {
    dark: #ff0000
    light: #330000
}

[style = my-label-text] {
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
    testNestedObjects: {
        snippet:
`Person {
    group {
        key: value
    }
}`,
        result:
`Person {
    
    group: {
        key: "value"
    }
}`
    },
    testNestedObjectsUsingColon: {
        snippet:
`Person: {
    group: {
        key: value
    }
}`,
        result:
`Person {
    
    group: {
        key: "value"
    }
}`
    },
    testNestedObjectsWithKeysBefore: {
        snippet:
`Person {
    key: 10
    group {
        key: value
    }
}`,
        result:
`Person {
    key: 10
    
    group: {
        key: "value"
    }
}`
    },
    testEscapedStringProperty: {
        snippet:
`[language = Dutch] {
    sharewith: "Deel \\"met..."
}`,
    },
    testMixedQuoteTypeProperty: {
        snippet:
`[language = Dutch] {
    addtolist: "Voeg 'toe' aan lijst..."
}`,
    },
    testArrayStringProperty: {
        snippet:
`Person {
    sequence: labels starred other dates
}`,
        result:
`Person {
    sequence: "labels" "starred" "other" "dates"
}`
    },
    testArrayMixedProperty: {
        snippet:
`Person {
    sequence: labels 5 "other" test
}`,
        result:
`Person {
    sequence: "labels" 5 "other" "test"
}`
    },
    testArrayMultilineProperty: {
        snippet:
`Person {
    sequence: [
        openViewByName { title: "{$sharewith}" }
        toggleEditMode { title: "{$addtolist}" }
        duplicate { title: "{$duplicate} {type}" }
    ]

    key: value
}`,
        result:
`Person {
    key: "value"
    sequence: [
        openViewByName {
            title: "{$sharewith}"
        }
        toggleEditMode {
            title: "{$addtolist}"
        }
        duplicate {
            title: "{$duplicate} {type}"
        }
    ]
}`
    },
    testNestedRendererDefinition: {
        snippet:
`Person {
    [renderer = timeline] {
        timeProperty: dateCreated
    }
}`,
        result:
`Person {
    [renderer = timeline] {
        timeProperty: "dateCreated"
    }
}`
    },
    testNestedRendererDefinitionAfterProperty: {
        snippet:
`Person {
    key: 10
    [renderer = timeline] {
        timeProperty: dateCreated
    }
}`,
        result:
`Person {
    key: 10

    [renderer = timeline] {
        timeProperty: "dateCreated"
    }
}`
    },
    testStringExpressionProperty: {
        snippet:
`Person {
    title: "{.firstName}"
}`
    },
    testExpressionProperty: {
        snippet:
`Person {
    title: {{.firstName}}
}`
    },
    testStringProperty: {
        snippet:
`Person { title: "hello" }`,
        result:
`Person {
    title: "hello"
}`
    },
    testMultilineStringProperty: {
        snippet:
`Person { title: "hello
                 world!" }`,
        result:
`Person {
    title: "hello
                 world!"
}`
    },
    testNumberProperty: {
        snippet:
`Person { title: -5.34 }`,
        result:
`Person {
    title: -5.34
}`
    },
    testBoolProperty: {
        snippet: 'Person { title: true }',
        result:
`Person {
    title: true
}`
    },
    testNilProperty: {
        snippet: 'Person { title: nil }',
        result:
`Person {
    title: null
}`
    },
    testIdentifierProperty: {
        snippet: 'Person { defaultRenderer: thumbnail.grid }',
        result:
`Person {
    defaultRenderer: "thumbnail.grid"
}`
    },
    testColorProperty: { //TODO: color class
        snippet: 'Person { color: #f0f }',
        result:
`Person {
    color: #ff00ff
}`
    },
    testJSONCompatibility: {//TODO: sort
        snippet:
`"Person": {
    "string": "test",
    "array": ["10", 5],
    "object": { "test": 10 },
    "bool": false,
    "number": 10,
}`,
        result:
`Person {
    array: "10" 5
    bool: false
    number: 10
    string: "test"
    
    object: {
        test: 10
    }
}`
    },
    testSingleLineJSONSyntax: {//TODO: sort
        snippet: '"Person": { "string": "test", "array": ["10", 5], "object": { "test": 10 }, "bool": false, "number": 10, }',
        result:
`Person {
    array: "10" 5
    bool: false
    number: 10
    string: "test"
    
    object: {
        test: 10
    }
}`
    },
    testCSSLikeSyntax: { //TODO: color class
        snippet:
`Person {
    background: #fff;
    border: 1 red;
    padding: 1 2 3 4;
}`,
        result:
`Person {
    background: #ffffff
    border: 1 "red"
    padding: 1 2 3 4
}`
    },
    testSingleLineCSSLikeSyntax: { //TODO: color class
        snippet: 'Person { background: #fff; border: 1 red; padding: 1 2 3 4; }',
        result:
`Person {
    background: #ffffff
    border: 1 "red"
    padding: 1 2 3 4
}`
    },
    testSingleLineSyntax: { //TODO: color class
        snippet: 'Person { background: #fff, border: 1 red, padding: 1 2 3 4, object: { test: 1 } }',
        result:
`Person {
    background: #ffffff
    border: 1 "red"
    padding: 1 2 3 4
    
    object: {
        test: 1
    }
}`
    },
    testCurlyBracketsOnSeparateLine: { //TODO: color class
        snippet:
`Person
{
    background: #fff
    object:
        { test: 1 }
    bla:
    {
        test: 1
    }
}`,
        result:
`Person {
    background: #ffffff
    
    bla: {
        test: 1
    }
    
    object: {
        test: 1
    }
}`
    },
    testComments: {
        snippet:
`/* Hello */
Person {
    /* World */
    key: value
}`,
        result:
`Person {
    key: "value"
}`
    },
    testUIElementProperties: {//TODO: UIElements class
        snippet:
`Person {
    VStack {
        alignment: left
        font: 14
        
        Text {
            align: top
            textalign: center
            font: 12 light
        }
        Text {
            maxHeight: 500
            cornerRadius: 10
            border: #ff0000 1
            cornerRadius: 10
        }
    }
}`},
    testUserState: {//TODO: different check (instanceof?)
            snippet:
`Person {
    userState: {
        showStarred: true
    }
}`
    },
    testViewArguments: {//TODO: different check (instanceof?)
        snippet:
`Person {
    viewArguments: {
        readOnly: true
    }
}`
    },
    testUIElementWithoutProperties: {
        snippet:
`Person {
    VStack {
        alignment: left
        Text { font: 12 light }
        Spacer
        Text { maxheight: 500 }
    }
}`,
        result:
`Person {
    VStack {
        alignment: left

        Text {
            font: 12 light
        }

        Spacer


        Text {
            maxheight: 500
        }
    }
}`
    },
    testSerialization: {
        //TODO:
    },
    testNestedViews: {
        snippet:
`Person {
    [renderer = generalEditor] {

        picturesOfPerson: {
            sectionTitle: "Photos of {.computedTitle()}"
            foreach: false

            SubView {
                view: {
                    defaultRenderer: "thumbnail.grid"

                        [datasource = pod] {
                        query: "Photo AND ANY includes.memriID = '{.memriID}'"
                    }

                    [renderer = thumbnail.grid] {
                        columns: 5
                        itemInset: 0
                    }
                }
            }
        }
    }
}`
    },
    testActionStar: {
        snippet:
`Person {
    [renderer = list] {
        Action {
            press: star
        }
    }
}`
    },
    testActionAddItem: {
        snippet:
`Person {
    [renderer = list] {
        press: addItem {
            arguments: {
                template: {
                    type: "ImporterInstance"
                    name: {{.name}}
                }
            }
        }
    }
}`
    },
    testMultipleActions: {
        snippet:
`Person {
    [renderer = list] {
        press: [
            link {
                arguments: {
                    property: {{property}}
                    dataItem: {{dataItem}}
                }
            }
            closePopup
        ]
    }
}`},
    testErrorMissingCurlBracketClose: {
        snippet:
`Person {
    test: 1`,
        error: 'UnexpectedToken(EOF,1,12)'
    },
    testErrorMissingBracketCloseInDefinition: {
        snippet:
`[color = "test" {
    test: 1
}`,
        error: `ExpectedCharacter(']')`
    },
    testErrorMissingExprCloseBracket: {
        snippet:
`Person {
    expr: {{.test}
}`,
        error: 'MissingExpressionClose(EOF,1,21)'
    },
    testErrorMissingExprCloseBrackets: {
        snippet:
`Person {
    expr: {{.test
}`,
        error: 'MissingExpressionClose(EOF,1,20)'
    },
    testErrorExtraBracket: {
        snippet:
`Person {
    expr: [adasd, 5[]
}`,
        error: 'ExpectedIdentifier(BracketClose,1,21)'
    },
    testErrorTopLevelBracket: {
        snippet: `[5,3,4,]`,
        error: 'ExpectedIdentifier(Number,5,2)'//TODO: maybe wrong
    },
    testErrorExtraCurlyBracket: {
        snippet:
`Person {
    expr: [adasd, 5{]
}`,
        error: 'UnexpectedToken(BracketClose,1,21)'
    },
    testErrorExtraColonInArray: {
        snippet:
`Person {
    expr: ["asdads": asdasd]
}`,
        error: 'ExpectedKey(Colon,1,20)'
    },
    testErrorExtraColonInProperty: {
        snippet:
`Person {
    expr: asdads: asdasd
}`,
        error: 'ExpectedKey(Colon,1,17)'
    },
    testErrorMissingQuoteClose: {
        snippet:
`Person {
    string: "value
}`,
        error: 'MissingQuoteClose(EOF,1,21)'
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
    })
})