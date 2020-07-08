"use strict";

import ace from "ace-builds";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-error_marker";
import "ace-builds/src-noconflict/ext-options";
import "ace-builds/src-noconflict/ext-prompt";
import {StatusBar} from "ace-builds/src-noconflict/ext-statusbar";
import {Mode} from "./playground/cvu-mode";


let example = require("text-loader!./playground/example.view")

let DemoWorker = require("worker-loader!./demo-worker")

let demoWorker = new DemoWorker();



ace.Editor.prototype.__defineGetter__("$readOnly", function() { return this.session.$readOnly })

var defaults = {
    /*require("text-loader!./cvu/defaults/default_user_views.json"),*/
    /*require("text-loader!./cvu/defaults/macro_views.json"),*/
    "All-items-with-label.cvu": require("text-loader!./cvu/defaults/named/All-items-with-label.cvu"),
    "Choose-item-by-query.cvu": require("text-loader!./cvu/defaults/named/Choose-item-by-query.cvu"),
    "Filter-starred.cvu": require("text-loader!./cvu/defaults/named/Filter-starred.cvu"),
    /*require("text-loader!./cvu/defaults/named_sessions.json"),*/
    /*require("text-loader!./cvu/defaults/named_views.json",)*/
    "generalEditor.cvu": require("text-loader!./cvu/defaults/renderer/generalEditor.cvu"),
    "chart.cvu": require("text-loader!./cvu/defaults/renderer/chart.cvu"),
    "list.cvu": require("text-loader!./cvu/defaults/renderer/list.cvu"),
    "thumbnail.cvu": require("text-loader!./cvu/defaults/renderer/thumbnail.cvu"),
    "map.cvu": require("text-loader!./cvu/defaults/renderer/map.cvu"),
    "Sessions.cvu": require("text-loader!./cvu/defaults/Session/Sessions.cvu"),
    "defaults.cvu": require("text-loader!./cvu/defaults/styles/defaults.cvu"),
    /*require("text-loader!./cvu/defaults/template_views.json"),*/
    "Address.cvu": require("text-loader!./cvu/defaults/type/Address.cvu"),
    "Any.cvu": require("text-loader!./cvu/defaults/type/Any.cvu"),
    "AuditItem.cvu": require("text-loader!./cvu/defaults/type/AuditItem.cvu"),
    "Country.cvu": require("text-loader!./cvu/defaults/type/Country.cvu"),
    "Importer.cvu": require("text-loader!./cvu/defaults/type/Importer.cvu"),
    "ImporterInstance.cvu": require("text-loader!./cvu/defaults/type/ImporterInstance.cvu"),
    "Indexer.cvu": require("text-loader!./cvu/defaults/type/Indexer.cvu"),
    "IndexerInstance.cvu": require("text-loader!./cvu/defaults/type/IndexerInstance.cvu"),
    "Label.cvu": require("text-loader!./cvu/defaults/type/Label.cvu"),
    "Mixed.cvu": require("text-loader!./cvu/defaults/type/Mixed.cvu"),
    "Note.cvu": require("text-loader!./cvu/defaults/type/Note.cvu"),
    /*require("text-loader!./cvu/defaults/type/Person-markup.ml"),*/
    "Person.cvu": require("text-loader!./cvu/defaults/type/Person.cvu"),
    "Photo.cvu": require("text-loader!./cvu/defaults/type/Photo.cvu"),
    "Session.cvu": require("text-loader!./cvu/defaults/type/Session.cvu"),
    /*require("text-loader!./cvu/defaults/type/Session.json"),*/
    "SessionView.cvu": require("text-loader!./cvu/defaults/type/SessionView.cvu"),
    "UserNote.cvu": require("text-loader!./cvu/defaults/user/UserNote.cvu-disabled"),
    /*require("text-loader!./cvu/defaults/views_from_server.json"),*/
};

var mode = "ast";
var refs = {};
var dom = ace.require("ace/lib/dom");


var box = require("./playground/ui-lib/box");
 
 

var cvuCompleters = [{
    getCompletions(editor, session, pos, prefix, callback) {
        session.$worker.call("complete", [pos], function(result) {
            callback(null, result);
        });
    }
}]
 



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
    sharedWorker.session.setAnnotations(e.data); 
});

