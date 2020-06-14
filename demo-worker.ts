"use strict";


importScripts(require("file-loader?esModule=false!ace-builds/src-noconflict/worker-json.js"));


import {ExprParser} from "./parsers/expression-parser/ExprParser"
import {ExprLexer} from "./parsers/expression-parser/ExprLexer"




var tokens = new ExprLexer("true ? x : false").tokenize()
new ExprParser(tokens).parse()


import {CVUParser} from "./parsers/cvu-parser/CVUParser"
import {CVULexer} from "./parsers/cvu-parser/CVULexer"




var validate = function(input) {
    var lexer = new CVULexer(input)
    var tokens = lexer.tokenize()
    
    let parser = new CVUParser(tokens)
    parser.parse()
    console.log(tokens)
};


ace.define('ace/worker/my-worker',[], function(require, exports, module) {
    "use strict";

    var oop = require("ace/lib/oop");
    var Mirror = require("ace/worker/mirror").Mirror;

    var MyWorker = function(sender) {
        Mirror.call(this, sender);
        this.setTimeout(200);
    };

    oop.inherits(MyWorker, Mirror);

    (function() {
        this.onUpdate = function() {
            var value = this.doc.getValue();
            var annotations = validate(value);
            this.sender.emit("annotate", annotations);
        };
    }).call(MyWorker.prototype);

    exports.MyWorker = MyWorker;
});

window.onmessage({
    data: {
        init : true,
        module: 'ace/worker/my-worker',
        classname : "MyWorker"
    }
});





console.log(CVUParser, CVULexer)