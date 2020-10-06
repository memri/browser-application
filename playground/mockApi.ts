"use strict";
//import {contextJs} from "../install";
import {debugHistory, PodAPI, Views} from "../router";
import {realm} from "../router";





export class mockApi {
    constructor() {

        this.realmInit();
    }

    realmInit() {
        let objects = realm.objects("CVUStoredDefinition");//
        if (objects.length == 0) {
            let views = new Views().install(undefined);
            objects = realm.objects("CVUStoredDefinition");
        }
        this.mockdata = objects
    }

    async http({method = "GET", path = "", body, data}, callback) {
        if (this.mockdata.length == 0) {
            this.realmInit();
        }
        if (path == "search_by_fields" || path == "get_items_with_edges" && method == "POST") {
            return callback(null, JSON.parse(JSON.stringify(this.mockdata)));
        }
        if (method == "POST") {
            var payload = JSON.parse(body);
            if (path == "create_item") {
                this.mockdata.push(payload)
                return callback()
            }

            if (path == "bulk_action") {
                if (payload["createItems"]) {
                    this.mockdata.push(...payload["createItems"])
                }
                if (payload["updateItems"]) {
                    console.log(payload["updateItems"])
                }
                return callback()
            }

            var uid = typeof payload == "object" ? payload?.uid : payload
            var item, index;
            this.mockdata.some(function(x, i) {
                if (x.uid == uid) {
                    item = x
                    index = i;
                    return true
                };
            })
            if (!uid || !item)
                return callback(new Error());

            if (path == "update_item") {
                this.mockdata[index] = payload
                return callback(null, uid)
            }
            if (path == "delete_item") {
                this.mockdata.splice(index, 1);
                return callback(null, uid)
            }
        }
    }
}



/*
if (contextJs.installer.isInstalled == false) {
    contextJs.installer.installLocalAuthForLocalInstallation(contextJs, true, (error) => {
        error && error.map(($0) => debugHistory.error(`${$0}`))
    })
    contextJs.podAPI = new mockApi()
}


*/




