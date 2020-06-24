"use strict";

import ace from "ace-builds";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-language_tools";
import {Mode} from "./playground/cvu-mode";


let example = require("text-loader!./playground/example.view")

let DemoWorker = require("worker-loader!./demo-worker")

let demoWorker = new DemoWorker();



var defaults = {
    lastSaved: window.localStorage.lastValue || example,
    /*require("text-loader!./cvu/defaults/default_user_views.json"),*/
    /*require("text-loader!./cvu/defaults/macro_views.json"),*/
    "All-items-with-label": require("text-loader!./cvu/defaults/named/All-items-with-label.cvu"),
    "Choose-item-by-query": require("text-loader!./cvu/defaults/named/Choose-item-by-query.cvu"),
    "Filter-starred": require("text-loader!./cvu/defaults/named/Filter-starred.cvu"),
    /*require("text-loader!./cvu/defaults/named_sessions.json"),*/
    /*require("text-loader!./cvu/defaults/named_views.json",)*/
    generalEditor: require("text-loader!./cvu/defaults/renderer/generalEditor.cvu"),
    chart: require("text-loader!./cvu/defaults/renderer/chart.cvu"),
    list: require("text-loader!./cvu/defaults/renderer/list.cvu"),
    thumbnail: require("text-loader!./cvu/defaults/renderer/thumbnail.cvu"),
    Sessions: require("text-loader!./cvu/defaults/Session/Sessions.cvu"),
    defaults: require("text-loader!./cvu/defaults/styles/defaults.cvu"),
    /*require("text-loader!./cvu/defaults/template_views.json"),*/
    Address: require("text-loader!./cvu/defaults/type/Address.cvu"),
    Any: require("text-loader!./cvu/defaults/type/Any.cvu"),
    AuditItem: require("text-loader!./cvu/defaults/type/AuditItem.cvu"),
    Country: require("text-loader!./cvu/defaults/type/Country.cvu"),
    Importer: require("text-loader!./cvu/defaults/type/Importer.cvu"),
    ImporterInstance: require("text-loader!./cvu/defaults/type/ImporterInstance.cvu"),
    Indexer: require("text-loader!./cvu/defaults/type/Indexer.cvu"),
    IndexerInstance: require("text-loader!./cvu/defaults/type/IndexerInstance.cvu"),
    Label: require("text-loader!./cvu/defaults/type/Label.cvu"),
    Mixed: require("text-loader!./cvu/defaults/type/Mixed.cvu"),
    Note: require("text-loader!./cvu/defaults/type/Note.cvu"),
    /*require("text-loader!./cvu/defaults/type/Person-markup.ml"),*/
    Person: require("text-loader!./cvu/defaults/type/Person.cvu"),
    Photo: require("text-loader!./cvu/defaults/type/Photo.cvu"),
    Session: require("text-loader!./cvu/defaults/type/Session.cvu"),
    /*require("text-loader!./cvu/defaults/type/Session.json"),*/
    SessionView: require("text-loader!./cvu/defaults/type/SessionView.cvu"),
    UserNote: require("text-loader!./cvu/defaults/user/UserNote.cvu-disabled"),
    /*require("text-loader!./cvu/defaults/views_from_server.json"),*/
};

var mode = "ast";
var refs = {};
var dom = ace.require("ace/lib/dom");
dom.buildDom(["div", {
        style: "position: absolute;top: 0; left: 0; width: 100vw; height: 100vh;"
            + "display: flex; flex-direction: column;"
    },
    ["div", {ref: "toolbar", style: "display: flex;"},
        ["select", {
            ref: "session", onchange: changeSession, value: localStorage.session || "lastSaved"
        }, 
        Object.keys(defaults).map(key => {
            return ["option", {value: key}, key];
        })],
        ["span", {style: "flex:1"}],
        ["button", {onclick: ()=> {mode = "ast"; update()}}, "ast"],
        ["button", {onclick: ()=> {mode = "cvu"; update()}}, "cvu"],
        ["button", {onclick: ()=> {mode = "tokens"; update()}}, "tokens"],
    ],
    ["div", {style: "display: flex; flex: 1"},
        ["div", {ref: "editor", style: "flex: 1"}],
        ["div", {ref: "output", style: "flex: 1"}],
    ],
], document.body, refs);

window.onbeforeunload = function() {
    if (typeof defaults.lastSaved != "string")
        window.localStorage.lastValue = defaults.lastSaved.getValue();
    window.localStorage.mode = mode;
    window.localStorage.session = refs.session.value;
}

let editor = ace.edit(refs.editor, {
    newLineMode: "unix",
    enableLiveAutocompletion: true,
    enableBasicAutocompletion: true,
});

editor.completers = [{
    getCompletions(editor, session, pos, prefix, callback) {
        session.$worker.call("complete", [pos], function(result) {
            callback(null, result);
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

var sharedWorker =  new WebpackWorkerClient(demoWorker);

sharedWorker.on("annotate", function(e) {
    editor.session.setAnnotations(e.data);
    update();
});

var result, ast;
var mode = window.localStorage.mode || "ast"

function update() {
    sharedWorker.call("getData", [mode], function(data) {
        output.session.setValue(data);
    });
}

var cvumode = new Mode()
function changeSession(e) {
    var target = refs.session.value;
    if (typeof defaults[target] == "string" || !defaults[target]) {
        defaults[target] = ace.createEditSession(defaults[target] || "", cvumode);
    }
    editor.setSession(defaults[target]);
    
    if (sharedWorker.$doc)
        sharedWorker.$doc.off("change", sharedWorker.changeListener);
    sharedWorker.deltaQueue = sharedWorker.$doc = null;
    sharedWorker.attachToDocument(editor.session.getDocument());
    editor.session.$worker = sharedWorker;
}
changeSession()

