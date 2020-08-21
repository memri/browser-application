
export class MemriDictionary {
    constructor(properties = {}) {
        for (let key in properties) {
            this[key] = properties[key];
        }
    }


}