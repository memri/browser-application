//
// Settings.swift
// Copyright © 2020 memri. All rights reserved.

/// This class stores the settings used in the memri app. Settings may include things like how to format dates, whether to show certain
/// buttons by default, etc.
import {CacheMemri} from "./Cache";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {DatabaseController} from "../storage/DatabaseController";
import {Setting} from "./items/Item";
import {Realm} from "./RealmLocal";
import {serialize, unserialize} from "../gui/util";
import {MemriDictionary} from "./MemriDictionary";

export class Settings {
    /// Shared settings that can be used from the main thread
    static shared: Settings = new Settings()

    listeners = {}
    callbacks = {}

    /// Init settings with the relam database
    /// - Parameter rlm: realm database object
    constructor() {

    }

    // TODO: Refactor this so that the default settings are always used if not found in Realm.
    // Otherwise anytime we add a new setting the get function will return nil instead of the default

    /// Get setting from path
    /// - Parameter path: path of the setting
    /// - Returns: setting value
    get(path: string) {
        try {
            for (path of this.getSearchPaths(path)) {
                let value = this.getSetting(path)
                if (value) {
                    return value
                }
            }
        }
        catch (error) {
            console.log(`Could not fetch setting '${path}': ${error}`)
        }

        return undefined
    }

    /// get settings from path as String
    /// - Parameter path: path of the setting
    /// - Returns: setting value as String
    getString(path: string): string {
        return this.get(path) ?? ""
    }

    /// get settings from path as Bool
    /// - Parameter path: path of the setting
    /// - Returns: setting value as Bool
    getBool(path: string): boolean {
        return this.get(path) ?? undefined
    }

    /// get settings from path as Int
    /// - Parameter path: path of the setting
    /// - Returns: setting value as Int
    getInt(path: string): number {
        return this.get(path) ?? undefined
    }

    getSearchPaths(path: string) {
        let p = path[0] == "/" ? String(path.substr(1)) : path
        let splits = p.split("/")
        let type = splits[0]
        let query = splits.slice(1).join("/")

        if (type == "device") {
            return [`${CacheMemri.getDeviceID()}/${query}`, `defaults/${query}`]
        }
        else if (type == "user") {
            return [`user/${query}`, `defaults/${query}`]
        }
        else {
            return [`defaults/\{query}`]
        }
    }

    /// Sets the value of a setting for the given path. Also responsible for saving the setting to the permanent storage
    /// - Parameters:
    ///   - path: path used to store the setting
    ///   - value: setting value
    set(path: string, value) {
        try {
            let searchPaths = this.getSearchPaths(path)
            if (searchPaths.length == 1) {
                throw "Missing scope 'user' or 'device' as the start of the path"
            }
            this.setSetting(searchPaths[0], value/* ?? AnyCodable(value)*/)
            this.fire(searchPaths[0], value?.value ?? value)
        }
        catch (error) {
            debugHistory.error(`${error}`)
            console.log(error)
        }
    }

    /// get setting for given path
    /// - Parameter path: path for the setting
    /// - Returns: setting value
    getSetting(path: string) {
        return DatabaseController.tryCurrent(false, (realm: Realm) => {
            let item = realm.objects("Setting").find(($0) => $0.key == path)

            if (item && item.json) {
                let output = unserialize(item.json)
                return output
            }
            else {
                return undefined
            }
        })
    }

    /// Get setting as String for given path
    /// - Parameter path: path for the setting
    /// - Returns: setting value as String
    getSettingString(path: string): string {
        return String(this.getSetting(path) ?? "")
    }

    /// Sets a setting to the value passed.Also responsible for saving the setting to the permanent storage
    /// - Parameters:
    ///   - path: path of the setting
    ///   - value: setting Value
    setSetting(path: string, value) {
        DatabaseController.tryCurrent(true, (realm: Realm) => {
            let s = realm.objects("Setting").find(($0) => $0.key == path)

            if (s) {
                s.json = serialize(value)

                if (s._action != "create") {
                    s._action = "update"
                    if (!s._updated.includes("json")) {
                        s._updated.push("json")
                    }
                    // #warning("Missing AuditItem for the change")
                }
            }
            else {
                CacheMemri.createItem(
                    "Setting",
                    new MemriDictionary({"key": path, "json": serialize(value)})
                )
            }
        })
    }

    fire(path: string, value) {
        let list = this.listeners[path]
        if (list) {
            for (var id of list) {
                let f = this.callbacks[id]
                if (f) {
                    f(value)
                }
            }
        }
    }

    addListener(
        path: string,
        id: UUID,
        f
    ) {
        let normalizedPath = this.getSearchPaths(path)[0]
        if (!normalizedPath) {
            throw "Invalid path"
        }

        if (this.listeners[normalizedPath] == undefined) { this.listeners[normalizedPath] = [] }
        if (!(this.listeners[normalizedPath]?.includes(id) ?? false)) {
            this.listeners[normalizedPath]?.push(id)
            this.callbacks[id] = f

            let value = this.get(path)
            if (value) {
                this.fire(normalizedPath, value)
            }
        }
    }

    removeListener(path: string, id: UUID) {
        this.listeners[path] = this.listeners[path]?.filter(($0) => $0 != id)
        delete this.callbacks[id]
    }
}