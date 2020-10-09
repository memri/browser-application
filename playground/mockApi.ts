"use strict";
import {Views} from "../router";
import {realm} from "../router";

export class mockApi {
    constructor() {
        this.mockdata = [];
    }

    realmInit() {
        let objects = realm.objects("CVUStoredDefinition");
        if (objects.length == 0) {
            new Views().install(undefined);
            objects = realm.objects("CVUStoredDefinition");
        }
        this.mockdata = objects
    }

    async http({method = "GET", path = "", body, data}, callback) {
        if (this.mockdata.length == 0) {
            this.realmInit();
        }
        if (path == "search_by_fields" || path == "get_items_with_edges" && method == "POST") {
            var payload = JSON.parse(body);
            var callFunc = JSON.parse(JSON.stringify(this.mockdata.filter(el => {
                for (let [key, value] of Object.entries(payload)) {
                    if (el[key] != value) {
                        return false;
                    }
                }
                return true;
            })));

            return callback(null, callFunc);
        }
        if (method == "POST") {
            var payload = JSON.parse(body);
            if (path == "create_item") {
                if (payload.version == undefined) {
                    payload.version = 0;
                }
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
                for (let [key, value] of Object.entries(payload)) {
                    this.mockdata[index][key] = value;
                }
                this.mockdata[index]["version"]++
                return callback(null, uid)
            }
            if (path == "delete_item") {
                this.mockdata.splice(index, 1);
                return callback(null, uid)
            }
        }
    }
}
