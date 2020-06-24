var tree = require('./treehugger/tree');
var traverse = require("./treehugger/traverse");

import {ActionFamily, UIElementFamily} from "../cvu-parser/CVUParser";
import {CVULexer} from "../cvu-parser/CVULexer";
import {Expression} from "../expression-parser/Expression";
import {CVUToken, CVUOperator} from "../cvu-parser/CVULexer";
import {CVUParseErrors} from "../cvu-parser/CVUParseErrors";


exports.parseCVU = function(text) {
    var tokens = new CVULexer(text, true).tokenize();
    var ast = new CVUParser(tokens).parse()
    return ast
};





export class CVUParser {
    index = 0;
    lastToken;

    constructor(tokens, context, lookup, execFunc) {
        this.context = context;
        this.tokens = tokens;
        this.lookup = lookup;
        this.execFunc = execFunc;
    }

    peekCurrentToken() {
        return this.index >= this.tokens.length
            ? new CVUToken.EOF()
            : this.tokens[this.index]
    }

    popCurrentToken() {
        if (this.index >= this.tokens.length) {
            this.lastToken = new CVUToken.EOF;
            return this.lastToken
        }

        this.lastToken = this.tokens[this.index];
        ++this.index;
        return this.lastToken;
    }

    list(values = []) {
        var node = tree.list(values);
        var lastToken = this.tokens[this.index];
        node.$pos = {start: {}, end: {}};
        node.$pos.start.line = lastToken.row;
        node.$pos.start.column = lastToken.col;
        this.close(node)
        return node;
    }
    cons(name, values = []) {
        var node = tree.cons(name, values)
        var lastToken = this.tokens[this.index]
        node.$pos = {start: {}, end: {}};
        node.$pos.start.line = lastToken.row;
        node.$pos.start.column = lastToken.col;
        this.close(node)
        return node;
    }
    close(node) {
        var lastToken = this.tokens[this.index]
        node.$pos.end.line = lastToken.row;
        node.$pos.end.column = lastToken.col + (lastToken.value && lastToken.value.length|| 0);
    }
    
    parse() {
        this.index = 0;
        
        return this.parseObject(true);
    }
    
    parseObject(isRoot) {
        let token = this.peekCurrentToken();
        let node = isRoot ? this.list() : this.cons("Dict");
        if (token.type == "CurlyBracketOpen")
            this.popCurrentToken();
        while (true) {
            let token = this.peekCurrentToken();
            if (CVUToken.EOF == token.constructor) {
                break
            }
            
            if (!isRoot && CVUToken.CurlyBracketClose == token.constructor) {
                this.popCurrentToken();
                break;
            }
            if (CVUToken.Newline == token.constructor) {
                this.popCurrentToken();
                continue
            }

            var rule = this.parseRule();
            if (token.type == "Comma")
                this.popCurrentToken();
            node.push(rule);
        }
        this.close(node);
        return node;
    }

    parseRule() {
        var token = this.peekCurrentToken();
        
        // Rule(Selector(), Dict()|List()|value)
        var node = this.cons("Rule");
        var selector = this.parseSelector();
        
        var token = this.peekCurrentToken();
        var hasColon = false
        if (token.type == "Colon") {
            hasColon = true;
            this.popCurrentToken();
        }
        var value = this.parseValue(hasColon);
        var token = this.peekCurrentToken();
        node.push(selector);
        node.push(value);
        this.close(node);
        return node;
    }
    parseSelector() {
        var token = this.peekCurrentToken();
        var node = this.cons("Selector");
        if (token.type == "Identifier" 
            || token.type == "String"
            || token.type == "StringExpression"
            || token.type == "Number"
            || token.type == "NamedIdentifier"
        ) {
            node.push(id(token));
            this.popCurrentToken();
            token = this.peekCurrentToken();
        }
        if (token.type == "BracketOpen") {
            node.push(this.parseSelectorProps())
        }
        if (!node.length) {
            node.push(this.cons("error", []));
            this.popCurrentToken();
        }
        this.close(node);
        return node;
    }
    
