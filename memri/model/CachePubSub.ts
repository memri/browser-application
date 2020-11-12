//
// CachePubSub.swift
// Copyright © 2020 memri. All rights reserved.

import {debugHistory} from "../../router";
import {CacheMemri} from "../../router";
import {Datasource} from "../../router";
import {getItem} from "../../router";

export class ItemSubscription {
    subscriber: SubscriberType
    item: Data
    cache: CacheMemri
    event: ItemChange
    wait: Double

    constructor(
        cache: CacheMemri,
        subscriber: SubscriberType,
        item: Data,
        event: ItemChange,
        wait: number
    ) {
        this.subscriber = subscriber
        this.item = item
        this.cache = cache
        this.event = event
        this.wait = wait

        //DispatchQueue.global(qos: .background).async {
            this.listen()
        //}
    }

    waitListen(retries: number = 0, error?) {
        //DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + wait) {
            this.listen(retries, error)
        //}
    }

    listen(retries: number = 0, error?) {
        if (this.subscriber == undefined) {
            return;
        }

        let uid = this.item.uid;
        if (!uid) {
            debugHistory.error("Exception: Cannot subscribe to changes of an item without a uid")
            return
        }

        if (this.item.deleted) {
            debugHistory.error("Exception: Cannot subscribe to changes of a deleted item")
            return
        }

        if (this.event == ItemChange.create) {
            debugHistory.error("Exception: Item is already created, cannot listen for create event")
            return
        }

        if (retries >= 20) {
            debugHistory.warn(`Stopped polling after 20 retries with error: ${error ?? ""}`)
            return
        }

        this.cache.isOnRemote(this.item, (error) => {

            if (error != undefined) {
                // How to handle??
                //TODO: Look at this when implementing syncing")
                debugHistory.error("Polling timeout. All polling services disabled")
                return
            }

            this.cache.podAPI.get(uid, (error, item) => {
                if (error) {
                    this.waitListen(retries + 1, error)
                    return
                }
                else if (item) {
                    try {
                        if (item.version > this.item.version) {
                            let cachedItem = CacheMemri.addToCache(item);
                            if (cachedItem) {
                                if (this.event == ItemChange.update && cachedItem.deleted) { return }
                                if (this.event == ItemChange.update && !cachedItem.deleted) { return } //TODO: hmm?
                                this.subscriber?.receive(cachedItem)
                            }
                            else {
                                throw "Exception: Could not parse item"
                            }
                        }
                    }
                    catch {
                        this.waitListen(retries + 1, error)
                        return
                    }
                }

                this.waitListen()
            })
        })
    }

    request() {
        // We do nothing here as we only want to send events when they occur.
        // See, for more info: https://developer.apple.com/documentation/combine/subscribers/demand
    }

    cancel() {
        this.subscriber = undefined
    }
}

export class ItemPublisher {
    //typealias Output = Data
    //typealias Failure = Never

    item: Data
    itemEvents: ItemChange
    cache: CacheMemri
    wait: number

    constructor(cache: CacheMemri, item: Data, events: ItemChange, wait: number) {
        this.item = item
        this.itemEvents = events
        this.cache = cache
        this.wait = wait
    }

    receive<S>(subscriber: S) {
        // TODO:
        let subscription = new ItemSubscription(
            this.cache,
            subscriber,
            this.item,
            this.itemEvents,
            this.wait
        )
        subscriber.receive(subscription)
    }
}

export class QuerySubscription {
    subscriber: SubscriberType
    query: string
    cache: CacheMemri
    event: ItemChange
    wait: Double

    constructor(
        cache: CacheMemri,
        subscriber: SubscriberType,
        query: string,
        event: ItemChange,
        wait: number
    ) {
        this.subscriber = subscriber
        this.query = query
        this.cache = cache
        this.event = event
        this.wait = wait

        //DispatchQueue.global(qos: .background).async {
            this.listen();
        //}
    }

    waitListen(retries: number = 0, error?) {
        //DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + wait) {
            this.listen(retries, error)
        //}
    }

    listen(retries: number = 0, error?) {
        if (this.subscriber == undefined) {
            return;
        }

        if (this.query == ""){
            debugHistory.error("Unable to start polling: Empty query")
            return
        }

        if (this.event == ItemChange.create) {
            debugHistory.error("Exception: Item is already created, cannot listen for create event")
            return
        }

        if (retries >= 20) {
            debugHistory.warn(`Stopped polling after 20 retries with error: ${error ?? ""}`)
            return
        }

        this.cache.podAPI.query(new Datasource(this.query), false, (error, items) => {
            if (error) {
                this.waitListen(retries + 1, error)
                return
            }
            else if (items) {
                try {
                    var changes = [];
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i]
                        let uid = item.uid;
                        if (uid) {
                            let cachedItem = getItem(item.genericType, uid)
                            if (cachedItem) {
                                if (item.version > cachedItem.version) {
                                    if (this.event == ItemChange.delete && !item.deleted) { continue }
                                    else if (this.event == ItemChange.create) { continue }
                                }
                                else {
                                    continue
                                }
                            }
                            else { // Create
                                if (this.event == ItemChange.update) { continue }
                                if (this.event == ItemChange.create) { continue }
                            }

                            cachedItem = CacheMemri.addToCache(items[i])
                            changes.push(cachedItem)
                        }
                    }

                    if (changes.length > 0) {
                        this.subscriber?.receive(changes)
                    }
                }
                catch {
                    this.waitListen(retries + 1, error)
                    return
                }
            }

            //DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + self.wait) {
                this.waitListen()
            //}
        })
    }

    request() {
        // We do nothing here as we only want to send events when they occur.
        // See, for more info: https://developer.apple.com/documentation/combine/subscribers/demand
    }

    cancel() {
        this.subscriber = undefined
    }
}

export class QueryPublisher {
    //typealias Output = [Item]
    //typealias Failure = Never

    query: string
    itemEvents: ItemChange
    cache: CacheMemri
    wait: number

    constructor(cache: CacheMemri, query: string, events: ItemChange, wait: number) {
        this.query = query
        this.itemEvents = events
        this.cache = cache
        this.wait = wait
    }

    receive<S>(subscriber: S) {
        // TODO:
        let subscription = new QuerySubscription(
            this.cache,
            subscriber,
            this.query,
            this.itemEvents,
            this.wait
        )
        subscriber.receive(subscription)
    }
}

enum ItemChange {
    create,
    update,
    delete,
    all
}

Object.assign(CacheMemri.prototype, {
    isOnRemote(item: Item, retries = 0, callback) {
        if (retries > 20) {
            callback("Maximum retries reached")
            return
        }

        if (item._action == "create") {
            this.sync.schedule()

            //DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                this.isOnRemote(item, retries + 1, callback)
            //}
            return
        }

        callback(null)
    },
    subscribe(query: string | Item, listener, events: ItemChange = ItemChange.all, wait: number = 0.5) {
        if (typeof query == "string") {
            new QueryPublisher(this, query, events, wait, listener);
        } else {
            new ItemPublisher(this, query, events, wait, listener);
        }
    }

});
