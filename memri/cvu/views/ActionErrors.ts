//
//  ActionErrors.swift
//  Copyright © 2020 memri. All rights reserved.

class Error {
    messages: "";
    type = "Error";

    constructor(messages) {
        this.messages = messages;
    }
}

class Warning {
    message: "";
    type = "Warning";

    constructor(message) {
        this.message = message;
    }
}

class Info {
    message: "";
    type = "Info";

    constructor(message) {
        this.message = message;
    }
}


export const ActionError = {
    Error,
    Warning,
    Info,
};