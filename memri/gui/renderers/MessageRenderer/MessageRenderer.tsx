//
// MessageRenderer.swift
// Copyright © 2020 memri. All rights reserved.

import {
    ASTableView,
    font,
    HStack,
    MemriDivider, MemriImage, MemriRealButton, MemriText,
    padding,
    RenderersMemri, Spacer,
    VStack
} from "../../swiftUI";
import {CVUColor, ViewArguments} from "../../../../router";
import * as React from "react";
import {ListItem} from "@material-ui/core";
import {Color} from "../../../../router";
import {CascadingRendererConfig} from "../../../../router";
import {MemriFittedTextEditor} from "../../components/Text/MemriFittedTextEditor/MemriFittedTextEditor";

export class MessageRendererController {
    static rendererType = {name:"messages",icon: "message", makeController: MessageRendererController, makeConfig: MessageRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new MessageRendererConfig()
    }

    context: MemriContext
    config: MessageRendererConfig

    makeView() {
        return <MessageRendererView controller={this} context={this.context}/>
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new MessageRendererConfig(head, tail, host)
    }

    view(item: Item) {
        return this.config.render(item)
    }

    resolveExpression(expression: Expression, dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem);
        return expression?.execForReturnType(args)
    }

    get editMode() {
        return this.context.editMode
    }

    /*func onSelectSingle(_ index: Int) {
    guard let selectedItem = self.context.items[safe: index],
    let press = self.config.press
    else { return }
self.context.executeAction(press, with: selectedItem)
}*/ //TODO: we have this in parent class
    composedMessage

    onPressSend() {
        //#warning("@Ruben: we will need to decide how `sending` a message is handled")
        console.log(this.composedMessage ?? "Empty message")
        // Handle message here

        // Clear composer state
        this.composedMessage = undefined;
    }

    get canSend() {
        return !(/^\s*$/.test(this.composedMessage) ?? true)
    }
}

export class MessageRendererConfig extends CascadingRendererConfig {

    get press() {
        return this.cascadeProperty("press")
    }

    get isOutgoing(): Expression {
        return this.cascadeProperty("isOutgoing");
    }
}

export class MessageRendererView extends RenderersMemri {
    context: MemriContext
    controller: MessageRendererController

    scrollPosition: ASTableViewScrollPosition/* = .bottom*/

    get section() {
        let items = this.controller.context.items;
        return items.map((item, index) => {
            return <VStack key={item.uid} onClick={
                this.executeAction(item)
            } padding={padding({
                top: (index == 0) ? 0 : this.controller.config.spacing / 2,
                leading: this.controller.config.edgeInset.left,
                bottom: (index == items.length - 1) ? 0 : this.controller.config.spacing / 2,
                trailing: this.controller.config.edgeInset.right,
            })}>
                {this.controller.view(item)}
            </VStack>
        })
            //TODO: selectionMode?

    }

    render() {
        this.context = this.props.context;
        this.controller = this.props.controller;

        return (
            <div id={"MessageRendererView"} style={{height: "100%"}}>
            <VStack spacing={0} height={"100%"}>
                {this.controller.context.items.length == 0 ?
                    <>
                        <MemriText foregroundColor={new Color("secondary").toLowerCase()} padding={padding("default")}>
                            No messages yet
                        </MemriText>
                        <Spacer/>
                    </> :
                    <>
                        <ASTableView editMode={this.controller.editMode} separatorsEnabled={false} alwaysBounce
                                     background={this.controller.config.backgroundColor ?? new Color("systemBackground")}
                                     spacing={this.controller.config.spacing}
                                     contentInsets={padding({
                                         top: this.controller.config.edgeInset.top,
                                         left: 0,
                                         bottom: this.controller.config.edgeInset.bottom,
                                         right: 0
                                     })} context={this.context}>
                            {this.section}
                        </ASTableView>
                        <MemriDivider/>
                    </>
                }
                {this.messageComposer}
            </VStack>
            </div>
        )
        /*
        .scrollPositionSetter($scrollPosition)
            .alwaysBounce()

                .edgesIgnoringSafeArea(.all)
         */
    }

    isEditingComposedMessage: boolean = false

    get messageComposer() {
        return (
            <HStack id={"MessageComposer"} spacing={6} padding={padding({
                vertical: 5,
                leading: Math.min(Math.max(this.controller.config.edgeInset.left, 5), 15),
                trailing: Math.min(Math.max(this.controller.config.edgeInset.right, 5), 15),
            })} background={new Color("secondarySystemBackground")}>
                <MemriFittedTextEditor contentBinding={this.controller.composedMessage} placeholder="Type a message..."
                                       backgroundColor={CVUColor.system("systemBackground")}
                                       isEditing={{/*$isEditingComposedMessage*/}}/>

                <MemriRealButton action={this.onPressSend}>
                    <MemriImage foregroundColor={this.controller.canSend ? "blue" : new Color("systemFill")}
                                font={font({family: "system", size: 20})}>
                        {/*arrow.up.circle.fill*/}send
                    </MemriImage>
                </MemriRealButton>{/*.disabled(!canSend)*/}

            </HStack>
        )
    }

    onPressSend() {
        this.controller.onPressSend()
        this.isEditingComposedMessage = false
    }
}
