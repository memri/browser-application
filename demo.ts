"use strict";

import ace from "ace-builds";
import "ace-builds/src-noconflict/ext-searchbox";
import {Mode} from "./playground/cvu-mode";


let example = require("text-loader!./playground/example.view")

let DemoWorker = require("worker-loader!./demo-worker")

let demoWorker = new DemoWorker();

let value = window.localStorage.lastValue || example;
window.onbeforeunload = function() {
    window.localStorage.lastValue = editor.getValue()
}
let editor = ace.edit(null, {
    value,
    mode: new Mode(),
    newLineMode: "unix",
});

let output = ace.edit(null, {
    value: "",
    mode: new Mode(),
});

editor.container.style.cssText = "top:0; left: 0%; height: 100vh; right: 50vw"
editor.container.style.position = "absolute"
output.container.style.cssText = "top:0; left: 50vw; height: 100vh; right: 0vw"
output.container.style.position = "absolute"
document.body.appendChild(editor.container)
document.body.appendChild(output.container)



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

session.$worker.on("result", function(e) {
    output.session.setValue(e.data);
}); 

