//
//  EmailHeaderView.swift
//  memri
//
//  Created by Toby Brennan on 30/7/20.
//  Copyright © 2020 memri. All rights reserved.
//


import {Circle, font, HStack, MainUI, MemriText, padding, Spacer, VStack} from "../../swiftUI";
import * as React from "react";
import {Alignment, Color} from "../../../../router";

export class EmailHeaderView extends MainUI {
    senderName: string
    recipientList
    dateString
    color
    
    get senderInitials(): string { //TODO:
        return this.senderName.split(" ").slice(0, 2).map((el)=>el[0]).join("").toUpperCase(); /*.prefix(2).compactMap{$0.first.map(String.init)?.capitalized}.joined()*/
    }

    render() {
        this.senderName = this.props.senderName;
        this.recipientList = this.props.recipientList;
        this.dateString = this.props.dateString;
        this.color = this.props.color;
        return (
            <HStack>
                <Circle fill={this.color?.value ?? "blue"}
                        frame={50} aspectRatio={""/*1, contentMode: .fit*/}>
                    <MemriText foregroundColor={"white"}>{this.senderInitials}</MemriText>
                </Circle>
                <VStack alignment={Alignment.leading} spacing={4}>
                    <HStack>
                        <MemriText>
                            {this.senderName}
                            <MemriText foregroundColor={new Color("secondaryLabel")} font={font({family:"caption"})}>
                                {this.dateString}
                            </MemriText>
                        </MemriText>
                        <Spacer/>
                    </HStack>
                    <HStack>
                        <MemriText foregroundColor={new Color("secondaryLabel")} font={font({family:"caption"})}>
                            {this.recipientList}
                        </MemriText>
                        <Spacer/>
                    </HStack>
                </VStack>
            </HStack>
        )
    }
}
