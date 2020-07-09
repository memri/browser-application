import {debugHistory} from "../cvu/views/ViewDebugger";

export function realmWriteIfAvailable(realm, doWrite) {
    doWrite();
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