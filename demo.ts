"use strict";

import ace from "ace-builds";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-error_marker";
import "ace-builds/src-noconflict/ext-options";
import "ace-builds/src-noconflict/ext-prompt";
import {Mode} from "./playground/cvu-mode";

let DemoWorker = require("worker-loader!./demo-worker")

let demoWorker = new DemoWorker();



ace.Editor.prototype.__defineGetter__("$readOnly", function() { return this.session.$readOnly })


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
var testBox
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
            1: new Box({
                isMain: true,
                0: mainBox = new Box({
                    ratio: 0.5,
                    isMain: true,
                }),
                1: testBox = new Box({
                    isMain: false,
                    size: "420px"
                }),
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

let memriApp = document.createElement("iframe");
memriApp.width = testBox.size;
memriApp.height = window.innerHeight - 20 + "px";

testBox.element.appendChild(memriApp);

baseBox.toolBars.top.element.textContent = "";
dom.buildDom([
    ["input", { 
        ref: "podAddress", 
        value: "http://localhost:3030",
        onkeypress: function(e) {
            if (e.key == "Enter") {
                updateTree()
                memriApp.src = "http://localhost:9000/app.html?pod=" + localStorage["user/pod/host"]
            }
        }
    }],
    ["button", {
        onmousedown: (e)=> {
            e.preventDefault()
        },
        onclick: (e)=> {
            e.preventDefault();
            updateTree();
            memriApp.src = "http://localhost:9000/app.html?pod=" + localStorage["user/pod/host"]
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
        tabTitle: `Untitled${newTabCounter++}.cvu`,
        active: true,
    })
};
tabManager.loadFile = function(tab) {
    if (!tab.editor) return;
    
    if (tab.session) {
        return setSession(tab, tab.session)
    } else if (!tab.path) {
        return setSession(tab, "")
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
function setSession(tab, value) {
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
    var readOnly = tab.path?.startsWith("defaults/");
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
            tab.path = prompt(`save ${tab.tabTitle} as:`, tab.tabTitle);
        if (!tab.path) return
        if (/^defaults\//.test(tab.path)) {
            return
        }
        var name = tab.path.replace(/\s+/g,"").split("/").pop();
        tab.path  = "user/" + name;
        tab.tabTitle = name
        tab.$title.textContent = tab.tabTitle;
        
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

import {Settings} from "./router"
import {PodAPI} from "./router"

refs.podAddress.addEventListener("input", function() {
    Settings.shared.set("user/pod/host", refs.podAddress.value);
    localStorage["user/pod/host"] = Settings.shared.get("user/pod/host")
})
refs.podAddress.value = localStorage["user/pod/host"] || "http://localhost:3030/"
Settings.shared.set("user/pod/host", refs.podAddress.value);

import {mockApi} from "./playground/mockApi"
var api = new PodAPI(undefined, new mockApi());
 
window.api = api

window.setUserCVUs = () => {
    if (localStorage["user/pod/host"] && localStorage["user/pod/host"] == "mock") {
        for (let [key, value] of Object.entries(localStorage)) {
            if (/^file-user\//.test(key)) {
                sharedWorker.call("split", [value], function(result) {
                    saveCVUDefinition(key.substr(5), value, result.parts, function() {
                        //updateSaveButton(false, tab.editor);
                    });
                })
            }
        }
    }
}


listBox.popup.setData([{value:  "Connect to pod to load data"}]);
 
function sortFn(a, b) {
    return a.name.localeCompare(b.name);
}
function updateTree() {
    listCVUDefinitions(function(err, files) {
        if (err) {
            console.error(err)
            return alert("Could not connect to pod: " + err.message)
        }
        var selected = listBox.popup.getData(listBox.popup.getRow());
        var data = [{className: "header", name: "User"}].concat(
            files.user.sort(sortFn),
            [{className: "header", name: "Default"}],
            files.defaults.sort(sortFn),
        )
        listBox.popup.setData(data);
        listBox.popup.resize(true);
        listBox.popup.session.setScrollTop(0)
        if (selected) {
            data.some(function(item, i) {
                if (item.name == selected.name) {
                    listBox.popup.setRow(i);
                    return true
                }
            })
        }
    })
}
 
function open(data, preview) {
    tabManager.open({
        path: data.path,
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


var cache;
var cacheListeners;
function listCVUDefinitions(callback) {
    cache = Object.create(null)
    api.query({query: "CVUStoredDefinition"}, false,function(err, items) {
        if (err) return callback(err);
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
            
            if (!name) {
                name = item.selector.replace(/[\[\]]/g, "").trim();
            }
            if (!name) return console.error(item)
                
            name = item.domain + "/" + name
            
            if (!cache[name]) cache[name] = []
            
            cache[name].push(item); 
            
            if (!item.index) item.index = item.uid;
        });
        
        var files = {defaults: [], user: []};
        Object.keys(cache).map(function(path) {
            var domain = path.split("/")[0]
            if (!files[domain]) return;
            var name = path.slice(domain.length + 1);
            files[domain].push({
                readOnly: domain == "defaults",
                path,
                name,
            });
        });
        callback(null, files)
        
        if (cacheListeners && cacheListeners.length) {
            cacheListeners.forEach(x=>x())
            cacheListeners.length = 0;
        }


    });
}

function loadCVUDefinition(path, callback) {
    if (!cacheListeners) cacheListeners = []
    if (!cache)
        return cacheListeners.push(loadCVUDefinition.bind(this, path, callback))
    if (cache[path]) {
        var text = cache[path].map(item=>
            item.definition.replace(/\s+$|^\s+/g, "")
        ).join("\n\n")
        return callback(null, text || "")
    }
    if (localStorage["file-" + path])
        return callback(null, localStorage["file-" + path]);
}

function saveCVUDefinition(path, value, parts, callback) {
    localStorage["file-" + path] = value;
    var saved = cache[path] || [];
    var promises = [];
    var newParts = [];
    var name = path.split("/").pop();
    
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i]
        var existing = saved[i];
        
        var definition = `/*file:${i+1}:${name}*/\n` + part.definition;
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
        if (typeof memriApp.contentWindow.updateCVU == "function")
            memriApp.contentWindow.updateCVU();
    })
}


updateTree()
window.setUserCVUs()