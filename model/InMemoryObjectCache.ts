//
//  ObjectCache.swift
//
//  Copyright © 2020 memri. All rights reserved.
//

// TODO: using NSCache for OS level purging of cache when memory is needed
class InMemoryObjectCache {
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
}

class CacheItem {
	value
	constructor(value) { this.value = value }
}

var globalInMemoryObjectCache = InMemoryObjectCache