//
// ThumbnailRendererView.swift
// Copyright © 2020 memri. All rights reserved.

import {
    ASCollectionView,
    font,
    HStack, MemriGrid,
    MemriText,
    padding,
    RenderersMemri,
    Spacer,
    VStack,
    ZStack
} from "../../swiftUI";
import * as React from "react";
import {Alignment, Color, Font} from "../../../../router";
import {Grid} from "@material-ui/core";
import {CascadingRendererConfig} from "../../../../router";

export class GridRendererController {
    static rendererType = {name:"grid",icon: "apps", makeController:GridRendererController, makeConfig:GridRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new GridRendererConfig()
    }

    context: MemriContext
    config: GridRendererConfig

    makeView() {
        return new GridRendererView({controller: this, context: this.context}).render();
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new GridRendererConfig(head, tail, host)
    }

    view(item: Item) {
        return this.config.render(item)
    }

    get hasItems() {
        return this.context.items.length != 0
    }

    get items() {
        return this.context.items
    }

    get isEditing() {
        return this.context.editMode
    }

/*
    func contextMenuProvider(index: Int, item: Item) -> UIContextMenuConfiguration? {
    let children: [UIMenuElement] = config.contextMenuActions.map { [weak context] action in
    UIAction(title: action.getString("title"),
    image: nil) { [weak context] (_) in
    context?.executeAction(action, with: item)
}
}
guard !children.isEmpty else { return nil }
return UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { (suggested) -> UIMenu? in
    return UIMenu(title: "", children: children)
}
}

func onSelectSingleItem(index: Int) {
    if let press = config.press {
        self.context.executeAction(press, with: self.context.items[safe: index])
    }
}*/

}

export class GridRendererConfig extends CascadingRendererConfig {

    get longPress() { return this.cascadeProperty("longPress") }
    set longPress(value) { this.setState("longPress", value) }

    get press() { return this.cascadeProperty("press") }
    set press(value) { this.setState("press", value) }

    get columns() { return this.cascadeProperty("columns") ?? 3 }

    set columns(value) {
        this.setState("columns", value)
    }

    get scrollDirection() {
        switch (this.cascadeProperty("scrollDirection")) {
            case "horizontal":
                return "horizontal"
            case "vertical":
                return "vertical"
            default:
                return "vertical"
        }
    }

}

export class GridRendererView extends RenderersMemri {
    controller: GridRendererController

    get scrollDirection() {
        return this.controller.config.scrollDirection;
    }

    /*get layout() {
        let contentInsets = this.controller.config.nsEdgeInset
        let numberOfColumns = this.controller.config.columns


    }*/

    get section() {
        let items = this.controller.items;
        return items.map((dataItem) => {
            return <MemriGrid xs={12 / this.controller.config.columns} item key={dataItem.uid} onClick={
                this.executeAction(dataItem)
            } contentInsets={padding(this.controller.config.nsEdgeInset)}>
                <ZStack alignment={Alignment.bottomTrailing}>
                    {this.controller.view(dataItem)}
                </ZStack>

            </MemriGrid>
        })
        /*
        if self.controller.isEditing && !state.isSelected {
                    Color.white.opacity(0.15)
                }
                if state.isSelected {
                    ZStack {
                        Circle().fill(Color.blue)
                        Circle().strokeBorder(Color.white, lineWidth: 2)
                        Image(systemName: "checkmark")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .frame(width: 30, height: 30)
                    .padding(10)
                }
         */
    }

    get selectionMode() {
        if (this.controller.isEditing) {
            return //.selectMultiple(controller.context.selectedIndicesBinding)
        } else {
            return //.selectSingle(controller.onSelectSingleItem)
        }
    }

    render() {
        this.context = this.props.context;
        this.controller = this.props.controller;

        return (
            <VStack>
                {this.controller.hasItems
                    ?
                    <ASCollectionView editMode={this.controller.isEditing} alwaysBounceVertical={this.scrollDirection == "vertical"} alwaysBounceHorizontal={this.scrollDirection == "horizontal"}
                                      background={this.controller.config.backgroundColor ?? new Color("systemBackground")}>
                        {this.section}

                    </ASCollectionView>
                    :
                    <>
                        <HStack alignment={Alignment.top} padding={padding({all: 30, top: 40})}>
                            <Spacer/>
                            <MemriText multilineTextAlignment={Alignment.center}
                                       font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
                                       opacity={0.7}
                            >
                                {this.controller.context.currentView?.emptyResultText ?? "No results"}
                            </MemriText>
                            <Spacer/>
                        </HStack>
                        <Spacer/>
                    </>}

            </VStack>

        )
    }
}

/*struct ThumbnailRendererView_Previews: PreviewProvider {
    static var previews: some View {
        ThumbnailRendererView().environmentObject(try! RootContext(name: "", key: "").mockBoot())
    }
}*/
