//
// TimelineItemView.swift
// Copyright © 2020 memri. All rights reserved.

import {font, HStack, MainUI, MemriImage, MemriText, padding, VStack} from "../../swiftUI";
import * as React from "react";
import {Alignment, Color} from "../../../../router";

export class TimelineItemView extends MainUI {
    icon = <MemriImage>"paperplane"</MemriImage>
    title: string = "Hello world"
    subtitle: string
    cornerRadius: CGFloat = 5

    backgroundColor = Color.named("systemGreen")
    get foregroundColor(): string {
        return Color.named("white");
    }

    render(){
        this.icon = this.props.icon ?? this.icon;
        this.title = this.props.title ?? this.title;
        this.subtitle = this.props.subtitle;
        this.cornerRadius = (this.props.cornerRadius && this.props.cornerRadius != 0) ? this.props.cornerRadius : this.cornerRadius;
        this.backgroundColor = this.props.backgroundColor ?? this.backgroundColor;
        let onclick = (this.props.onClick) ? this.props.onClick : () => {
            let press = this.props.context.currentRendererController.config.press
            let item = this.props.item;

            if (press && item) {
                this.props.context.executeAction(press, item)
            }
        }
//alignment={"lastTextBaseline"}
        return (
            <VStack alignment={Alignment.leading} fixedSize={{horizontal: false, vertical: true}} padding={padding(5)}
                    foregroundColor={this.foregroundColor} background={this.backgroundColor}
                    cornerRadius={this.cornerRadius}
                    mask={"RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)"} onClick={onclick}>
                <HStack font={font({family: "headline"})}>
                    {this.icon}
                    <MemriText bold lineLimit={1}>
                        {this.title}
                    </MemriText>
                </HStack>
                <MemriText font={font({family:"caption"})} lineLimit={2}>
                    {this.subtitle}
                </MemriText>
            </VStack>
        )
    }

}

