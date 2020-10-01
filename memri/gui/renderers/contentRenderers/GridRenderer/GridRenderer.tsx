//
// ThumbnailRendererView.swift
// Copyright © 2020 memri. All rights reserved.

import {
    ASCollectionView,
    font,
    HStack,
    MemriText,
    padding,
    RenderersMemri,
    Spacer,
    VStack,
    ZStack
} from "../../../swiftUI";
import * as React from "react";
import {Alignment, Color, Font} from "../../../../../router";
import {Grid} from "@material-ui/core";
import {CascadingRendererConfig} from "../../../../../router";

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

    get selectedIndices() {
        /*Binding<Set<Int>>(
            get: { [] },
            set: {
                self.context.cascadingView?.userState?
                    .set("selection", $0.compactMap { self.context.items[safe: $0] })
            }
        )*/ //TODO:
        return
    }

    get hasItems() {
        return this.context.items.length != 0
    }

    get items() {
        return this.context.items
    }

    get isEditing() {
        return this.context.currentSession?.editMode ?? false
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
    set columns(value) { this.setState("columns", value) }

}

export class GridRendererView extends RenderersMemri {
    controller: GridRendererController

    /*get layout() {
        return (
            <ASCollectionLayout scrollDirection={"vertical"} interSectionSpacing={0}>

            </ASCollectionLayout>
        )
        ASCollectionLayout(scrollDirection: .vertical, interSectionSpacing: 0) {
            ASCollectionLayoutSection { environment in
                let contentInsets = self.controller.config.nsEdgeInset ?? .init()
                let numberOfColumns = self.controller.config.columns
                let xSpacing = self.controller.config.spacing.width
                let estimatedGridBlockSize = (environment.container.effectiveContentSize
                    .width - contentInsets.leading - contentInsets
                    .trailing - xSpacing * (CGFloat(numberOfColumns) - 1)) /
                    CGFloat(numberOfColumns)

                let item = NSCollectionLayoutItem(
                    layoutSize: NSCollectionLayoutSize(
                        widthDimension: .fractionalWidth(1.0),
                        heightDimension: .estimated(estimatedGridBlockSize)
                    )
                )

                let itemsGroup = NSCollectionLayoutGroup.horizontal(
                    layoutSize: NSCollectionLayoutSize(
                        widthDimension: .fractionalWidth(1.0),
                        heightDimension: .estimated(estimatedGridBlockSize)
                    ),
                    subitem: item, count: numberOfColumns
                )
                itemsGroup.interItemSpacing = .fixed(xSpacing)

                let section = NSCollectionLayoutSection(group: itemsGroup)
                section.interGroupSpacing = self.controller.config.spacing.height
                section.contentInsets = contentInsets
                return section
            }
        }
    }*/

    get section() {
        let items = this.controller.items;
        return items.map((dataItem) => {
            return <Grid item key={dataItem.uid} xs={12/this.controller.config.columns} onClick={
                this.executeAction(dataItem)
            }>
                <ZStack alignment={Alignment.bottomTrailing}>
                    {this.controller.view(dataItem)}
                </ZStack>

            </Grid>
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

    render() {
        this.context = this.props.context;
        this.controller = this.props.controller;

        return (
            <VStack>
                {this.controller.hasItems
                    ?
                    <ASCollectionView editMode={this.controller.isEditing} alwaysBounceVertical={true}
                                      background={this.controller.config.backgroundColor?.color ?? new Color("systemBackground")}>
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
