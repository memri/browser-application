//
// MemriButton.swift
// Copyright © 2020 memri. All rights reserved.

import {EmptyView, font, Group, HStack, MainUI, MemriText, padding} from "../swiftUI";
import * as React from "react";
import {backgroundColor, foregroundColor, ItemFamily, me} from "../../model/schemaExtensions/Item";
import {Font, Color} from "../../cvu/parsers/cvu-parser/CVUParser";
require("../../extension/common/string");

export class MemriButton extends MainUI {
    context: MemriContext

    item: Item
    edge: Edge

    render() {
        this.context = this.props.context;
        this.item = this.props.item
        this.edge = this.props.edge

        var inputItem = this.item
        if (this.edge != undefined) {
            inputItem = this.edge?.target()
        }

        let family = ItemFamily[inputItem?.genericType ?? "Note"]



        var type = this.edge?.type?.capitalizingFirst() ?? (inputItem?.objectSchema.properties["itemType"] == undefined
            ? inputItem?.genericType
            : inputItem?.getString("itemType"))
        if (type == "") { type = inputItem?.genericType }

        var title = inputItem?.computedTitle ?? ""
        var bgColor = backgroundColor(family) ?? new Color("white").toLowerCase()
        if (inputItem?.genericType == "Person" && inputItem == me()) {
            title = "Me"
            bgColor = new Color("#e8ba32").toLowerCase()
        }

        return (
            <Group>
                {inputItem == undefined
                    ? <EmptyView/>
                    //            else if isMe {
                    //                HStack(spacing: 0) {
                    //                    Text("Me")
                    //                        .padding(.leading, 6)
                    //                        .padding(.trailing, 6)
                    //                        .padding(.vertical, 3)
                    //                        .foregroundColor(Color.white)
                    //                        .font(.system(size: 14, weight: .semibold))
                    //                        .zIndex(10)
                    //                }
                    //                .background(Color(hex:"#b3b3b3"))
                    //                .cornerRadius(20)
                    //                .compositingGroup()
                    //                //        .fixedSize(horizontal: false, vertical: true)
                    //            }
                    : <HStack spacing={0} background={bgColor} cornerRadius={20} compositingGroup>
                        <MemriText padding={padding({trailing: 8, leading: 8, vertical: 3})}
                                   background="#afafaf" foregroundColor="#fff"
                                   font={font({family: "system", size: 14, weight: Font.Weight.semibold})} cornerRadius={20}
                                   compositingGroup>
                            {type ?? ""}
                        </MemriText>
                        <MemriText padding={padding({trailing: 9, leading: 5, vertical: 3})}
                                   foregroundColor={foregroundColor(family) ?? new Color("white")}
                                   font={font({family: "system", size: 14, weight: Font.Weight.semibold})} zIndex={10}
                        >
                            {title}
                        </MemriText>
                    </HStack>
                }
            </Group>
        )
    }

}

/*
struct memriButton_Previews: PreviewProvider {
    static var previews: some View {
        MemriButton(item: Note(value: ["title": "Untitled Note"]))
    }
}
*/
