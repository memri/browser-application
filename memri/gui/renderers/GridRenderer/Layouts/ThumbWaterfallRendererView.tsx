//
// ThumbWaterfallRendererView.swift
// Copyright © 2020 memri. All rights reserved.



import {allRenderers, CascadingThumbnailConfig} from "../../Renderers";
import {ThumbHorizontalGridRendererView} from "./ThumbHorizontalGridRendererView";
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
import {Grid} from "@material-ui/core";
import {Alignment, Color, Font} from "../../../../cvu/parsers/cvu-parser/CVUParser";
import * as React from "react";

export var registerThumbWaterfallRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "thumbnail.waterfall",
            "Waterfall Grid",
            130,
            "square.grid.3x2.fill",
            new ThumbWaterfallRendererView(),
            CascadingThumbnailConfig,
            function() { return true }
        )
    }
}

export class ThumbWaterfallRendererView extends RenderersMemri {
    name = "thumbnail_waterfall"

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

/*    var layout: ASCollectionLayout<Int> {
        ASCollectionLayout(createCustomLayout: ASWaterfallLayout.init) { layout in
            let spacing = self.renderConfig.spacing
            layout.columnSpacing = spacing.x
            layout.itemSpacing = spacing.y
            layout
                .numberOfColumns =
                .adaptive(minWidth: 150) // @State var columnMinSize: CGFloat = 150
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
                    <ASCollectionView alwaysBounceVertical={true} background={this.renderConfig.backgroundColor?.color ?? new Color("systemBackground")} /*customDelegate={new WaterfallScreenLayoutDelegate()}*/ /*contentInsets={this.renderConfig.edgeInset}*/>
                        {this.section}
                    </ASCollectionView>
                }
            </VStack>
        );
    }
}

/*struct ThumbWaterfallRendererView_Previews: PreviewProvider {
    static var previews: some View {
        ThumbnailRendererView().environmentObject(try! RootContext(name: "", key: "").mockBoot())
    }
}*/

class WaterfallScreenLayoutDelegate/* extends ASCollectionViewDelegate, ASWaterfallLayoutDelegate*/ {
    heightForHeader(sectionIndex) {
        return 0
    }

    heights = [1.5, 1.0, 0.75, 1.75, 0.6]
    /// We explicitely provide a height here. If providing no delegate, this layout will use auto-sizing, however this causes problems if rotating the device (due to limitaitons in UICollecitonView and autosizing cells that are not visible)
    heightForCell(
        indexPath: IndexPath,
        context//: ASWaterfallLayout.CellLayoutContext
    ) {
        //        guard let item: Item = getDataForItem(at: indexPath) else { return 100 }
        let rand = indexPath.item % this.heights.length
        return context.width * (this.heights[rand] ?? 1)
    }
}