var result, ast;
var mode = window.localStorage.mode || "ast"

 
var cvumode = new Mode() 


var {HashHandler} = ace.require("ace/keyboard/hash_handler");
var event = ace.require("ace/lib/event");
var keyUtil = ace.require("ace/lib/keys");

var menuKb = new HashHandler([
    {
        bindKey: {win: "Ctrl-O|Ctrl-P", mac: "Cmd-O|Cmd-P"},
        name: "Open File",
        exec: function () {
            promptOpenFile()
        }
    },
    {
        bindKey: {win: "F1|Ctrl-Shift-P", mac: "F1|Cmd-Shift-P"},
        name: "commandPrompt",
        exec: function () {
            saveCurrentFile()
        }
    },
    {
        bindKey: {win: "Ctrl-S", mac: "Cmd-S"},
        name: "Save",
        exec: function () {
            saveCurrentFile()
        }
    }
]);

event.addCommandKeyListener(window, function (e, hashId, keyCode) {
    var keyString = keyUtil.keyCodeToString(keyCode);
    var command = menuKb.findKeyCommand(hashId, keyString);
    if (command) {
        event.stopEvent(e);
        command.exec();
    }
});


var {Box, Pane} = require("./playground/ui-lib/box");
var {ListBox} = require("./playground/ui-lib/listBox");
var {Tab, TabBar, Panel, PanelBar} = require("./playground/ui-lib/tab");
var {TabManager} = require("./playground/ui-lib/tabManager");

var mainBox
var listBox
var baseBox = new Box({
    vertical: false,
    toolBars: {
        top: new PanelBar({}),
        bottom: new PanelBar({})
    },
    1: new Box({
        vertical: false,
        0: new Box({
            vertical: false,
            0: listBox = new ListBox({
                size: "200px",
            }),
            1: mainBox = new Box({
                ratio: 1,
                isMain: true,
            }),
        }),
        toolBars: {},
    }),
});


var onResize = function() {
    baseBox.setBox(0, 0, window.innerWidth, window.innerHeight)
};
window.onresize = onResize;

document.body.innerHTML = ""
document.body.appendChild(baseBox.draw());
onResize()


baseBox.toolBars.top.element.textContent = "";
dom.buildDom([
    ["input", { ref: "podAddress", value: "http://localhost:3030" }],
    ["button", {
        onmousedown: (e)=> {
            e.preventDefault()
        },
        onclick: (e)=> {
            e.preventDefault();
            updateTree();
        }
    }, "Connect To Pod"],
    ["span", {class: "spacer"}],
    ["button", {
        ref: "saveButton",
        onmousedown: (e)=> {
            e.preventDefault()
        },
        onclick: (e)=> {
            e.preventDefault()
        }
    }, "Save"],
], baseBox.toolBars.top.element, refs);


var tabManager = new TabManager({
    main: mainBox, 
});
window.tabManager = tabManager;


var newTabCounter = 1
tabManager.addNewTab = function(pane) {
    pane.tabBar.addTab({
        tabTitle: `Untitled ${newTabCounter++}.cvu`,
        active: true,
    })
};
tabManager.loadFile = function(tab) {
    if (!tab.editor) return;
    
    if (tab.session) {
        return setSession(tab, tab.session)
    } else if (!tab.path) {
        return setSession(tab, "")
    } else if (defaults[tab.path]) {
        return setSession(tab, defaults[tab.path], true)
    } else if (tab.path) {
        tab.editor.container.style.display = "none";
        loadCVUDefinition(tab.path, function(err, value) {
            setSession(tab, value)
        });
    } else {
        tab.editor.container.style.display = "none";
    }
}; 
function updateSaveButton(e, editor) {
    var tab = editor.session.tab;
    if (tab.parent && tab.parent.activeTab == tab) {
        if (tab.session.getUndoManager().isClean() != refs.saveButton.disabled) {
            refs.saveButton.disabled = tab.session.getUndoManager().isClean();
        } 
        if (refs.saveButton.disabled) {
            tab.element.classList.remove("changed");
        } else {
            tab.element.classList.add("changed");
        }
    }
    if (e && tab.preview) {
        tabManager.clearPreviewStatus(tab);
    }
}
function setSession(tab, value, readOnly) {
    var editor = tab.editor
    if (!editor) return;
    
    if (editor.session && editor.session.tab) {
        saveMetadataForTab(editor.session.tab);
    }
    
    if (typeof value == "string") {
        tab.session = ace.createEditSession(value || "", cvumode);
        tab.session.tab = tab;
        tab.editor.on("input", updateSaveButton)
        loadMetadata(tab)
    }
    if (readOnly != undefined)
        tab.session.$readOnly = readOnly;
    editor.setSession(tab.session);
    editor.$options.readOnly.set.call(editor, editor.$readOnly);
    
    if (sharedWorker.$doc)
        sharedWorker.$doc.off("change", sharedWorker.changeListener);
    if (tab.session) {
        sharedWorker.deltaQueue = sharedWorker.$doc = null;
        sharedWorker.attachToDocument(editor.session.getDocument());
        editor.session.$worker = sharedWorker;
        sharedWorker.session = tab.session;
    }
    editor.container.style.display = "";
    
    editor.setOptions({
        newLineMode: "unix",
        enableLiveAutocompletion: true,
        enableBasicAutocompletion: true,
        showPrintMargin: false,
    });
    editor.completers = cvuCompleters
    
    updateSaveButton(false, editor);
}


