import {getItemType} from "./items/Item";

export class Realm {
    db;

    constructor() {
        if (!Array.isArray(this.db))
            this.db = [];
    }

    objects(type?) {
        let realmObjects = new RealmObjects();
        if (type) {
            realmObjects.push(...this.db.filter((item) => item["_type"] == type));
            return realmObjects
        }
        realmObjects.push(...this.db);
        return realmObjects;
    }

    objectForPrimaryKey(type, key) {
        return this.db.find((item) => item["_type"] == type && item["uid"] && item["uid"] == key);
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
        if (query.indexOf("ANY") > -1) { //TODO:
            if (/(?<=^|\s)ANY\s([.\w]+)\s*=\s*(\w+|('[^']*'))$/g.test(query)) {
                let parts = query.split(/(?:AND )?ANY/i);
                query=parts[0];
                var anyQuery = parts[1].replace(/\s([\w]+)\.(\w+)\s*=\s*(\w+|('[^']*'))/,"item['$1'].some((el)=> el['$2'] == $3)");
                var result = this.filter(new Function("item", "return " + anyQuery))
            }
        }
        //TODO: we need parse query, not eval it... "selector = '[sessions = defaultSessions]'"
        let newquery = query.replace(/deleted = false/i,"!item['deleted']").replace(/(?<=^|\s)(\w+)\s*=\s*(\w+|('[^']*'))/g,"item['$1'] == $2").replace(/\bAND\b/gi,"&&").replace(/\bOR\b/gi,"||")
        if (!result)
            result = this;
        return result.filter(new Function("item", "return " + newquery))
        //return this;
    }

    sorted(descriptor: string, reverse?: boolean) {
        //TODO:
        return this.sort((a, b) => {
            let res
            if (a[descriptor] > b[descriptor]) {
                res = 1
            } else if (a[descriptor] < b[descriptor]) {
                res = -1
            } else {
                res = 0
            }
            return reverse ? res : -res
        })
    }
}

export class RealmObject {
    name: string;
    properties;
}
