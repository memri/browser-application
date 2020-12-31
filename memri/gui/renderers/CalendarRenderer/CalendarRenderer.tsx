//
// CalendarRenderer.swift
// Copyright © 2020 memri. All rights reserved.

import {CascadingRendererConfig} from "../../../cvu/views/CascadingRendererConfig";
import * as React from "react";
import {ViewArguments} from "../../../cvu/views/CascadableDict";
import {
    ASCollectionView, ASCollectionViewSection,
    ASSection, Circle,
    font, frame,
    Group,
    HStack, MemriDivider,
    MemriText,
    padding,
    RenderersMemri, Spacer,
    VStack
} from "../../swiftUI";
import {ActionOpenViewWithUIDs, Alignment, Color, Font} from "../../../../router";
import {CalendarHelper} from "./CalendarHelper";

export class CalendarRendererController {
    static rendererType = {name:"calendar",icon: "calendar", makeController:CalendarRendererController, makeConfig:CalendarRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new CalendarRendererConfig()
    }

    context: MemriContext
    config: CalendarRendererConfig

    makeView() {
       return <CalendarRendererView controller={this} context={this.context}/>
    }

    update() {
        //objectWillChange.send()
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new CalendarRendererConfig(head, tail, host)
    }

    view(item: Item) {
        return this.config.render(item)
    }

    resolveExpression(expression: Expression, dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem);
        return expression?.execForReturnType(args)
    }

    resolveItemDateTime(item: Item) {
        this.resolveExpression(this.config.dateTimeExpression, item);
    }

    calendarHelper = new CalendarHelper()

    get calcs(): CalendarCalculations {
        return new CalendarCalculations(this.calendarHelper,
            this.context.items,
            ($0) => {
                return this.resolveExpression(
                    this.config.dateTimeExpression,
                    $0
                )
            },
            this.config)
    }
}

class CalendarRendererConfig extends CascadingRendererConfig {
    showSortInConfig: boolean = false

    configItems(context) {
        return []
    }

    showContextualBarInEditMode: boolean = false

    get dateTimeExpression() {
        return this.cascadeProperty("timeProperty", "Expression")
    }
}

class CalendarCalculations {

    constructor(
        calendarHelper: CalendarHelper,
        data: Item[],
        dateResolver,
        renderConfig: CalendarRendererConfig
    ) {
        let datesWithItems = {};
        data.forEach((item) => {
            let dateTime = dateResolver(item);
            let date = calendarHelper.startOfDay(dateTime);
            if (!dateTime || !date) {
                return;
            }
            if (datesWithItems[date]) {
                datesWithItems[date].push(item);
            } else {
                datesWithItems[date] = [item]
            }
        })
        this.datesWithItems = datesWithItems
        let minDate = Math.min(...Object.keys(datesWithItems).map((el) => Number(el)));
        let maxDate = Math.max(...Object.keys(datesWithItems).map((el) => Number(el)));
        this.start = new CalendarHelper().startOfMonth(datesWithItems[minDate][0]) ?? new Date();
        this.end = new CalendarHelper().endOfMonth(datesWithItems[maxDate][0]) ?? new Date();
    }

    datesWithItems
    start: Date
    end: Date

    hasItemOnDay(day: Date) {
        return this.datesWithItems.keys.contains(day)
    }

    itemsOnDay(day: Date) {
        return this.datesWithItems[day] ?? []
    }
}

class CalendarRendererView extends RenderersMemri {
    controller: CalendarRendererController

    scrollPosition: ASCollectionViewScrollPosition //= .bottom

    get layout() {
        let columns = 7
        let itemSize = 55;
        let itemLayoutSize = {
            //widthDimension: "100%",
            heightDimension: itemSize
        }

        let groupSize = {
            //widthDimension: "100%",
            heightDimension: itemSize
        }

        let supplementarySize = {
            //widthDimension: "100%",
            heightDimension: 30
        }

        let item = {layoutSize: itemLayoutSize}

        let group = {
            layoutSize: groupSize,
            subitem: item,
            count: columns
        }

        let section = {group: group}
        section.interGroupSpacing = 0
        section.contentInsets = {top: 0, leading: 20, bottom: 0, trailing: 20}

        let headerSupplementary = {
            layoutSize: supplementarySize,
            elementKind: "header",
            alignment: Alignment.top
        }

        let footerSupplementary = {
            layoutSize: supplementarySize,
            elementKind: "footer",
            alignment: Alignment.bottom
        }
        section.boundarySupplementaryItems = [
            headerSupplementary,
            footerSupplementary,
        ]
        return section
    }

