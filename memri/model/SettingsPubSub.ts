//
// SettingsPubSub.swift
// Copyright © 2020 memri. All rights reserved.

import {debugHistory, UUID} from "../../router";
import {Settings} from "../../router";

export class SettingSubscription {
    id = UUID()
    subscriber: SubscriberType
    path: string
    settings: Settings

    constructor(settings: Settings, subscriber: SubscriberType, path: string) {
        this.subscriber = subscriber
        this.path = path
        this.settings = settings

        try {
            this.settings.addListener(path, this.id, (value)=> {
                subscriber.receive(value)
            })
        }
        catch (error) {
            debugHistory.warn(`Unable to set listener for setting: ${path} : ${error}`)
        }
    }

    request() {
        // We do nothing here as we only want to send events when they occur.
        // See, for more info: https://developer.apple.com/documentation/combine/subscribers/demand
    }

    cancel() {
        this.settings.removeListener(this.path, this.id)
        this.subscriber = undefined;
    }
}

export class SettingPublisher {
    //typealias Output = Any?
    //typealias Failure = Never

    path: string
    settings: Settings

    //type: Type

    constructor(settings: Settings, path: string) {
        this.path = path
        this.settings = settings
        //self.type = type
    }

    receive<S>(subscriber: S) {
        // TODO:
        let subscription = new SettingSubscription(
            this.settings,
            subscriber,
            this.path
        )
        subscriber.receive(subscription)
    }
}

Object.assign(Settings.prototype, {
    subscribe(path: string, listener) {
        new SettingPublisher(this, path, listener);
    }
});