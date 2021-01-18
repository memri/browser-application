//
// CalendarHelper.swift
// Copyright © 2020 memri. All rights reserved.
import * as moment from 'moment';
import {Calendar} from "../../../extensions/common/Calendar";

export class CalendarHelper {
    calendar = Calendar
    get dayFormatter() {
        let formatter;
        formatter = "D"
        return formatter
    }

    get monthFormatter() {
        let formatter;
        formatter = "MMM"
        return formatter
    }

    get monthYearFormatter() {
        let formatter;
        formatter = "MMM YYYY"
        return formatter
    }

    getMonths(startDate: Date, endDate: Date) {
        let firstMonth = moment(startDate).startOf('month');
        let lastMonth = moment(endDate).startOf('month');
        if (endDate < startDate || !firstMonth || !lastMonth) {
            return []
        }
        var dates = []

        this.calendar.enumerateDates(() => {
            let date = firstMonth
            do {
                dates.push(date.valueOf());
                date = date.add(1, "day");
            } while (date < lastMonth)
        })
        return dates
    }

    getDays(month: Date) {
        let endOfMonth = moment(month).endOf("month");
        if (!endOfMonth) { return [] }
        var dates = []

        this.calendar.enumerateDates(() => {
            let date = endOfMonth//.subtract(1, "second");
            do {
                dates.push(date.valueOf());
                date = date.add(1, "hour");
            } while (date < endOfMonth)
        })
        return dates
    }

    getPaddedDays(month: Date) {
        let weekdayAtStart = moment(month).startOf("month").weekday();
        let endOfMonth = moment(month).endOf("month");
        if (!weekdayAtStart || !endOfMonth) { return [] }
        let adjustedWeekday = (weekdayAtStart - 1) // 0 = Sunday
        var dates = [];
        for (let i = 0; i <= adjustedWeekday; i++) {
            dates.push(null)
        }
        this.calendar.enumerateDates(() => {
            let date = moment(month);
            do {
                dates.push(date.valueOf());
                date = date.add(1, "day");
            } while (date.isBefore(endOfMonth))
        })

        return dates
    }

    areOnSameDay(a: Date, b: Date) {
        return moment(a).isSame(b, "day");
    }

    isToday(date: Date) {
        return moment(date).isSame(new Date(), "day");
    }

    isSameAsNow(date: Date, byComponents) {
        return moment(date).isSame(new Date());
    }

    dayString(date: Date) {
        return date ? moment(date).format(this.dayFormatter) : "";
    }

    monthString(date: Date) {
        return moment(date).format(this.monthFormatter)
    }

    monthYearString(date: Date) {
        if (moment(date).isSame(new Date(), "year")) {
            return moment(date).format(this.monthFormatter)
        }
        else {
            return moment(date).format(this.monthYearFormatter)
        }
    }

    get daysInWeek() {
        return moment.weekdaysShort()
    }

    weekdayAtStartOfMonth(date: Date) {
        let startOfMonth = moment(date).startOf('month');
        if (!startOfMonth) {return null}
        return startOfMonth.weekday();
    }

    startOfDay(date: Date) {
        return moment(date).startOf("day").valueOf()
    }

    startOfMonth(date: Date) {
        return moment(date).startOf("month").valueOf();
    }

    endOfMonth(date: Date)  {
        return moment(date).endOf("month").valueOf();
    }

    startOfYear(date: Date) {
        return moment(date).startOf("year").valueOf();
    }

    endOfYear(date: Date) {
        return moment(date).endOf("year").valueOf();
    }
}
