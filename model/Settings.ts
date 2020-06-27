export var settings = {
    set(path, value) {
        this[path] = value
    },
    get(path) {
        return this[path];
    }
};
