import {Edge, getItemType, SchemaItem} from "../../router";

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

    objectForPrimaryKey(type, key, primaryKey="uid") {//TODO: while we don't have objectSchema
        return this.db.find((item) => item["_type"] == type && item[primaryKey] && item[primaryKey] == key);
    }

    create(type, properties) {
        let obj = {
            _type: type,
            ...properties
        }
        this.db.push(new (getItemType(obj["_type"]))(obj));
        return this.db[this.db.length - 1];
    }

    add(obj, update = true) {
        if (update) {
            let item = this.objectForPrimaryKey(obj["_type"], obj.uid);
            if (item) {
                for (let prop in obj) {
                    if (obj.hasOwnProperty(prop))
                        item[prop] = obj[prop];
                }
            } else {
                if (obj instanceof SchemaItem || obj instanceof Edge) {
                    this.db.push(obj);
                } else {
                    this.db.push(new (getItemType(obj["_type"]))(obj));
                }
            }
        } else {
            this.db.push(new (getItemType(obj["_type"]))(obj));
        }
    }

    write(callback) {
        callback();
    }
    delete(obj) {
        /*if (obj["allEdges"] && obj["allEdges"].length > 0) {
            let edgesIndexes = [];

            obj["allEdges"].forEach((edge) => {
                edgesIndexes.unshift(this.db.findIndex((item) => item["uid"] && item["uid"] == edge["uid"]));
            });
            edgesIndexes.forEach((index) => {
                this.db.splice(index, 1);
            })
        }*/ //TODO: will do when it's neccessary
        const index = this.db.indexOf(obj);
        this.db.splice(index, 1);
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
            let notQuery = (query.indexOf("NOT ANY") > -1);
            if (/(?<=^|\s)ANY\s([.\w]+)\s*=\s*(\w+|('[^']*'))$/g.test(query)) {
                let parts = query.split(/(?:AND )?(?:NOT )?ANY/i);
                query=parts[0];
                let replace = notQuery? "item['$1'] && item['$1'].some((el)=> el['$2'] != $3)" : "item['$1'] && item['$1'].some((el)=> el['$2'] == $3)";
                var anyQuery = parts[1].replace(/\s([\w]+)\.(\w+)\s*=\s*(\w+|('[^']*'))/, replace);
                var result = this.filter(new Function("item", "return " + anyQuery))
            }
        }

        if (!result)
            result = this;

        if (query != "") {
            let newquery = query.replace(/deleted = false/i, "!item['deleted']").replace(/(?<=^|\s)([_\w]+)\s*(!?=)\s*(\w+|('[^']*'))/g, "item['$1'] $2= $3").replace(/\bAND\b/gi, "&&").replace(/\bOR\b/gi, "||")
            return result.filter(new Function("item", "return " + newquery))
        } else {
            return result
        }
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
