"use strict";

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Application} from "./memri/gui/Application";
import {RootContext} from "./memri/context/MemriContext";
import {debugHistory} from "./memri/cvu/views/ViewDebugger";


import { makeStyles } from '@material-ui/core/styles';

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

let context = new RootContext("Memri GUI");
context.installer.await(context,() => {
    context.boot(false, (error) => {
        if (error) {
            // TODO present to the user!!
            debugHistory.error(`${error}`)
            return
        }
        /*this.settingWatcher = context.settings.subscribe(
            "device/sensors/location/track",
            type: Bool.self
    ).sink {
            if let value = $0 as? Bool {
                if value { SensorManager.shared.locationTrackingEnabledByUser() }
        else { SensorManager.shared.locationTrackingDisabledByUser() }
        }
        }*/
    })
});
console.log(context);

function App() {//TODO: don't ask, please, about link inside div =)
  return <div><link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <Application context={context}/>
  </div>
}

export var geom = {
    size: {
        width: 414,
        height: 736
    }//TODO: for testing
}

function updateSize() {
    geom.size.height = window.innerHeight - 4;
    geom.size.width = Math.min(window.innerWidth, 414);
}
window.onresize = updateSize
updateSize();

var div = document.body.appendChild(document.createElement("div"))

ReactDOM.render(App(), div)



