//import * as DB from "./defaults/default_database.json";
import {getItemType} from "./items/Item";
/*let fs = require("fs");
var DB = fs.readFileSync("./defaults/default_database.json");*/

/*DB.forEach(function(x, i) {
    if (!x.uid)
        x.uid = (i + 1) + 1000000
    /!*else
        console.log(x.uid)*!/
})*/

export class Realm {
    db;

    constructor() {
        if (!Array.isArray(this.db))
            this.db = [];
    }

    objects(type?) {
        let realmObjects = new RealmObjects();
        if (type) {
            realmObjects.push(...this.db.filter((item) => item["_type"] == type).map((item) => {
                return new (getItemType(item["_type"]))(item)}));
            return realmObjects
        }
        realmObjects.push(...this.db.map((item) => new (getItemType(item["_type"]))(item)));
        return realmObjects;
    }

    objectForPrimaryKey(type, key) {
        let obj = this.db.filter((item) => item["_type"] == type && item["uid"] && item["uid"] == key);
        if (obj.length > 0) {
            let objType = obj[0]["_type"];
            return new (getItemType(objType))(obj[0]);
        }
    }

    create(type, properties) {
        let obj = {
            _type: type,
            ...properties
        }
        this.db.push(new (getItemType(obj["_type"]))(obj));
        return this.db[this.db.length - 1];
    }

    write(callback) {
        callback();
    }
    delete(obj) {
       //TODO:
    }
    objectSchema() {

    }
}

export class RealmObjects extends Array {
    /*db;

    constructor(db) {
        super();
        this.db = db;
    }*/

    filtered(query: string) {
        //TODO: we need parse query, not eval it... "selector = '[sessions = defaultSessions]'"
        let newquery = query.replace(/deleted = false/i,"!item['deleted']").replace(/(?<=^|\s)(\w+)\s*=\s*(\w+|('[^']*'))/g,"item['$1'] == $2").replace(/\bAND\b/gi,"&&").replace(/\bOR\b/gi,"||")
        return this.filter(new Function("item", "return " + newquery))
        //return this;
    }

    sorted(descriptor: string, reverse?: boolean) {
        //TODO:
        return this;/*.sort((a, b) => {

        })     */
    }
}

export class RealmObject {
    name: string;
    properties;
}