function saveCurrentFile() {
    var tab = tabManager.activeTab;
    if (tab && !tab.session.$readOnly) {
        if (!tab.path)
            tab.path = prompt(`save ${tab.title} as:`, tab.title);
        if (!tab.path) return
        var value = tab.editor.getValue();
            
        tab.session.getUndoManager().markClean();
        sharedWorker.call("split", [value], function(result) {
            saveCVUDefinition(tab.path, value, result.parts, function() {
                updateSaveButton(false, tab.editor);
            });
        })
        
    }
}

var tabState = getJson("tabs") || {};
tabManager.setState(tabState);


var {MenuManager} = require("./playground/ui-lib/menu");
var menuManager = new MenuManager()

function closeTabs() {
    var tab = menuManager.targetElement;
    var tabs = []
    if (this.id == "Close Tab") {
        tabs = [tab]
    } else if (this.id == "Close All Tabs") {
        tabs = tab.parent.tabList.slice()
    } else if (this.id == "Close Other Tabs") {
        tabs = tab.parent.tabList.filter((x) => x != tab);
    } else if (this.id == "Close Tabs to the Left") {
        let index = tab.parent.tabList.indexOf(tab)
        tabs = tab.parent.tabList.slice(0, index);
    } else if (this.id == "Close Tabs to the Right") {
        let index = tab.parent.tabList.indexOf(tab)
        tabs = tab.parent.tabList.slice(index + 1);
    }
    tabs.forEach(tab => tab.close());
}
menuManager.add("/context/tabs/Close Tab", {exec: closeTabs})
menuManager.add("/context/tabs/Close All Tabs", {exec: closeTabs})
menuManager.add("/context/tabs/Close Other Tabs", {exec: closeTabs})
menuManager.add("/context/tabs/Close Tabs to the Left", {exec: closeTabs})
menuManager.add("/context/tabs/Close Tabs to the Right", {exec: closeTabs})


window.oncontextmenu = function(e) {
    var host = MenuManager.findHost(e.target)
    if (host?.parent?.tabContainer) {
        menuManager.openMenuByPath("/context/tabs", e)
        menuManager.targetElement = host
        e.preventDefault();
    }
}
    


function getJson(name) {
    try {
        return JSON.parse(localStorage[name]);
    } catch(e) {
        return null;
    }
}
function saveJson(name, value) {
    localStorage[name] = JSON.stringify(value);
}


function saveMetadata() {
    Object.values(tabManager.tabs).forEach(saveMetadataForTab)
}

function saveMetadataForTab(tab) {
    if (!tab.path || !tab.session) return;
        
    var session = tab.session
    var undoManager = tab.session.$undoManager;
    localStorage["@file@" + tab.path] = JSON.stringify({
        selection: session.selection.toJSON(),
        undoManager: undoManager.toJSON(),
        value: undoManager.isClean() ? undefined : session.getValue(),
        scroll: [
            session.getScrollLeft(),
            session.getScrollTop()
        ],
    });
}

