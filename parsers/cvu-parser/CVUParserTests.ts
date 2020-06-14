//
//  ViewParserTests.swift
//
//  Created by Ruben Daniels on 5/20/20.
//  Copyright © 2020 Memri. All rights reserved.
//

import XCTest
@testable import memri

class CVUParserTests extends XCTestCase {
    function setUpWithError() {
        
    }

    function tearDownWithError() {
    }
    
    function parse(snippet) {
        let lexer = CVULexer(input: snippet)
        let tokens =  lexer.tokenize()
        let parser = CVUParser(tokens, RootMain(name: "", key: "").mockBoot(),
                               lookup: {_,_ in}, execFunc: {_,_,_ in})
        let x =  parser.parse()
        return x
    }
    
    function toCVUString(list) {
        list.map{ $0.toCVUString(0, "    ") }.joined(separator: "\n\n")
    }
    
    function parseToCVUString(snippet) {
        toCVUString(try parse(snippet))
    }
    
    function testColorDefinition() {
        let snippet = `
        [color = background] {
            dark: #ff0000
            light: #330000
        }
        `
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testStyleDefinition() {
        let snippet = `
        [style = my-label-text] {
            color: highlight
            border: background 1
        }
        `
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        [style = my-label-text] {
            border: "background" 1
            color: "highlight"
        }
        """)
    }
    
    function testRendererDefinition() {
        let snippet = """
        [renderer = generalEditor] {
            sequence: labels starred other dates
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        [renderer = generalEditor] {
            sequence: "labels" "starred" "other" "dates"
        }
        """)
    }
    
    function testLanguageDefinition() {
        let snippet = """
        [language = Dutch] {
            addtolist: "Voeg toe aan lijst..."
            sharewith: "Deel met..."
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testNamedViewDefinition() {
        let snippet = """
        .defaultButtonsForDataItem {
            editActionButton: toggleEditMode
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testTypeViewDefinition() {
        let snippet = """
        Person {
            title: "{.firstName}"
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testListViewDefinition() {
        let snippet = """
        Person[] {
            title: "All People"
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testMultipleDefinitions() {
        let snippet = """
        [color = background] {
            dark: #ff0000
            light: #330000
        }

        [style = my-label-text] {
            border: background 1
            color: highlight
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        [color = background] {
            dark: #ff0000
            light: #330000
        }

        [style = my-label-text] {
            border: "background" 1
            color: "highlight"
        }
        """)
    }
    
    // TODO
//    function testTypeQueryViewDefinition() {
//        let snippet = """
//        Person[ANY address.country = "USA"] {
//            title: "All People"
//        }
//        """
//
//        XCTAssertEqual(try parseToCVUString(snippet), snippet)
//        print(results.description)
//
//
//    }
    
    function testNestedObjects() {
        let snippet = """
        Person {
            group {
                key: value
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            
            group: {
                key: "value"
            }
        }
        """)
    }
    
    function testNestedObjectsUsingColon() {
        let snippet = """
        Person: {
            group: {
                key: value
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            
            group: {
                key: "value"
            }
        }
        """)
    }
    
    function testNestedObjectsWithKeysBefore() {
        let snippet = """
        Person {
            key: 10
            group {
                key: value
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            key: 10
            
            group: {
                key: "value"
            }
        }
        """)
    }
    
    function testEscapedStringProperty() {
        let snippet = """
        [language = Dutch] {
            sharewith: "Deel \\"met..."
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testMixedQuoteTypeProperty() {
        let snippet = """
        [language = Dutch] {
            addtolist: "Voeg 'toe' aan lijst..."
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testArrayStringProperty() {
        let snippet = """
        Person {
            sequence: labels starred other dates
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            sequence: "labels" "starred" "other" "dates"
        }
        """)
    }
    
    function testArrayMixedProperty() {
        let snippet = """
        Person {
            sequence: labels 5 "other" test
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            sequence: "labels" 5 "other" "test"
        }
        """)
    }
    
    function testArrayMultilineProperty() {
        let snippet = """
        Person {
            sequence: [
                showOverlay { title: "{$sharewith}" }
                addToPanel { title: "{$addtolist}" }
                duplicate { title: "{$duplicate} {type}" }
            ]

            key: value
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            key: "value"
            sequence: [
                showOverlay {
                    title: "{$sharewith}"
                }
                addToPanel {
                    title: "{$addtolist}"
                }
                duplicate {
                    title: "{$duplicate} {type}"
                }
            ]
        }
        """)
    }
    
    function testNestedRendererDefinition() {
        let snippet = """
        Person {
            [renderer = timeline] {
                timeProperty: dateCreated
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            [renderer = timeline] {
                timeProperty: "dateCreated"
            }
        }
        """)
    }
    
    function testNestedRendererDefinitionAfterProperty() {
        let snippet = """
        Person {
            key: 10
            [renderer = timeline] {
                timeProperty: dateCreated
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            key: 10

            [renderer = timeline] {
                timeProperty: "dateCreated"
            }
        }
        """)
    }
    
    function testStringExpressionProperty() {
        let snippet = """
        Person {
            title: "{.firstName}"
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testExpressionProperty() {
        let snippet = """
        Person {
            title: {{.firstName}}
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), snippet)
    }
    
    function testStringProperty() {
        let snippet = """
        Person { title: "hello" }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            title: "hello"
        }
        """)
    }
    
