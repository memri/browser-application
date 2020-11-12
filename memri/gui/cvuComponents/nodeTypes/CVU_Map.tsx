//
//  CVU_Map.swift
//  memri
//
//  Created by Toby Brennan on 13/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVU_UI, MainUI, MemriImage} from "../../swiftUI";
import * as React from "react";
import {Color} from "../valueTypes/CVUColor";

export class CVU_Map extends CVU_UI {
    
    get content() {
        return this.nodeResolver.string("text")?.nilIfBlank
    }
    
    get locationResolver() {return () => {
        return this.nodeResolver.resolve("location", Location)
            ??
            this.nodeResolver.resolve("location")
    }}
    get addressResolver() {return () => {
        return this.nodeResolver.resolve("address", Address)
            ??
            this.nodeResolver.resolve("address")
    }}
    
    get labelResolver() {return () => {
        return this.nodeResolver.resolve("label")
    }}
    
    get config(): MapViewConfig {
        return new MapViewConfig({dataItems: nodeResolver.item.map(($0) => [$0]) ?? [],
            locationResolver: this.locationResolver,
            addressResolver: this.addressResolver,
            labelResolver: this.labelResolver,
            moveable: this.nodeResolver.resolve("moveable") ?? true
        })
    }
    
    render() { //TODO: need Map component
        return (
            <MemriImage className={"MapView"} title={"Place for your future map"}>map</MemriImage>
        )
        /*return (
            <MapView config={this.config} background={new Color("secondarySystemBackground").toLowerCase()} {...this.props}/>
        )*/
    }
}
