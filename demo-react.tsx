"use strict";

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Application} from "./memri/gui/Application";
import {RootContext} from "./memri/context/MemriContext";
import {debugHistory} from "./memri/cvu/views/ViewDebugger";

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

var queryString = window.location.search;
let params = new URLSearchParams(queryString);
let pod = params.get("pod");
if (pod == "none") {
    context.installer.installLocalAuthForLocalInstallation(context, true, (error) => {
        error && error.map(($0) => debugHistory.error(`${$0}`))
    })
}

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

var div = document.body.appendChild(document.createElement("div"))

ReactDOM.render(App(), div)