    parseSelectorProps() {
        var node = this.cons("Prop", [])
        this.popCurrentToken();
        while (true) {
            var token = this.peekCurrentToken();
            
            if (token.type == "BracketClose") {
                this.popCurrentToken();
                break
            }
            if (token.type == "Newline") {
                break
            }
            if (token.type == "CurlyBracketOpen" || token.type == "CurlyBracketClose") {
                break
            }
            node.push(id(token));
            this.popCurrentToken();
        }
        this.close(node);
        return node;
    }
    
    
    parseValue(hasColon) {
        var token = this.peekCurrentToken();
        if (hasColon && token.type == "Newline") {
            while (token.type == "Newline") {
                token = this.popCurrentToken()
            }
        }
        var node;
        if (token.type == "Comma") return this.cons("error", []);
        node = this.parseUnbracketedArray()
        
        if (hasColon) {
            if (token.type != "Newline" && token.type != "Comma") {
                
            }
        }
        
        if (!node) {
            node = this.cons("error", []);
            this.popCurrentToken();
        }
        return node;
    }
    
    parseArray() {
        let token = this.peekCurrentToken();
        let node = this.cons("List");
        if (token.type == "BracketOpen")
            this.popCurrentToken();
        while (true) {
            let token = this.peekCurrentToken();
            if (CVUToken.EOF == token.constructor) {
                break
            }
            
            if (token.constructor == CVUToken.BracketClose) {
                this.popCurrentToken();
                break;
            }
            if (CVUToken.Newline == token.constructor) {
                this.popCurrentToken();
                continue
            }

            var value = this.parseSimpleValue();
            if (token.type == "Comma")
                this.popCurrentToken();
            node.push(value);
        }
        this.close(node);
        return node;
    }
    
    parseUnbracketedArray() {
        var root = this.cons("List")
        while (true) {
            var node = this.parseSimpleValue();
            if (!node) break
            root.push(node);
        }
        if (root.length == 1) {
            return root[0]
        }
        this.close(root);
        return root;
    }
    parseSimpleValue() {
        var token = this.peekCurrentToken();
        if (token.type == "Number" || 
            token.type == "Expression" || 
            token.type == "Bool" || 
            token.type == "Nil" || 
            token.type == "Identifier" || 
            token.type == "NamedIdentifier" || 
            token.type == "StringExpression" ||
            token.type == "String"
        ) {
            var node = this.cons(token.type, [id(token)])
            this.popCurrentToken();
            this.close(node);
            return node;
        }
        if (token.type == "CurlyBracketOpen") {
            var objectNode = this.parseObject()
            return objectNode;
        }
        if (token.type == "BracketOpen") {
            var listNode = this.parseArray()
            return listNode;
        }
    }
    
 

}



function id(token) {
    let value = token.value;
    if (value != null) {
        let s = tree.string(value);
        s.$pos = {
            start: {line: token.row, column: token.col},
            end: {line: token.row, column: token.col + value.length}
        };
        return s;
    } else {
        let s = tree.string(token.type);
        s.$pos = {
            start: {line: token.row, column: token.col},
            end: {line: token.row, column: token.col + 1}
        };
        return s;
    }
}

var schema = {
    
    
}

var actions = "back, addDataItem, openView, openDynamicView, openViewByName, toggleEditMode, toggleFilterPanel, star, showStarred, showContextPane, showOverlay, share, showNavigation, addToPanel, duplicate, schedule, addToList, duplicateNote, noteTimeline, starredNotes, allNotes, exampleUnpack, delete, setRenderer, select, selectAll, unselectAll, showAddLabel, openLabelView, showSessionSwitcher, forward, forwardToFront, backAsSession, openSession, openSessionByName, link, closePopup, unlink, multiAction, noop".split(/,\s*/);

var elements = "VStack, HStack, ZStack, EditorSection, EditorRow, EditorLabel, Title, Button, FlowStack, Text, Textfield, ItemCell, SubView, Map, Picker, SecureField, Action, MemriButton, Image, Circle, HorizontalLine, Rectangle, RoundedRectangle, Spacer, Divider, Empty".split(/,\s*/);






