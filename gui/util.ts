import {debugHistory} from "../cvu/views/ViewDebugger";
import {getItemType, ItemFamily} from "../model/schema";
//var fs = require("fs");

export var MemriJSONEncoder = function (x) {
    return JSON.stringify(x);
}
export var serialize = MemriJSONEncoder;
export var serializeJSON = serialize;

export var MemriJSONDecoder =  function (x) {
    return JSON.parse(x);
}
export var unserialize = MemriJSONDecoder;

export function realmWriteIfAvailable(realm, doWrite) {
    doWrite();
}

export function stringFromFile(file: string, ext: string = "json") {
    debugHistory.info(`Reading from file ${file}.${ext}`)
    try {
        var jsonString = fs.readFileSync(file + '.' + ext, "utf8");
        return jsonString;
    } catch (e) {
        throw `Cannot read from ${file} with ext ${ext}, path does not result in valid url`
    }
}

export function jsonDataFromFile(file: string, ext: string = "json") {
    let jsonString = stringFromFile(file, ext);
    let jsonData = serialize(jsonString);
    return jsonData
}

export function jsonErrorHandling(convert) {
    try {
        convert()
    } catch (error) {
        console.log(`\nJSON Parse Error: ${error}\n`)
    }
}

export function getCodingPathString(codingPath) {
    var path: string = "[Unknown]"

    if (codingPath.length > 0) {
        path = ""
        for (let i = 0; i < codingPath.length - 1; i++) {
            if (codingPath[i].intValue == undefined) { //TODO:
                if (i > 0) { path += "." }
                path += `${codingPath[i].stringValue}`
            } else {
                path += `[${Number(codingPath[i].intValue ?? -1)}]`
            }
        }
    }

    return path
}

export function JSONErrorReporter(convert) {
    try {
        convert()
    } catch (error) {
        throw (`JSON Parse Error: ${error}`)
    }
}

export function decodeEdges(decoder: Decoder, key: string, source: Item) {
    try {
        let edges = decoder.decodeIfPresent(key);
        if (edges) {
            for (let edge of edges) {
                edge.sourceItemType = source.genericType
                edge.sourceItemID.value = source.uid.value
            }
            source[key] = edges
        }
    } catch (error) {
        debugHistory.error(`${error}`)
    }
}

/*
func withRealm(_ doThis: (_ realm: Realm) -> Any?) -> Any? {
    do {
        let realm = try Realm()
        return doThis(realm)
    } catch {
        debugHistory.error("\(error)")
    }
    return nil
}*/

export function getItem(type: string, uid) { //TODO:
    type = ItemFamily[type];
    if (type) {
        let item = getItemType(type);
        return item;
    }
    return
}

export function autoreleasepool(callback){callback()}//TODO
