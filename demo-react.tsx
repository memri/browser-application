"use strict";

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {debugHistory} from "./router";
import {contextJs} from "./install";

var queryString = window.location.search;
let params = new URLSearchParams(queryString);
let pod = params.get("pod");
switch (pod) {
    case "none":
        contextJs.installer.installLocalAuthForLocalInstallation(contextJs, true, (error) => {
            error && debugHistory.error(error)
        })
        break;
    case "mock":
        contextJs.podAPI = parent.api

        contextJs.installer.installLocalAuthForLocalInstallation(contextJs, true, (error) => {
            error && debugHistory.error(error)
        })
        contextJs.cache.podAPI = parent.api
        parent.setUserCVUs();
        break;
    case undefined:
    case null:
        break;
    default:
        contextJs.installer.installLocalAuthForExistingPod(contextJs, true, pod, "", localStorage.ownerKey, localStorage.databaseKey, (error) => {
            error && debugHistory.error(error)
        })
        break;
}

console.log(contextJs);

import {Application} from "./memri/gui/Application";

function importCssString(cssText, id) {
    cssText += "\n/*# sourceURL=css:/" + id + " */";
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(cssText));
    document.head.appendChild(style);
};

importCssString(`
body {margin: 0}
.Application {
    display: flex;
    align-items: center;
    justify-content: center;
}
.ScreenSizer {
    outline: solid;
}
.HStack {
    flex-direction: row;
    display: flex;
}
.VStack {
    flex-direction: column;
    display: flex;
}
.ZStack {
    position: relative;
}
`, "main.css")

function App() {//TODO: don't ask, please, about link inside div =)
    return <div><link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <Application context={contextJs}/>
    </div>
}

var div = document.body.appendChild(document.createElement("div"))

ReactDOM.render(App(), div)



