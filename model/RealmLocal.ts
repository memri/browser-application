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
        return this.db.filter((item) => item["_type"] == type && item["uid"] && item["uid"] == key);
    }

    create(type, properties) {
        let obj = {
            _type: type,
            ...properties
        }
        this.db.push(obj);
        return this.db[this.db.length];
    }

    write(callback) {
        callback();
    }
    delete(obj) {
       //TODO:
    }
}

export class RealmObjects extends Array {
    /*db;

    constructor(db) {
        super();
        this.db = db;
    }*/

    filtered(query: string) {
        //TODO: we need parse query, not eval it...
        let newquery = query.replace(/(\w+)\s*=\s*('?\w+'?)/g,"item['$1'] == $2").replace("AND","&&").replace("OR","||")
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