    render() {
        this.controller = this.props.controller;
        this.context = this.props.context;

        return (
            <VStack spacing={0} background={this.controller.config.backgroundColor?.color ?? Color.named("systemBackground")}>
                <HStack spacing={0} background={new Color("gray").opacity(0.2)} textAlign={"center"}>
                    {this.controller.calendarHelper.daysInWeek.map((dayString)=> {
                        return <MemriText font={font({family: "headline"})} width={"calc(100%/7)"}>
                            {dayString}
                        </MemriText>
                    })}
                </HStack>
                <ASCollectionView scrollPositionSetter={this.$scrollPosition}
                                  contentInsets={padding({top: 10, left: 0, bottom: 10, right: 0})}
                                  alwaysBounceVertical
                                  layout={this.layout}
                                  context={this.context}
                                  justifyItems={"center"}
                                  textAlign={"center"}
                >
                    {this.sections(this.controller.calcs)}
                </ASCollectionView>
            </VStack>
        )
    }

    sections(calcs: CalendarCalculations) {
        return this.controller.calendarHelper.getMonths(calcs.start, calcs.end)
            .map(($0) => this.section($0, calcs))
    }

    section(month: Date, calcs: CalendarCalculations) {
        let days = this.controller.calendarHelper.getPaddedDays(month)
        return <ASCollectionViewSection layout={this.layout} id={month} data={days} selectionMode={(dataItem,index) => {
            return () => {
                let day = days[index];
                if (!day)
                    return
                //let formatter = DateFormatter();
                //formatter.dateStyle = .long
                //formatter.timeStyle = .none
                // handle press on day
                let items = calcs.itemsOnDay(day)
                let uids = items.map((item) => item["uid"]);
                let itemType = (items.length > 0) ? items[0].genericType : undefined;
                if (!itemType || uids.length == 0) {
                    return;
                }
                new ActionOpenViewWithUIDs(this.controller.context).exec({"itemType": itemType, "uids": uids})
            }
        }
        } callback={(day, cellContext) => {
            return (
                <Group width={"100%"}>
                    <VStack spacing={0}
                            background={cellContext.isHighlighted ? new Color("darkGray").opacity(0.3) : Color.named("clear")}>
                        <Spacer/>
                        <MemriText
                            foregroundColor={this.controller.calendarHelper.isToday(day) ? this.controller.config.primaryColor.color : Color.named("label")}>
                            {this.controller.calendarHelper.dayString(day)}
                        </MemriText>
                        <HStack spacing={0}>
                            <Circle
                                fill={calcs.itemsOnDay(day).length == 0 ? Color.named("clear") : this.controller.config.primaryColor}
                                frame={frame({width: 10, height: 10})} padding={padding(4)}
                            />
                            {calcs.itemsOnDay(day).length > 1 &&
                            <MemriText font={font({family: "caption", weight: Font.Weight.bold})}
                                       foregroundColor={this.controller.config.primaryColor.color} fixedSize>
                                {`×${calcs.itemsOnDay(day).length}`}
                            </MemriText>
                            }
                            <Spacer/>
                            <MemriDivider/>
                        </HStack>
                    </VStack>
                </Group>
            )
        }
        } sectionHeader={<MemriText font={font({family: "headline"})} frame={frame({
            maxWidth: "infinity",
            alignment: Alignment.leading
        })} gridColumnStart={1} gridColumnEnd={8} textAlign={"left"}>{this.controller.calendarHelper.monthYearString(month)}</MemriText>}>

        </ASCollectionViewSection>
    }
}

// struct CalendarDotShape: Shape {
//    var count: Int
//    func path(in rect: CGRect) -> Path {
//        Path { path in
//            guard count > 0 else { return }
//            let boundedCountInt = max(min(count, 4), 0)
//            let boundedCount = CGFloat(boundedCountInt)
//            let radius = min(rect.width / 2 / (boundedCount + 1) - 1, rect.height * 0.5)
//            let spacing = rect.width / (boundedCount + 1)
//            for i in 1 ... boundedCountInt {
//                path.addEllipse(in: CGRect(
//                    x: spacing * CGFloat(i) - radius,
//                    y: rect.midY - radius,
//                    width: radius * 2,
//                    height: radius * 2
//                ))
//            }
//        }
//    }
// }
