//
//  ObjectCache.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

// TODO: using NSCache for OS level purging of cache when memory is needed
export var cache = {};

export var setInMemoryObjectCache = function (key, value) {
	if (cache[key] == null) {
		cache[key] = new CacheItem(value)
	} else if (cache[key].value) {
		cache[key].value = value
	} else {
		throw `Exception: Can not set cache value to differen type: ${key}`
	}
}

export var getInMemoryObjectCache = function (key) {
	if (cache[key] == null) {
		return this.cache[key]
	}
	return cache[key]?.value
}
/*export class InMemoryObjectCache {
	cache = {}

	set(key, value)  {
		if (this.cache[key] == null) {
			this.cache[key] = new CacheItem(value)
		} else if (this.cache[key].value) {
			this.cache[key].value = value
		} else {
			throw `Exception: Can not set cache value to differen type: ${key}`
		}
	}

	get(key) {
		if (this.cache[key] == null) {
			return this.cache[key]
		}
		return this.cache[key]?.value
	}
	////TODO
	// set(key, value)  {
	// 	 globalInMemoryObjectCache.set(key, value)
	// }
	//
	// get(key) {
	// 	globalInMemoryObjectCache.get(key)
	// }
}*/

class CacheItem {
	value
	constructor(value) { this.value = value }
}

//var globalInMemoryObjectCache = InMemoryObjectCache