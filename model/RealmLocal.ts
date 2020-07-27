import * as DB from "./defaults/default_database.json";
/*let fs = require("fs");
var DB = fs.readFileSync("./defaults/default_database.json");*/

export class Realm {
    db;

    constructor() {
        this.db = DB;
    }

    objects(type?) {
        let realmObjects = new RealmObjects();
        if (type) {
            realmObjects.push(...this.db.filter((item) => item["_type"] == type));
            //new RealmObjects(this.db.filter((item) => item["_type"] == type));
            return realmObjects
        }
        realmObjects.push(...this.db);
        return realmObjects;
    }

    objectForPrimaryKey(type, key) {
        let obj = this.db.filter((item) => item["_type"] == type && item["uid"] && item["uid"] == key);
        return (obj.length > 0) ? obj[0] : undefined;
    }

    create(type, properties) {
        let obj = {
            _type: type,
            ...properties
        }
        this.db.push(obj);
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
        return this.filter((item)=>{
            return eval(newquery);
        });
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
