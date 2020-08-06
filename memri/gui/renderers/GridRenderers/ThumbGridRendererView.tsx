//
// ThumbGridRendererView.swift
// Copyright © 2020 memri. All rights reserved.

import {allRenderers, CascadingThumbnailConfig} from "../../../cvu/views/Renderers";
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
import {Alignment, Font} from "../../../parsers/cvu-parser/CVUParser";
import * as React from "react";
import {Grid, GridListTile} from "@material-ui/core";

export var registerThumbGridRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "thumbnail.grid",
            "Photo Grid",
            110,
            "apps", //square.grid.3x2.fill
            new ThumbGridRendererView(),
            CascadingThumbnailConfig,
            function() { return true }
        )
    }
}

export class ThumbGridRendererView extends RenderersMemri {
    context: MemriContext

    name: string = "thumbnail_grid"

  /*  var selectedIndices: Binding<Set<Int>> {
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

    /*var layout: ASCollectionLayout<Int> {
        ASCollectionLayout(scrollDirection: .vertical, interSectionSpacing: 0) {
            ASCollectionLayoutSection { environment in
                let contentInset = self.renderConfig.nsEdgeInset
                let columns = 3
                let spacing = self.renderConfig.spacing

                let singleBlockSize = (environment.container.effectiveContentSize
                    .width - contentInset.leading - contentInset.trailing - spacing
                    .x * CGFloat(columns - 1)) / CGFloat(columns)
                func gridBlockSize(forSize size: Int, sizeY: Int? = nil) -> NSCollectionLayoutSize {
                    let x = CGFloat(size) * singleBlockSize + spacing.x * CGFloat(size - 1)
                    let y = CGFloat(sizeY ?? size) * singleBlockSize + spacing
                        .y * CGFloat((sizeY ?? size) - 1)
                    return NSCollectionLayoutSize(
                        widthDimension: .absolute(x),
                        heightDimension: .absolute(y)
                    )
                }
                let itemSize = gridBlockSize(forSize: 1)

                let item = NSCollectionLayoutItem(layoutSize: itemSize)

                let verticalGroupSize = gridBlockSize(forSize: 1, sizeY: 2)
                let verticalGroup = NSCollectionLayoutGroup.vertical(
                    layoutSize: verticalGroupSize,
                    subitem: item,
                    count: 2
                )
                verticalGroup.interItemSpacing = .fixed(spacing.y)

                let featureItemSize = gridBlockSize(forSize: 2)
                let featureItem = NSCollectionLayoutItem(layoutSize: featureItemSize)

                let fullWidthItemSize = gridBlockSize(forSize: 3, sizeY: 1)
                let fullWidthItem = NSCollectionLayoutItem(layoutSize: fullWidthItemSize)

                let verticalAndFeatureGroupSize = gridBlockSize(forSize: 3, sizeY: 2)
                let verticalAndFeatureGroupA = NSCollectionLayoutGroup.horizontal(
                    layoutSize: verticalAndFeatureGroupSize,
                    subitems: [verticalGroup, featureItem]
                )
                verticalAndFeatureGroupA.interItemSpacing = .fixed(spacing.x)
                let verticalAndFeatureGroupB = NSCollectionLayoutGroup.horizontal(
                    layoutSize: verticalAndFeatureGroupSize,
                    subitems: [featureItem, verticalGroup]
                )
                verticalAndFeatureGroupB.interItemSpacing = .fixed(spacing.x)

                let rowGroupSize = gridBlockSize(forSize: 3, sizeY: 1)
                let rowGroup = NSCollectionLayoutGroup.horizontal(
                    layoutSize: rowGroupSize,
                    subitem: item,
                    count: Int(columns)
                )
                rowGroup.interItemSpacing = .fixed(spacing.x)

                let outerGroupSize = gridBlockSize(forSize: 3, sizeY: 7)
                let outerGroup = NSCollectionLayoutGroup.vertical(
                    layoutSize: outerGroupSize,
                    subitems: [
                        verticalAndFeatureGroupA,
                        rowGroup,
                        fullWidthItem,
                        verticalAndFeatureGroupB,
                        rowGroup,
                    ]
                )
                outerGroup.interItemSpacing = .fixed(spacing.y)

                let section = NSCollectionLayoutSection(group: outerGroup)
                section.contentInsets = contentInset
                return section
            }
        }
    }*/

    get section() {
        let items = this.context.items;
        return items.map((dataItem) => {
            return <GridListTile key={dataItem.uid} cols={this.renderConfig.columns} onClick={
                this.executeAction(dataItem)
            }>
                <ZStack alignment={Alignment.bottomTrailing}>
                    {this.renderConfig.render(dataItem)}
                </ZStack>

            </GridListTile>
        })
    }

    /*var section: ASCollectionViewSection<Int> {
        ASCollectionViewSection(id: 0, data: context.items,
                                selectedItems: selectedIndices) { dataItem, state in
            ZStack(alignment: .bottomTrailing) {
                GeometryReader { geom in
                    self.renderConfig.render(item: dataItem)
                        .environmentObject(self.context)
                        .frame(width: geom.size.width, height: geom.size.height)
                        .clipped()
                }

                if state.isSelected {
                    ZStack {
                        Circle().fill(Color.blue)
                        Circle().strokeBorder(Color.white, lineWidth: 2)
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .frame(width: 20, height: 20)
                    .padding(10)
                }
            }
        }
        .onSelectSingle { index in
            if let press = self.renderConfig.press {
                self.context.executeAction(press, with: self.context.items[safe: index])
            }
        }
    }*/

    render() {
        this.context = this.props.context;
        return (
            <VStack>
                {this.context.currentView?.resultSet.length == 0
                    ?
                    <>
                        <HStack alignment={Alignment.top} padding={padding({all: 30, top: 40})}>
                            <Spacer/>
                            <MemriText multilineTextAlignment={Alignment.center}
                                       font={font({size: 16, weight: Font.Weight.regular, design: "default"})}
                                       opacity={0.7}
                            >
                                {this.context.currentView?.emptyResultText ?? ""}
                            </MemriText>
                            <Spacer/>
                        </HStack>
                        <Spacer/>
                    </>
                    :
                    <ASCollectionView alwaysBounceVertical={true} images={true}>
                        {this.section}

                    </ASCollectionView>}
            </VStack>

        )
    }
}

/*
struct ThumbHorizontalGridRendererView_Previews: PreviewProvider {
    static var previews: some View {
        ThumbHorizontalGridRendererView()
            .environmentObject(try! RootContext(name: "", key: "").mockBoot())
    }
}
*/
