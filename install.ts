import {debugHistory, RootContext} from "./router";

export var geom = {
    size: {
        width: 414,
        height: 736
    }//TODO: for testing
}

export var contextJs = new RootContext("Memri GUI");
contextJs.installer.await(contextJs,() => {
    contextJs.boot(false, (error) => {
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