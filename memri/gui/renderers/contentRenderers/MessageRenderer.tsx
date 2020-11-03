//
// MessageRenderer.swift
// Copyright © 2020 memri. All rights reserved.

import {
    ASTableView,
    font,
    HStack,
    MemriDivider, MemriImage, MemriRealButton,
    padding,
    RenderersMemri,
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
        return new MessageRendererView({controller: this, context: this.context}).render();
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
        return items.map((item) => {
            return <ListItem key={item.uid} onClick={
                this.executeAction(item)
            }>
                {this.controller.view(item)}
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
        this.controller = this.props.controller;

        return (
            <VStack spacing={0}>
                <ASTableView editMode={this.controller.editMode} separatorsEnabled={false} alwaysBounce
                             background={this.controller.config.backgroundColor?.color ?? new Color("systemBackground")}>
                    {this.section}
                </ASTableView>
                <MemriDivider/>
                {this.messageComposer}
            </VStack>
        )
        /*
        .scrollPositionSetter($scrollPosition)
            .alwaysBounce()
                .contentInsets(.init(top: renderConfig.edgeInset.top, left: 0, bottom: renderConfig.edgeInset.bottom, right: 0))
                .edgesIgnoringSafeArea(.all)
         */
    }

    isEditingComposedMessage: boolean = false

    get messageComposer() {
        /*
        .padding(.leading, min(max(self.renderConfig.edgeInset.left, 5), 15)) // Follow user-defined insets where within a reasonable range
        .padding(.trailing, min(max(self.renderConfig.edgeInset.right, 5), 15)) // Follow user-defined insets where within a reasonable range
        */
        return (
            <HStack spacing={6} padding={padding({vertical: 5})} background={new Color("secondarySystemBackground")}>
                <MemriFittedTextEditor contentBinding={this.controller.composedMessage} placeholder="Type a message..." backgroundColor={CVUColor.system("systemBackground")} isEditing={{/*$isEditingComposedMessage*/}}/>

                <MemriRealButton action={this.onPressSend}>
                    <MemriImage foregroundColor={this.controller.canSend ? "blue" : new Color("systemFill")} font={font({family:"system", size: 20})}>
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
