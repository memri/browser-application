//
// TimelineRenderer.swift
// Copyright © 2020 memri. All rights reserved.

import {ActionOpenViewWithUIDs, backgroundColor, CascadingRendererConfig, MemriDictionary} from "../../../../router";
import {ViewArguments} from "../../../../router";
import {ConfigItem, ConfigItemType, SpecialTypes} from "../../browser/configPane/ConfigPanelModel";
import {
    ASCollectionView, ASSection,
    font,
    frame, HStack, MemriDivider,
    MemriImage,
    MemriText,
    padding,
    RenderersMemri, Section,
    Spacer,
    VStack
} from "../../swiftUI";
import * as React from "react";
import {ItemFamily} from "../../../../router";
import {Color} from "../../../../router";
import {Alignment} from "../../../../router";
import {DetailLevel, formatDateByDetailLevel, TimelineElement, TimelineGroup, TimelineModel} from "./TimelineModel";
import {TimelineItemView} from "./TimelineItemView";

export class TimelineRendererController {
    static rendererType = {name:"timeline",icon: "hourglass_full"/*hourglass.bottomhalf.fill*/, makeController:TimelineRendererController, makeConfig:TimelineRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new TimelineRendererConfig()
    }

    context: MemriContext
    config: TimelineRendererConfig

    makeView() {
        return new TimelineRendererView({controller: this, context: this.context}).render();
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new TimelineRendererConfig(head, tail, host)
    }

    view(item: Item) {
        return this.config.render(item)
    }

    resolveExpression(expression: Expression, dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem);
        return expression?.execForReturnType(args)
    }

    resolveItemDateTime(item: Item) {
        return this.resolveExpression(this.config.dateTimeExpression, item);
    }

    get model(): TimelineModel {
        return new TimelineModel(
            this.context.items,
            this.resolveItemDateTime.bind(this),
            this.config.detailLevel,
            this.config.mostRecentFirst
        )
    }
}

class TimelineRendererConfig extends CascadingRendererConfig {
    get press() { return this.cascadeProperty("press") }
    mostRecentFirst = true

    get dateTimeExpression() { return this.cascadeProperty("timeProperty", "Expression") }
    get detailLevelString() { return this.cascadeProperty("detailLevel") }
    get detailLevel() { return this.detailLevelString ?? DetailLevel.day }

    showSortInConfig = false

    configItems(context: MemriContext) {
        return [
            new ConfigItem(
                "Time level",
                "detailLevel",
                SpecialTypes.timeLevel, //TODO:
                false
            ),
        ]
    }
    showContextualBarInEditMode: boolean = false
}

export class TimelineRendererView extends RenderersMemri {
    controller: TimelineRendererController

    minSectionHeight: CGFloat = 40

    sections(model: TimelineModel) {
        return model.data.map((group) => {
            return (
                <>
                    <ASSection id={group.date}
                               header={this.header(group, model.calendarHelper)}
                               contentInsets={padding({
                                   top: 8,
                                   leading: 10,
                                   bottom: 8,
                                   trailing: 10
                               })}
                               dataID={"uid"}
                               data={group.items}
                               callback={(element) => this.renderElement(element)}
                               selectionMode={(element) => () => {
                                   if (!element) return
                                   if (element.isGroup) {
                                       let uids = element.items.map((el) => el.uid);
                                       new ActionOpenViewWithUIDs(this.controller.context)
                                           .exec(new MemriDictionary({"itemType": element.itemType, "uids": uids}))
                                   }
                                   else {
                                       let press = this.controller.config.press
                                       let item = element.items[0]
                                       if (item) {
                                           this.controller.context.executeAction(press, item)
                                       }
                                   }
                               }}
                    />
                    <VStack><MemriDivider/></VStack>
                </>
            )
        })
    }