    function testMultilineStringProperty() {
        let snippet = """
        Person { title: "hello
                         world!" }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            title: "hello
                         world!"
        }
        """)
    }
    
    function testNumberProperty() {
        let snippet = """
        Person { title: -5.34 }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            title: -5.34
        }
        """)
    }
    
    function testBoolProperty() {
        let snippet = """
        Person { title: true }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            title: true
        }
        """)
    }
    
    function testNilProperty() {
        let snippet = """
        Person { title: nil }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            title: null
        }
        """)
    }
    
    function testIdentifierProperty() {
        let snippet = """
        Person { defaultRenderer: thumbnail.grid }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            defaultRenderer: "thumbnail.grid"
        }
        """)
    }
    
    function testColorProperty() {
        let snippet = """
        Person { color: #f0f }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            color: #ff00ff
        }
        """)
    }
    
    function testJSONCompatibility() {
        let snippet = """
        "Person": {
            "string": "test",
            "array": ["10", 5],
            "object": { "test": 10 },
            "bool": false,
            "number": 10,
        }
        """
        // Notice the trailing comma, its there on purpose
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            array: "10" 5
            bool: false
            number: 10
            string: "test"
            
            object: {
                test: 10
            }
        }
        """)
    }
    
    function testSingleLineJSONSyntax() {
        let snippet = """
        "Person": { "string": "test", "array": ["10", 5], "object": { "test": 10 }, "bool": false, "number": 10, }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            array: "10" 5
            bool: false
            number: 10
            string: "test"
            
            object: {
                test: 10
            }
        }
        """)
    }
    
    function testCSSLikeSyntax() {
        let snippet = """
        Person {
            background: #fff;
            border: 1 red;
            padding: 1 2 3 4;
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            background: #ffffff
            border: 1 "red"
            padding: 1 2 3 4
        }
        """)
    }
    
    function testSingleLineCSSLikeSyntax() {
        let snippet = """
        Person { background: #fff; border: 1 red; padding: 1 2 3 4; }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            background: #ffffff
            border: 1 "red"
            padding: 1 2 3 4
        }
        """)
    }
    
    function testSingleLineSyntax() {
        let snippet = """
        Person { background: #fff, border: 1 red, padding: 1 2 3 4, object: { test: 1 } }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            background: #ffffff
            border: 1 "red"
            padding: 1 2 3 4
            
            object: {
                test: 1
            }
        }
        """)
    }
    
    function testCurlyBracketsOnSeparateLine() {
        let snippet = """
        Person
        {
            background: #fff
            object:
                { test: 1 }
            bla:
            {
                test: 1
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            background: #ffffff
            
            bla: {
                test: 1
            }
            
            object: {
                test: 1
            }
        }
        """)
    }
    
    function testComments() {
        let snippet = """
        /* Hello */
        Person {
            /* World */
            key: value
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            key: "value"
        }
        """)
    }
    
    function testUIElementProperties() {
        let snippet = """
        Person {
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
                }
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            VStack {
                font: 14
                alignment: left

                Text {
                    textalign: center
                    align: top
                    font: 12 light
                }

                Text {
                    maxHeight: 500
                    cornerRadius: 10
                    border: #ff0000 1
                }
            }
        }
        """)
    }
    
    function testUIElementWithoutProperties() {
        let snippet = """
        Person {
            VStack {
                alignment: left
                Text { font: 12 light }
                Spacer
                Text { maxheight: 500 }
            }
        }
        """
        
        XCTAssertEqual(try parseToCVUString(snippet), """
        Person {
            VStack {
                alignment: left

                Text {
                    font: 12 light
                }

                Spacer


                Text {
                    maxHeight: 500
                }
            }
        }
        """)
    }
    
    
    function testSerialization() {
        let fileURL = Bundle.main.url(forResource: "example", withExtension: "view")
        let code =  String(contentsOf: fileURL!, encoding: String.Encoding.utf8)

        let viewDef = CVU(code, RootMain(name: "", key: "").mockBoot(),
            lookup: { lookup, viewArgs in return 10 },
            execFunc: { lookup, args, viewArgs in return 20 })
        
        let codeClone = toCVUString(try viewDef.parse())
//        print(codeClone) // .prefix(1500))

        let viewDefClone = CVU(codeClone, RootMain(name: "", key: "").mockBoot(),
            lookup: { lookup, viewArgs in return 10 },
            execFunc: { lookup, args, viewArgs in return 20 })

        let codeCloneClone = toCVUString(try viewDefClone.parse())

        XCTAssertEqual(codeClone, codeCloneClone)
    }
    
    function testErrorMissingCurlBracketClose() {
        let snippet = """
        Person {
            test: 1
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.UnexpectedToken(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.EOF)")
            return
        }
        
        XCTFail()
    }
    
    function testErrorMissingBracketCloseInDefinition() {
        let snippet = """
        [color = "test" {
            test: 1
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.ExpectedCharacter(chr, token) {
            XCTAssertEqual(chr, "]")
            XCTAssertEqual("\(token)", "\(CVUToken.CurlyBracketOpen(0, 16))")
            return
        }
        
        XCTFail()
    }
    
//    function testErrorMissingBracketCloseInArray() {
//        let snippet = """
//        Person {
//            array: [1, 2
//        }
//        """
//
//        do {
//            _ =  parse(snippet)
//        }
//        catch let ViewParseErrors.UnexpectedToken(token) {
//            XCTAssertEqual("\(token)", "\(ViewToken.CurlyBracketOpen(6, 1))")
//            return
//        }
//
//        XCTFail()
//    }
    
    function testErrorMissingExprCloseBracket() {
        let snippet = """
        Person {
            expr: {{.test}
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.MissingExpressionClose(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.EOF)")
            return
        }
        
        XCTFail()
    }
    
    function testErrorMissingExprCloseBrackets() {
        let snippet = """
        Person {
            expr: {{.test
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.MissingExpressionClose(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.EOF)")
            return
        }
        
        XCTFail()
    }
    
    function testErrorExtraBracket() {
        let snippet = """
        Person {
            expr: [adasd, 5[]
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.ExpectedIdentifier(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.BracketClose(1, 21))")
            return
        }
        
        XCTFail()
    }
    
    function testErrorTopLevelBracket() {
        let snippet = """
        [5,3,4,]
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.ExpectedIdentifier(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.Number(5, 0, 2))")
            return
        }
        
        XCTFail()
    }
    
    function testErrorExtraCurlyBracket() {
        let snippet = """
        Person {
            expr: [adasd, 5{]
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.UnexpectedToken(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.BracketClose(1, 21))")
            return
        }
        
        XCTFail()
    }
    
    function testErrorExtraColonInArray() {
        let snippet = """
        Person {
            expr: ["asdads": asdasd]
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.ExpectedKey(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.Colon(1, 20))")
            return
        }
        
        XCTFail()
    }
    
    function testErrorExtraColonInProperty() {
        let snippet = """
        Person {
            expr: asdads: asdasd
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.ExpectedKey(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.Colon(1, 17))")
            return
        }
        
        XCTFail()
    }
    
    function testErrorMissingQuoteClose() {
        let snippet = """
        Person {
            string: "value
        }
        """
        
        do {
            _ =  parse(snippet)
        }
        catch let CVUParseErrors.MissingQuoteClose(token) {
            XCTAssertEqual("\(token)", "\(CVUToken.EOF)")
            return
        }
        
        XCTFail()
    }
    
//    function testErrorMultilineQuote() {
//        let snippet = """
//        Person {
//            string: "value
//                     blah"
//        }
//        """
//
//        do {
//            print(try parse(snippet))
//            _ =  parse(snippet)
//        }
//        catch let ViewParseErrors.UnexpectedToken(token) {
//            XCTAssertEqual("\(token)", "\(ViewToken.CurlyBracketOpen(6, 1))")
//            return
//        }
//
//        XCTFail()
//    }
    
    /*
     FUTURE TESTS:
     This has the wrong line number (off by one):
     Photo {
         name: "all-photos"
         title: "All Photos"
         defaultRenderer: thumbnail
         datasource {
             query: "photo"
             sortProperty: dateModified
             sortAscending: false
         },
         emptyResultText: "There are no photos here yet",
         
         editActionButton: toggleEditMode
         filterButtons: [ showStarred toggleFilterPanel ]
         
         [renderer = thumbnail] {
             itemInset: 1
             edgeInset: 0 0 0 0
             Image, {
                 image: "{.file}" /* ALLOW BOTH STRINGS AND FILES*/
                 resizable: fill
             }
         }
     }
     
     This gives a parse error at the [ on line 3
     .defaultSessions {
         currentSessionIndex: 0
         sessionDefinitions: [
             [session] {
                     currentViewIndex: 4
                     viewDefinitions: [
                         [view] {
                                 
                                 datasource: {
                                     query: "label"
                                 }
                             }
                         [view] {
                                 
                                 datasource: {
                                     query: "person"
                                 }
                             }
                         [view] {
                                 
                                 datasource: {
                                     query: "session"
                                 }
                             }
                         [view] {
                                 
                                 datasource: {
                                     query: "audititem"
                                 }
                             }
                         [view] {
                                 
                                 datasource: {
                                     query: "note"
                                 }
                             }
                     ]
                 }
         ]
     }
     
     */
    
    // Test identifier { when its means as a key:object
    

//    function testPerformanceExample() {
//        // This is an example of a performance test case.
//        measure {
//            // Put the code you want to measure the time of here.
//        }
//    }

}