function loadMetadata(tab) {
    var path = tab.path
    var session = tab.session;
    var metadata = getJson("@file@" + path)
    if (!metadata) return;
    try {
        if (typeof metadata.value == "string" && metadata.value != session.getValue()) {
            session.doc.setValue(metadata.value);
        }
        if (metadata.selection) {
            session.selection.fromJSON(metadata.selection);
        }
        if (metadata.scroll) {
            session.setScrollLeft(metadata.scroll[0]);
            session.setScrollTop(metadata.scroll[1]);
        }
        
    }catch(e) {
        console.error(e)
    }
    
        
    
}

window.onbeforeunload = function() {
    saveJson("tabs", tabManager);
    saveMetadata();
}

import {settings} from "./model/Settings"
import {PodAPI} from "./api/api"

refs.podAddress.addEventListener("input", function() {
    settings.set("user/pod/host", refs.podAddress.value);
    localStorage["user/pod/host"] = settings.get("user/pod/host")
})
refs.podAddress.value = localStorage["user/pod/host"] || "http://localhost:3030/"
settings.set("user/pod/host", refs.podAddress.value);

var api = new PodAPI();
updateTree() 
 
var defaultFilelist = Object.keys(defaults).sort().map(function(key) {
    return key && {name: key, readonly: true}
}).filter(Boolean);

listBox.popup.setData(defaultFilelist);
 
function updateTree() {
    listCVUDefinitions(function(err, files) {
        listBox.popup.setData(
            [].concat(
                [{className: "header", name: "User"}],
                files,
                [{className: "header", name: "Default"}],
                defaultFilelist
            )
        );
        listBox.popup.resize(true)
    })
}
 
function open(data, preview) {
    tabManager.open({
        path: data.name,
        preview,
    })
}
 
listBox.on("select", function(data) {
    if (data.className) return;
    open(data, true);
});
 
listBox.on("choose", function(data) {
    if (data.className) return;
    open(data, false);
});

var cache = Object.create(null)
function listCVUDefinitions(callback) {
    cache = Object.create(null)
    api.query({query: "CVUStoredDefinition"}, function(err, items) {
        if (err) return callback(error);
        items.forEach(function(item) {
            if (!item.definition || item.deleted) return;
            var name = "";
            item.definition = item.definition.replace(
                /^\s*\/\*file:(\d+):([^*\s]+)\*\//g, 
                function(_, _index, _name) {
                    name = _name;
                    item.index = parseInt(_index);
                    return "";
                }
            );
            
            if (!name)
                name = item.selector;
            if (!name) return console.error(item)
            
            if (!cache[name]) cache[name] = []
            
            cache[name].push(item); 
            
            if (!item.index) item.index = item.uid;
        });
        
        var files = Object.keys(cache).map(function(name) {
            return {
                name, 
                src: "pod",
            };
        });
        callback(null, files)
    });
}

function loadCVUDefinition(name, callback) {
    setTimeout(function() {
        if (cache[name]) {
            var text = cache[name].map(item=>item.definition).join("\n")
            return callback(null, text || "")
        }
            
        if (name == "example.cvu")
            return callback(null, example)
        if (localStorage["file-" + name])
            return callback(null, localStorage["file-" + name])
    }, 100);
}

function saveCVUDefinition(name, value, parts, callback) {
    localStorage["file-" + name] = value;
    var saved = cache[name] || [];
    var promises = [];
    var newParts = [];
    
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i]
        var existing = saved[i];
        
        var definition = `/*file:${i+1}:${name}*/` + part.definition;
        var data = {
            _type: "CVUStoredDefinition",
            domain: "user",
            definition: definition,                    
            selector: part.selector,
            name: part.name,
        };
        
        if (existing) {
            data.uid = existing.uid;
        } else {
            data.uid = Math.ceil(Math.random() *100000);
        }
            
        promises.push(new Promise(function(resolve, reject) {
            if (!existing) {
                api.create(data, function(err, uid) {
                    resolve(uid)
                });
            } else {
                api.update(data, function(err, uid) {
                    resolve(uid)
                });
            }
        }))
    }
    
    while(i < saved.length) {
        var existing = saved[i];
        promises.push(new Promise(function(resolve, reject) {
            api.remove(existing.uid, function(err, uid) {
                resolve(uid)
            })
        }));
        i++;
    }
    
    Promise.all(promises).then(function() {
        updateTree()
        callback()
    })
}


