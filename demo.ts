"use strict";

import ace from "ace-builds";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-language_tools";
import {Mode} from "./playground/cvu-mode";


let example = require("text-loader!./playground/example.view")

let DemoWorker = require("worker-loader!./demo-worker")

let demoWorker = new DemoWorker();

var mode = "ast";
var refs = {};
var dom = ace.require("ace/lib/dom");
dom.buildDom(["div", {
        style: "position: absolute;top: 0; left: 0; width: 100vw; height: 100vh;"
            + "display: flex; flex-direction: column;"
    },
    ["div", {ref: "toolbar", style: "display: flex;"},
        ["span", {style: "flex:1"}],
        ["button", {onclick: ()=> {mode = "ast"; update()}}, "ast"],
        ["button", {onclick: ()=> {mode = "cvu"; update()}}, "cvu"],
    ],
    ["div", {style: "display: flex; flex: 1"},
        ["div", {ref: "editor", style: "flex: 1"}],
        ["div", {ref: "output", style: "flex: 1"}],
    ]
], document.body, refs);

let value = window.localStorage.lastValue || example;
window.onbeforeunload = function() {
    window.localStorage.lastValue = editor.getValue()
    window.localStorage.mode = mode;
}
let editor = ace.edit(refs.editor, {
    value,
    mode: new Mode(),
    newLineMode: "unix",
    enableLiveAutocompletion: true,
    enableBasicAutocompletion: true,
});

editor.completers = [{
    getCompletions(editor, session, pos, prefix, callback) {
        session.$worker.call("complete", [pos], function() {
            
        });
    }
}]

let output = ace.edit(refs.output, {
    value: "",
    mode: new Mode(),
}); 



var WorkerClient = ace.require("ace/worker/worker_client").WorkerClient;
function WebpackWorkerClient(worker) {
    this.$sendDeltaQueue = this.$sendDeltaQueue.bind(this);
    this.changeListener = this.changeListener.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.$worker = worker;
    this.callbackId = 1;
    this.callbacks = {};
    this.$worker.onmessage = this.onMessage;
}
WebpackWorkerClient.prototype = WorkerClient.prototype;

var session = editor.session;
session.$worker = new WebpackWorkerClient(demoWorker);
session.$worker.attachToDocument(session.getDocument());

session.$worker.on("errors", function(e) {
    session.setAnnotations(e.data);
});

session.$worker.on("annotate", function(e) {
    session.setAnnotations(e.data);
});

session.$worker.on("terminate", function() {
    session.clearAnnotations();
}); 
var result, ast;
var mode = window.localStorage.mode || "ast"
session.$worker.on("result", function(e) {
    result = e.data;
    if (mode == "cvu") update();
}); 
session.$worker.on("ast", function(e) {
    ast = e.data;
    if (mode == "ast") update();
}); 
function update() {
    if (mode == "cvu") output.session.setValue(result);
    if (mode == "ast") output.session.setValue(ast);
}


