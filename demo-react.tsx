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
            error && error.map(($0) => debugHistory.error(`${$0}`))
        })
        break;
    case "mock":
        contextJs.podAPI = parent.api

        contextJs.installer.installLocalAuthForLocalInstallation(contextJs, true, (error) => {
            error && error.map(($0) => debugHistory.error(`${$0}`))
        })
        contextJs.cache.podAPI = parent.api
        parent.setUserCVUs();
        break;
    case undefined:
    case null:
        break;
    default:
        contextJs.installer.installLocalAuthForExistingPod(contextJs, true, pod, "", localStorage.ownerKey, localStorage.databaseKey, (error) => {
            error && error.map(($0) => debugHistory.error(`${$0}`))
        })
        break;
}

console.log(contextJs);

import {Application} from "./memri/gui/Application";

function App() {//TODO: don't ask, please, about link inside div =)
  return <div><link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <Application context={contextJs}/>
  </div>
}



var div = document.body.appendChild(document.createElement("div"))

ReactDOM.render(App(), div)



