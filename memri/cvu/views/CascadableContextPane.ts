//
//  CascadableContextPane.swift
//  Copyright © 2020 memri. All rights reserved.


import {Cascadable} from "../../../router";

export class CascadableContextPane extends Cascadable {
    get buttons(){ return this.cascadeList("buttons") }
    set buttons(value) { this.setState("buttons", value) }

    get actions(){ return this.cascadeList("actions") }
    set actions(value) { this.setState("actions", value) }

    get navigate(){ return this.cascadeList("navigate") }
    set (value) { this.setState("navigate", value) }
}
