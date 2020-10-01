"use strict";

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {debugHistory} from "./router";
import {contextJs} from "./install";



var queryString = window.location.search;
let params = new URLSearchParams(queryString);
let pod = params.get("pod");
if (pod == "none" && contextJs.installer.isInstalled == false) {
    contextJs.installer.installLocalAuthForLocalInstallation(contextJs, true, (error) => {
        error && error.map(($0) => debugHistory.error(`${$0}`))
    })
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



