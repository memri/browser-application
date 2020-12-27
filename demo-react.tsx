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
        contextJs.installer.installLocalAuthForLocalInstallation(contextJs, (error) => {
            error && debugHistory.error(error)
        })
        break;
    case "mock":
        contextJs.podAPI = parent.api

        contextJs.installer.installLocalAuthForLocalInstallation(contextJs, (error) => {
            error && debugHistory.error(error)
        })
        contextJs.cache.podAPI = parent.api
        parent && parent.setUserCVUs();
        break;
    case undefined:
    case null:
        break;
    default:
        contextJs.installer.installLocalAuthForExistingPod(contextJs, pod, "", localStorage.ownerKey, localStorage.databaseKey, (error) => {
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
/* Frutiger Neue LT - main font */
@font-face {
  font-family: 'Frutiger Neue LT';
  src: url('/memri/Resources/fonts/FrutigerNeueLT.woff') format('woff');
  font-weight: 400;
  font-style: normal; 
}

@font-face {
  font-family: 'Frutiger Neue LT';
  src: url('/memri/Resources/fonts/FrutigerNeueLTLight.woff') format('woff');
  font-weight: 100;
}

@font-face {
  font-family: 'Frutiger Neue LT';
  src: url('/memri/Resources/fonts/FrutigerNeueLTBook.woff') format('woff');
  font-weight: 300;
}

@font-face {
  font-family: 'Frutiger Neue LT';
  src: url('/memri/Resources/fonts/FrutigerNeueLTBold.woff') format('woff');
  font-weight: 500;
}

@font-face {
  font-family: 'Frutiger Neue LT';
  src: url('/memri/Resources/fonts/FrutigerNeueLTHeavy.woff') format('woff');
  font-weight: 600;
}

body {margin: 0; font-family: 'Frutiger Neue LT', sans-serif;}
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
    box-sizing: border-box;
}
.VStack {
    flex-direction: column;
    display: flex;
    box-sizing: border-box;
}
.ZStack {
    display: grid;
    position: relative;
    box-sizing: border-box;
}

.ZStack > * {
    grid-area: 1/1/1/1;
}

::-webkit-scrollbar {
    width: 3px;
}

::-webkit-scrollbar-thumb {
    background: #8888;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.NavigationView .NavigationViewContent .MuiButton-root {
    width: 100%;
}

.NavigationView .NavigationViewContent .Form {
    margin-left: 5%;
    margin-right: 5%;
    width: 90%;
}

.NavigationView .NavigationViewContent .NavigationLink.MuiButton-root {
    background: #fff;
    justify-content: space-between
}

.NavigationView .NavigationViewContent .SectionContent {
    background: #fff;
    margin-left: 10px;
    margin-right: 10px;
    border-radius: 10px;
    padding: 5px;
    align-items: center
}

.NavigationView .NavigationViewContent .Section .MemriText {
    margin-left: 25px;
    margin-top: 10px;
    margin-bottom: 10px;
    color: #888
}

.NavigationView .NavigationViewContent .SectionContent .MemriText {
    color: #000;
    margin: 0px;
}

.NavigationView .NavigationViewContent .HStack .MemriText {  
    color: #000;
    margin: 0px;
}

.NavigationView .NavigationViewContent .MemriRealButton .MemriText {  
    color: #1d88ff;
    margin: 0px;
}

.NavigationView .MemriList .MemriRealButton .MemriText, .NavigationView .MemriRealButton .NavigationLink .MemriText {
    color: #000
}

`, "main.css")

function App() {//TODO: don't ask, please, about link inside div =)
    return <div><link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <Application context={contextJs}/>
    </div>
}

var div = document.body.appendChild(document.createElement("div"))

ReactDOM.render(App(), div)



