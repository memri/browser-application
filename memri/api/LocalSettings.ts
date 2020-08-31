//
//  LocalSettings.swift
//  memri
//
//  Created by Ruben Daniels on 7/26/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {DatabaseController} from "../storage/DatabaseController";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {Realm} from "../model/RealmLocal";

export class LocalSetting {
    key?: string
    value?: string
    
    /// Primary key used in the realm database of this Item
    primaryKey(): string {
        return "key"
    }
    
    static set(key: string, value: string) {
        DatabaseController.current(true, ($0) => { debugHistory.warn(`${$0}`) }, (realm: Realm) => {
            let setting = realm.objectForPrimaryKey("LocalSetting", key)

            if (setting) {
                setting.value = value
            }
            else {
                realm.create("LocalSetting", {"key": key, "value": value})
            }
        })
    }

    static get(key: string): string {
        return DatabaseController.current(true, (realm) => {
            let setting = realm.object("LocalSetting", key)
            if (setting) {
                return setting["value"]
            }
            return undefined
        })
    }
}