//
//  ActionErrors.swift
//  memri
//
//  Created by Koen van der Veen on 25/05/2020.
//  Copyright © 2020 memri. All rights reserved.
//

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