    renderElement(element: TimelineElement)  {
        if (element.isGroup) {
            return (
                <TimelineItemView icon={<MemriImage>subscriptions</MemriImage>}
                                  title={`${element.items.length} ${element.itemType.titleCase()}${element.items.length != 1 ? "s" : ""}`}
                                  backgroundColor={backgroundColor(ItemFamily[element.itemType]) ?? Color.named("gray")}
                                  frame={frame({maxWidth: "infinity", alignment: Alignment.leading})}
                />
            )
        }
        else {
                return this.controller.view(element.items[0])
                    //.frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    render(){
        this.controller = this.props.controller;

        return (
            <div className={"TimelineRendererView"}>
            <ASCollectionView layout={this.layout} alwaysBounceVertical direction={"column"}>
                {this.sections(this.controller.model)}
            </ASCollectionView>
            </div>
        )
    }

    get leadingInset(): CGFloat {
       return 60
    }

    /*var layout: ASCollectionLayout<Date> {
        ASCollectionLayout(scrollDirection: .vertical,
                           interSectionSpacing: 0) { () -> ASCollectionLayoutSection in
            ASCollectionLayoutSection { _ -> NSCollectionLayoutSection in
                let hasFullWidthHeader: Bool = self.controller.config.detailLevel == .year

                let itemLayoutSize = NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(1.0),
                    heightDimension: .estimated(20)
                )
                let groupSize = NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(1.0),
                    heightDimension: .estimated(20)
                )

                let item = NSCollectionLayoutItem(layoutSize: itemLayoutSize)
                let group = NSCollectionLayoutGroup.horizontal(
                    layoutSize: groupSize,
                    subitem: item,
                    count: 1
                )

                let section = NSCollectionLayoutSection(group: group)

                section.contentInsets = .init(
                    top: 8,
                    leading: hasFullWidthHeader ? 10 : self.leadingInset + 5,
                    bottom: 8,
                    trailing: 10
                )
                section.interGroupSpacing = 10
                section.visibleItemsInvalidationHandler = { _, _, _ in
                    // If this isn't defined, there is a bug in UICVCompositional Layout that will fail to update sizes of cells
                }

                var headerSupplementary: NSCollectionLayoutBoundarySupplementaryItem
                if hasFullWidthHeader {
                    let supplementarySize = NSCollectionLayoutSize(
                        widthDimension: .fractionalWidth(1.0),
                        heightDimension: .absolute(35)
                    )
                    headerSupplementary = NSCollectionLayoutBoundarySupplementaryItem(
                        layoutSize: supplementarySize,
                        elementKind: UICollectionView.elementKindSectionHeader,
                        alignment: .topLeading
                    )
                    headerSupplementary.extendsBoundary = true
                    headerSupplementary.pinToVisibleBounds = false
                }
                else {
                    let supplementarySize = NSCollectionLayoutSize(
                        widthDimension: .absolute(self.leadingInset),
                        heightDimension: .absolute(self.minSectionHeight + 16)
                    )
                    headerSupplementary = NSCollectionLayoutBoundarySupplementaryItem(
                        layoutSize: supplementarySize,
                        elementKind: UICollectionView.elementKindSectionHeader,
                        alignment: .topLeading
                    )
                    headerSupplementary.extendsBoundary = false
                    headerSupplementary.pinToVisibleBounds = true
                }

                let footerSupplementary = NSCollectionLayoutBoundarySupplementaryItem(
                    layoutSize: NSCollectionLayoutSize(
                        widthDimension: .fractionalWidth(1.0),
                        heightDimension: .absolute(1)
                    ),
                    elementKind: UICollectionView.elementKindSectionFooter,
                    alignment: .bottom
                )

                section.supplementariesFollowContentInsets = false
                section.boundarySupplementaryItems = [headerSupplementary, footerSupplementary]
                return section
            }
        }
    }*/

    // TODO: Clean up this function. Should probably define for each `DetailLevel` individually
    header(group: TimelineGroup, calendarHelper: CalendarHelper) {
        let matchesNow = formatDateByDetailLevel(new Date(), this.controller.config.detailLevel) == group.date

        let flipOrder = function () {
            switch (this.controller.config.detailLevel) {
                case DetailLevel.hour:
                    return true
                default:
                    return false
            }
        }.bind(this)();

        let alignment = function () {
            switch (this.controller.config.detailLevel) {
                case DetailLevel.year:
                    return Alignment.leading
                case DetailLevel.day:
                    return Alignment.center
                default:
                    return Alignment.trailing
            }
        }.bind(this)()

        let largeString = function () {
            let unformatedDate = new Date(group.date);
            switch (this.controller.config.detailLevel) {
                case DetailLevel.hour:
                    if (group.isStartOf.includes(DetailLevel.day)) {
                        return unformatedDate.toLocaleString('en-US', {day: "2-digit", month: "2-digit"});
                    }
                case DetailLevel.day:
                    return unformatedDate.toLocaleString('en-US', {day: "numeric"});
                case DetailLevel.week:
                    //format.dateFormat = "ww"
                    return unformatedDate.toLocaleString('en-US', {weekday: "narrow"}); //TODO: don't think so
                case DetailLevel.month:
                    return unformatedDate.toLocaleString('en-US', {month: "short"});
                case DetailLevel.year:
                    return unformatedDate.toLocaleString('en-US', {year: "numeric"});
            }
            return null
        }.bind(this)()

        let smallString = function () {
            let unformatedDate = new Date(group.date);
            switch (this.controller.config.detailLevel) {
                case DetailLevel.hour:
                    //format.dateFormat = "h a"
                    return unformatedDate.toLocaleString('en-US', {hour: "numeric"}); //TODO:
                case DetailLevel.day:
                    return unformatedDate.toLocaleString('en-US', {month: "short"});
                case DetailLevel.week:
                    return "Week"
                case DetailLevel.month:
                    if (group.isStartOf.includes(DetailLevel.year)) {
                        return unformatedDate.toLocaleString('en-US', {year: "numeric"});
                    }
                default:
                    break
            }
            return null
        }.bind(this)()

        let small = function () {
            return (
                <MemriText font={font({family: "system", size: 14})}
                           foregroundColor={matchesNow ? Color.named("red") : Color.named("secondaryLabel")}
                           fixedSize>
                    {smallString}
                </MemriText>
            )
        }.bind(this)()

        return (//alignment: Alignment(horizontal: alignment, vertical: .top)
            <VStack alignment={alignment} spacing={0} padding={padding(8)} frame={frame({maxWidth: "infinity"})}>
                {!flipOrder && small}
                <MemriText font={font({family: "system", size: 20})} lineLimit={1} minimumScaleFactor={0.6}
                           foregroundColor={matchesNow ? (this.useFillToIndicateNow) ? Color.named("white") : "red" : Color.named("label")}
                           padding={padding({vertical: matchesNow ? 3 : 0})}
                           background={(this.useFillToIndicateNow && matchesNow) ? Color.named("red") : Color.named("clear")}
                           frame={frame({minWidth: 30, minHeight: 30})} fixedSize
                >
                    {largeString}
                </MemriText>
                {flipOrder && small}
                <Spacer minLength={0}/>
            </VStack>
        )
    }


    get useFillToIndicateNow() {
        switch (this.controller.config.detailLevel) {
            case DetailLevel.day:
                return true
            default:
                return false
        }
    }
}
