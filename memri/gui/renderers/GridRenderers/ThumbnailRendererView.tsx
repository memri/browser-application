//
// ThumbnailRendererView.swift
// Copyright © 2020 memri. All rights reserved.

import {allRenderers, CascadingThumbnailConfig} from "../../../cvu/views/Renderers";
import {ASCollectionView, font, HStack, MainUI, MemriText, padding, Spacer, VStack, ZStack} from "../../swiftUI";
import * as React from "react";
import {Alignment, Font} from "../../../parsers/cvu-parser/CVUParser";
import {Grid, ListItem} from "@material-ui/core";

export var registerThumbnailRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "thumbnail",
            "Default",
            100,
            "apps", //square.grid.3x2.fill
            new ThumbnailRendererView(),
            CascadingThumbnailConfig,
            function() { return true }
        )
    }
}

//CascadingThumbnailConfig moved to Renderers.ts

export class ThumbnailRendererView extends MainUI {
    /*var selectedIndices: Binding<Set<Int>> {
        Binding<Set<Int>>(
            get: { [] },
            set: {
                self.context.setSelection($0.compactMap { self.context.items[safe: $0] })
            }
        )
    }*/

    executeAction = (dataItem) => () => {
        let press = this.renderConfig.press
        if (press) {
            this.context.executeAction(press, dataItem)
        }
    }

    name = "thumbnail"

    get renderConfig(): CascadingThumbnailConfig {
        return this.context.currentView?.renderConfig ?? new CascadingThumbnailConfig()
    }

    /*get layout() {
        return (
            <ASCollectionLayout scrollDirection={"vertical"} interSectionSpacing={0}>

            </ASCollectionLayout>
        )
        ASCollectionLayout(scrollDirection: .vertical, interSectionSpacing: 0) {
            ASCollectionLayoutSection { environment in
                let contentInsets = self.renderConfig.nsEdgeInset
                let numberOfColumns = self.renderConfig.columns
                let xSpacing = self.renderConfig.spacing.x
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
                section.interGroupSpacing = self.renderConfig.spacing.y
                section.contentInsets = contentInsets
                return section
            }
        }
    }*/

    get section() {
        let items = this.context.items;
        return items.map((dataItem) => {
            return <Grid item key={dataItem.uid} xs={12/this.renderConfig.columns} onClick={
                this.executeAction(dataItem)
            }>
                <ZStack alignment={Alignment.bottomTrailing}>
                    {this.renderConfig.render(dataItem)}
                </ZStack>

            </Grid>
        })
    }

    /*var section: ASCollectionViewSection<Int> {
        ASCollectionViewSection(id: 0,
                                data: context.items,
                                selectedItems: selectedIndices)
        { dataItem, state in
            ZStack(alignment: .bottomTrailing) {
                self.renderConfig.render(item: dataItem)
                    .environmentObject(self.context)

                if self.context.currentSession?.editMode ?? false && !state.isSelected {
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
                    <ASCollectionView alwaysBounceVertical={true} >
                        {this.section}

                    </ASCollectionView>}
            </VStack>

        )
    }
}

/*struct ThumbnailRendererView_Previews: PreviewProvider {
    static var previews: some View {
        ThumbnailRendererView().environmentObject(try! RootContext(name: "", key: "").mockBoot())
    }
}*/
