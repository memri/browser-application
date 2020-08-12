//
// MemriButton.swift
// Copyright © 2020 memri. All rights reserved.

import {font, HStack, MainUI, MemriText, padding} from "../swiftUI";
import * as React from "react";
import {backgroundColor, foregroundColor, ItemFamily} from "../../model/items/Item";
import {Font, Color} from "../../parsers/cvu-parser/CVUParser";

export class MemriButton extends MainUI {
    context: MemriContext

    item: Item

    render() {
        this.context = this.props.context;
        this.item = this.props.item

        // NOTE: Allowed force unwrap
        let family = ItemFamily[this.item.genericType]
        var type = this.item["type"] == undefined ? this.item.genericType : this.item.getString("type")
        if (type == "") { type = this.item.genericType }
        return (
            <HStack spacing={0} background={backgroundColor(family) ?? new Color("white")} cornerRadius={20} compositingGroup>
                <MemriText padding={padding({trailing: 8, leading: 8, vertical: 3})}
                           background="#afafaf" foregroundColor="#fff"
                           font={font({family: "system", size: 14, weight: Font.Weight.semibold})} cornerRadius={20}
                           compositingGroup>
                    {type }
                </MemriText>
                <MemriText padding={padding({trailing: 9, leading: 5, vertical: 3})}
                           foregroundColor={foregroundColor(family) ?? new Color("white")}
                           font={font({family: "system", size: 14, weight: Font.Weight.semibold})} zIndex={10}
                >
                    {this.item.computedTitle}
                </MemriText>
            </HStack>
        );//.camelCaseToWords().capitalizingFirst()
    }

}

/*
struct memriButton_Previews: PreviewProvider {
    static var previews: some View {
        MemriButton(item: Note(value: ["title": "Untitled Note"]))
    }
}
*/
