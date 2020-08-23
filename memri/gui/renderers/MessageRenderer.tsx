//
// MessageRenderer.swift
// Copyright © 2020 memri. All rights reserved.

import {allRenderers, CascadingMessageRendererConfig} from "../../cvu/views/Renderers";
import {ASTableView, font, frame, HStack, MainUI, MemriText, padding, RenderersMemri, VStack} from "../swiftUI";
import {ViewArguments} from "../../cvu/views/CascadableDict";
import * as React from "react";
import {ListItem} from "@material-ui/core";
import {Alignment, Color, Font, TextAlignment} from "../../parsers/cvu-parser/CVUParser";

export var registerMessageRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "messages",
            "Messages",
            0,
            "message",
            new MessageRenderer(),
            CascadingMessageRendererConfig,
            function(items) { return items[0].genericType == "Message" || items[0].genericType == "Note" }
        )
    }
}


export class MessageRenderer extends RenderersMemri {
    context: MemriContext

    get renderConfig(): CascadingMessageRendererConfig {
        return this.context.currentView?.renderConfig ?? new CascadingMessageRendererConfig()
    }

    resolveExpression(
        expression: Expression,
        _,
        dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem)
        return expression?.execForReturnType(args);
    }

    /*var selectedItems: Binding<Set<Int>> {
        Binding<Set<Int>>(
            get: { [] },
            set: {
                self.context.setSelection($0.compactMap { self.context.items[safe: $0] })
            }
        )
    }*/

    /*@State var scrollPosition: ASTableViewScrollPosition? = .bottom
    var editMode: Bool {
        context.currentSession?.editMode ?? false
    }*/

    /*var section: ASSection<Int> {
        ASSection<Int>(id: 0, data: context.items, selectedItems: selectedItems) { item, _ in
            self.renderConfig.render(item: item)
                .environmentObject(self.context)
        }
        .onSelectSingle { index in
            guard let selectedItem = self.context.items[safe: index],
                let press = self.renderConfig.press
            else { return }
            self.context.executeAction(press, with: selectedItem)
        }
    }*/

    get section() {
        let items = this.context.items;
        return items.map((dataItem) => {
            return <ListItem key={dataItem.uid} onClick={
                this.executeAction(dataItem)
            }>
                {this.renderConfig.render(dataItem)}
            </ListItem>
        })
        /* TODO: here should be padding, but i have no idea which :)
        padding(EdgeInsets(top: cellContext.isFirstInSection ? 0 : self.renderConfig.spacing.height / 2,
									leading: self.renderConfig.edgeInset.left,
									bottom: cellContext.isLastInSection ? 0 : self.renderConfig.spacing.height / 2,
									trailing: self.renderConfig.edgeInset.right))
        */
    }

    render() {
        this.context = this.props.context;
        this.editMode = this.props.editMode;

        return (
            <VStack spacing={0}>
                <ASTableView editMode={this.editMode} separatorsEnabled={false} alwaysBounce>
                    {this.section}
                </ASTableView>
            </VStack>
        )
        /*
        .scrollPositionSetter($scrollPosition)
            .alwaysBounce()
            .contentInsets(.init(top: 5, left: 0, bottom: 5, right: 0))
            .edgesIgnoringSafeArea(.all)
         */
}
}

export class MessageBubbleView extends MainUI {
    timestamp?: Date
    sender?: string
    content: string
    outgoing: boolean

    /*dateFormatter: DateFormatter {
        // TODO: If there is a user setting for a *short* date format, we should use that
        let format = DateFormatter()
        format.dateStyle = .short
        format.timeStyle = .short
        format.doesRelativeDateFormatting = true
        return format
    }*/

    render() {
        //this.context = this.props.context;
        this.timestamp = this.props.timestamp;
        this.sender = this.props.sender;
        this.content = this.props.content;
        this.outgoing = this.props.outgoing;

        return (
          <HStack padding={padding({vertical:4, horizontal: 10})} frame={frame({maxWidth: ".infinity", alignment: this.outgoing ? Alignment.trailing : Alignment.leading})}>
              <VStack alignment={Alignment.leading} spacing={2}>
                  {(!this.outgoing) &&
                      <MemriText lineLimit={1} font={font({weight: Font.Weight.bold})}>
                          {this.sender}
                      </MemriText>
                  }
                  <MemriText lineLimit={1} font={font({family:"caption"})} foregroundColor={new Color("secondaryLabel")}>
                      {this.timestamp}
                  </MemriText>
                  <MemriText multilineTextAlignment={TextAlignment.leading}
                             fixedSize={{horizontal: false, vertical: true}}
                             padding={padding(10)} foregroundColor={this.outgoing ? "white" : new Color("label")}
                             background={this.outgoing ? "blue" : new Color("secondarySystemBackground")}
                             mask={}
                  >
                      {this.content}
                  </MemriText>
              </VStack>
          </HStack>   //.padding(outgoing ? .leading : .trailing, 20) //TODO?
        )

    }

}

/*
struct MessageRenderer_Previews: PreviewProvider {
    static var previews: some View {
        MessageRenderer()
    }
}
*/
