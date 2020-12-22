//
// ThumbnailRendererView.swift
// Copyright © 2020 memri. All rights reserved.

import {
    ASCollectionView, ASCollectionViewSection, Circle,
    font, frame,
    HStack, MemriImage,
    MemriText,
    padding,
    RenderersMemri,
    Spacer,
    VStack,
    ZStack
} from "../../swiftUI";
import * as React from "react";
import {Alignment, Color, Font} from "../../../../router";
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
        return <ASCollectionViewSection editMode={this.controller.isEditing}
                                        selectionMode={this.selectionMode}
                                        selectedIndices={this.controller.context.selectedIndicesBinding}
                                        data={this.controller.items}
                                        dataID={"uid"}
                                        callback={(dataItem, index) => {
                                            let isSelected = this.controller.context.selectedIndicesBinding.includes(index);
                                            return <ZStack alignment={Alignment.bottomTrailing}>
                                                <div
                                                    style={{opacity: this.controller.isEditing && !isSelected ? 0.85 : 1}}>{this.controller.view(dataItem)}</div>
                                                {isSelected &&
                                                <ZStack frame={frame({width: 30, height: 30})} padding={padding(10)} top={-50} float={"right"}>
                                                    <Circle fill={Color.named("blue")} frame={frame({width: 30, height: 30})} border={"1px solid white"}>
                                                        <MemriImage font={font({
                                                            family: "system",
                                                            size: 15,
                                                            weight: Font.Weight.bold
                                                        })} foregroundColor={"white"}>
                                                            checkmark
                                                        </MemriImage>
                                                    </Circle>
                                                </ZStack>
                                                }
                                            </ZStack>
                                        }
                                        }
                                        contextMenuProvider={this.contextMenuProvider}
                                        context={this.context}
                                        contentInsets={padding(this.controller.config.nsEdgeInset)}

        />
    }


    selectionMode(dataItem) {
        if (this.controller.isEditing) {
            return this.selectedIndicesBinding
        } else {
            return this.executeAction(dataItem)
        }
    }
    selectionMode = this.selectionMode.bind(this)

    render() {
        this.context = this.props.context;
        this.controller = this.props.controller;

        return (
            <VStack>
                {this.controller.hasItems
                    ?
                    <ASCollectionView editMode={this.controller.isEditing}
                                      alwaysBounceVertical={this.scrollDirection == "vertical"}
                                      alwaysBounceHorizontal={this.scrollDirection == "horizontal"}
                                      background={this.controller.config.backgroundColor ?? new Color("systemBackground")}
                                      flexWrap={"wrap"} columns={this.controller.config.columns}>
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
