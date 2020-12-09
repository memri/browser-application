//
// TimelineModel.swift
// Copyright © 2020 memri. All rights reserved.
export class TimelineModel {
    data: TimelineGroup[]
    detailLevel: DetailLevel
    mostRecentFirst: Bool

    itemDateTimeResolver

    calendarHelper /*= CalendarHelper()*/

    constructor(
        dataItems: Item[],
        itemDateTimeResolver,
        detailLevel: DetailLevel,
        mostRecentFirst: Bool
    ) {
        this.detailLevel = detailLevel
        this.mostRecentFirst = mostRecentFirst
        this.itemDateTimeResolver = itemDateTimeResolver

        this.data = TimelineModel.group(
            dataItems,
            itemDateTimeResolver,
            detailLevel,
            mostRecentFirst
        )
    }

    static group( //TODO:
        data: Item[],
        itemDateTimeResolver,
        level,
        mostRecentFirst: boolean,
        maxCount: number = 3
    ) {
        let groupedByDay = new Map();
        data.map((dataItem) => {
            let date = itemDateTimeResolver(dataItem);
            if (!date) {
                return
            }
            date = new Date(date)
            date = formatDateByDetailLevel(date, level);

            if (groupedByDay.has(date)) {
                let val = groupedByDay.get(date);
                val.push(dataItem);
            } else {
                groupedByDay.set(date, [dataItem]);
            }

        });
        var sortedGroups = [];
        groupedByDay.forEach( (items, date) => {
            if (!date) {
                return
            }
            sortedGroups.push(new TimelineGroup(date,
                TimelineModel.groupByType(items, maxCount)
            ))
        })
        if (sortedGroups.length == 0) {
            return []
        }
        sortedGroups.sort((a, b) => b.date - a.date);

        let largerComponents = largerComponentsDetailLevel(level);
        sortedGroups[0].isStartOf = largerComponents;
        for (let i = 1; i < sortedGroups.length; i++) {
            sortedGroups[i].isStartOf = largerComponents
        }
/*        for (index in sortedGroups.indices.dropFirst()) {
            let difference = Calendar.current.dateComponents(
                largerComponents,
                from: sortedGroups[index - 1].date,
                to: sortedGroups[index].date
            )
            sortedGroups[index].isStartOf = largerComponents
                .filter { difference.value(for: $0) ?? 0 < 0 }
        }*/ //TODO:

        return mostRecentFirst ? sortedGroups : sortedGroups.reverse;
    }

    static groupByType( //TODO: renamed @mkslanc
        data: Item[],
        maxCount: number = 2
    ) {
        let groupedByType= {}

        data.map((dataItem) => {
            var groupedItem = groupedByType[dataItem.genericType];
            if (!groupedItem) {
                groupedByType[dataItem.genericType] = [dataItem];
            } else {
                groupedByType[dataItem.genericType].push(dataItem);
            }
        });

        let sortedGroups = [];

        for (let type in groupedByType) {
            let items = groupedByType[type];
            if (items.length > maxCount) {
                sortedGroups.push(new TimelineElement(type, 0, items));
            }
            else {
                sortedGroups.push(...items.map (($0, index)=> new TimelineElement(type, index, [$0])))
            }
        }
        sortedGroups.sort((a, b) => b - a);

        return sortedGroups
    }
}

export class TimelineGroup {
    date: Date
    items: TimelineElement[]

    // Used to store whether this is the first entry in year/month/day etc (for use in rendering supplementaries)
    isStartOf = []

    constructor(date: Date, items: TimelineElement[]) {
        this.date = date;
        this.items = items;
    }
}

export class TimelineElement {
    itemType: String
    index: number
    items: Item[]


    constructor(itemType: String, index: number, items: Item[]) {
        this.itemType = itemType;
        this.index = index;
        this.items = items;
    }

    get isGroup() { return this.items[0] != this.items[this.items.length - 1] }

    hash(hasher) {
        hasher.combine(this.itemType)
        hasher.combine(this.index)
    }

    /*static func == (lhs: TimelineElement, rhs: TimelineElement) -> Bool {
        lhs.itemType == rhs.itemType && lhs.index == rhs.index
    }*/

    get id(): number {
        return  this.hashValue
    }
}


export enum DetailLevel {
    year = "year",
    month = "month",
    week = "week",
    day = "day",
    hour = "hour",
    //yearForWeekOfYear = "yearForWeekOfYear",
    // weekOfYear = "weekOfYear"
}

var relevantComponentsDetailLevel = (level) => {
    switch (level) {
        case DetailLevel.year: return [DetailLevel.year]
        case DetailLevel.month: return [DetailLevel.year, DetailLevel.month]
        /*case DetailLevel.week: return [
            DetailLevel.yearForWeekOfYear,
            DetailLevel.weekOfYear,
        ]*/ // Note yearForWeekOfYear is used to correctly account for weeks crossing the new year
        case DetailLevel.day: return [DetailLevel.year, DetailLevel.month, DetailLevel.day]
        case DetailLevel.hour: return [DetailLevel.year, DetailLevel.month, DetailLevel.day, DetailLevel.hour]
    }
}

var largerComponentsDetailLevel = (level) => {
    switch (level) {
        case DetailLevel.year: return []
        case DetailLevel.month: return [DetailLevel.year]
        case DetailLevel.week: return [DetailLevel.year] // Note yearForWeekOfYear is used to correctly account for weeks crossing the new year
        case DetailLevel.day: return [DetailLevel.year, DetailLevel.month]
        case DetailLevel.hour: return [DetailLevel.year, DetailLevel.month, DetailLevel.day]
    }
}

//TODO: we need this to format date by date components @mkslanc
export var formatDateByDetailLevel = (date, level) => {
    switch (level) {
        case DetailLevel.year:
            return  new Date(date.setMonth(1, 1)).setHours(0, 0, 0, 0);
        case DetailLevel.month:
            return new Date(date.setDate(1)).setHours(0, 0, 0, 0);
        /*case DetailLevel.week: return [
            DetailLevel.yearForWeekOfYear,
            DetailLevel.weekOfYear,
        ] // Note yearForWeekOfYear is used to correctly account for weeks crossing the new year*/
        case DetailLevel.day:
            return date.setHours(0, 0, 0, 0);
        case DetailLevel.hour:
            return date.setMinutes(0, 0, 0);
    }
}
