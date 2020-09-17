//
//  Colors.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


import {Color} from "../parsers/cvu-parser/CVUParser";

export class Colors {
    byName(name) {
        return new Color("#ff0000")
    }
}
export var globalColors = new Colors()
