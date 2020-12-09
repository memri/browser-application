//
//  CVU_EditorSection.swift
//  memri
//
//  Created by Toby Brennan on 30/9/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {CVU_UI, EmptyView, frame, MainUI, MemriText, padding, Section, VStack} from "../../swiftUI";
import * as React from "react";
import {Alignment} from "../valueTypes/CVUFont";

export class CVU_EditorSection extends CVU_UI {
    get header() {
        let title = this.nodeResolver.string("title")
        if (title) {
            return <MemriText>{title}</MemriText>
        } else {
            return <EmptyView/>
        }
    }
    
    render() {
        return (
            <Section header={this.header} {...this.props}>
                {this.nodeResolver.childrenInForEach(this.context)}
            </Section>
        )
    }
}

export class CVU_EditorRow extends CVU_UI {
    header(props) {
        let title = this.nodeResolver.string("title")
        if (title) {
            return <MemriText {...props} font={"bold"}>{title}</MemriText>
        } else {
            return <EmptyView {...props}/>
        }
    }
    
    get content() {
        return this.nodeResolver.childrenInForEach(this.context)
    }
    
    render() {
        return (
            <VStack alignment={Alignment.leading} spacing={0} frame={frame({maxWidth: "infinity", alignment: this.nodeResolver.alignment()})}
                    padding={this.nodeResolver.bool("nopadding", false) && padding({horizontal: 0})} {...this.props}
            >
                {this.header({padding: padding({vertical: 4})})}
                {this.content}
            </VStack>
        )
    }
}

export class CVU_EditorLabel extends CVU_UI {

    header(props) {
        let title = this.nodeResolver.string("title")
        if (title) {
            return <MemriText {...props} font={"bold"}>{title}</MemriText>
        } else {
            return <EmptyView {...props}/>
        }
    }
    
    get content() {
        return this.nodeResolver.childrenInForEach(this.context)
    }
    
    render() {
        return (
            <VStack alignment={Alignment.leading} spacing={0} frame={frame({maxWidth: "infinity", alignment: this.nodeResolver.alignment()})}
                    padding={this.nodeResolver.bool("nopadding", false) && padding({horizontal: 0})} {...this.props}
            >
                {this.header({padding: padding({vertical: 4})})}
                {this.content}
            </VStack>
        )
    }
}