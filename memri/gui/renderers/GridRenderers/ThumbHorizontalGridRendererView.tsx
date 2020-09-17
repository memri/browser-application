//
// ThumbHorizontalGridRendererView.swift
// Copyright © 2020 memri. All rights reserved.


import {allRenderers, CascadingThumbnailConfig} from "../Renderers";
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
} from "../../swiftUI";
import * as React from "react";
import {Alignment, Color, Font} from "../../../cvu/parsers/cvu-parser/CVUParser";
import {Grid} from "@material-ui/core";

export var registerThumbHorizontalGridRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "thumbnail.horizontalgrid",
            "Horizontal Grid",
            120,
            "square.grid.3x2.fill",
            new ThumbHorizontalGridRendererView(),
            CascadingThumbnailConfig,
            function() { return true }
        )
    }
}

export class ThumbHorizontalGridRendererView extends RenderersMemri {
    name = "thumbnail_horizontalgrid"

    /*var selectedIndices: Binding<Set<Int>> {
        Binding<Set<Int>>(
            get: { [] },
            set: {
                self.context.setSelection($0.compactMap { self.context.items[safe: $0] })
            }
        )
    }*/

    //    @Environment(\.editMode) private var editMode
    //    var isEditing: Bool
    //    {
    //        editMode?.wrappedValue.isEditing ?? false
    //    }

    get renderConfig(): CascadingThumbnailConfig {
        return this.context.currentView?.renderConfig ?? new CascadingThumbnailConfig()
    }

    /*get layout() {
        ASCollectionLayout(scrollDirection: .horizontal, interSectionSpacing: 0) {
            ASCollectionLayoutSection { environment in
                let contentInsets = self.renderConfig.nsEdgeInset
                let numberOfRows = self.renderConfig.columns
                let ySpacing = self.renderConfig.spacing.y
                let calculatedGridBlockSize = (environment.container.effectiveContentSize
                    .height - contentInsets.top - contentInsets
                    .bottom - ySpacing * (CGFloat(numberOfRows) - 1)) / CGFloat(numberOfRows)

                let item = NSCollectionLayoutItem(
                    layoutSize: NSCollectionLayoutSize(
                        widthDimension: .fractionalWidth(1.0),
                        heightDimension: .fractionalHeight(1.0)
                    )
                )

                let itemsGroup = NSCollectionLayoutGroup.vertical(
                    layoutSize: NSCollectionLayoutSize(
                        widthDimension: .absolute(calculatedGridBlockSize),
                        heightDimension: .fractionalHeight(1.0)
                    ),
                    subitem: item, count: numberOfRows
                )
                itemsGroup.interItemSpacing = .fixed(ySpacing)

                let section = NSCollectionLayoutSection(group: itemsGroup)
                section.interGroupSpacing = self.renderConfig.spacing.x
                section.contentInsets = contentInsets
                return section
            }
        }
    }*/

    get section() {
        let items = this.context.items;
        return items.map((dataItem) => {
            return <Grid item key={dataItem.uid} onClick={
                this.executeAction(dataItem)
            }>
                <ZStack alignment={Alignment.bottomTrailing}>
                    {this.renderConfig.render(dataItem)}
                </ZStack>

            </Grid>
        })
    }

    /*func contextMenuProvider(index: Int, item: Item) -> UIContextMenuConfiguration? {
    UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { [weak context] (suggested) -> UIMenu? in
        let children: [UIMenuElement] = self.renderConfig.contextMenuActions.map { [weak context] action in
        UIAction(title: action.getString("title"),
            image: nil) { [weak context] (_) in
        context?.executeAction(action, with: item)
        }
        }
        return UIMenu(title: "", children: children)
    }
}*/

    render() {
        this.context = this.props.context
        return (
            <VStack>
                {this.context.currentView?.resultSet.count == 0
                    ?
                    <>
                        <HStack alignment={Alignment.top}
                                padding={padding({all: 30, top: 40})}
                        >
                            <Spacer/>
                            <MemriText multilineTextAlignment={Alignment.center}
                                       font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
                                       opacity={0.7}>
                                {this.context.currentView?.emptyResultText ?? ""}
                            </MemriText>
                            <Spacer/>
                        </HStack>
                        <Spacer/>
                    </>
                    :
                    <ASCollectionView images={true} background={this.renderConfig.backgroundColor?.color ?? new Color("systemBackground")}>
                        {this.section}
                    </ASCollectionView>
                }

            </VStack>
        )
    }
}

/*struct ThumbGridRendererView_Previews: PreviewProvider {
    static var previews: some View {
        ThumbnailRendererView().environmentObject(try! RootContext(name: "", key: "").mockBoot())
    }
}*/
