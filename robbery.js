'use strict';

exports.isStar = false;

var DAYS = ['ПН', 'ВТ', 'СР'];
var BANK_TIME_ZONE;

function getBankSchedule(workingHours) {
    var bankSchedule = [];
    for (var i = 0; i < DAYS.length; i++) {
        var from = convertToDate(DAYS[i] + ' ' + workingHours.from);
        var to = convertToDate(DAYS[i] + ' ' + workingHours.to);
        bankSchedule.push({ from: from, to: to });
    }

    return bankSchedule;
}

function convertToDate(stringDate) {
    var days = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7 };
    //var re = /^([А-Я]{2}) (.*)(\+\d+)$/;
    var re = /^([А-Я]{2}) (\d{2}):(\d{2})(\+\d+)$/;
    var parseDate = stringDate.match(re);
    var date = new Date(Date.UTC(0, 0, days[parseDate[1]],
        parseInt(parseDate[2]) - parseInt(parseDate[4]),
        parseInt(parseDate[3])));

    return date;
}

function getCompanionsSchedule(schedule) {
    var companionsSchedule = {};
    var names = Object.keys(schedule);
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        companionsSchedule[name] = [];
        for (var j = 0; j < schedule[name].length; j++) {
            var from = convertToDate(schedule[name][j].from);
            var to = convertToDate(schedule[name][j].to);
            companionsSchedule[name].push({ from: from, to: to });
        }
    }

    return companionsSchedule;
}

function findFreeTimeSchedule(bankSchedule, companionsSchedule) {
    var freeTimeSchedule = bankSchedule.slice();
    var names = Object.keys(companionsSchedule);
    for (var i = 0; i < names.length; i++) {
        var newFreeTimes = [];
        for (var j = 0; j < freeTimeSchedule.length; j++) {
            newFreeTimes = newFreeTimes.concat(
                getNotIntersectedTime(freeTimeSchedule[j], companionsSchedule[names[i]])
            );
        }
        freeTimeSchedule = newFreeTimes;
    }

    return freeTimeSchedule;
}

function getNotIntersectedTime(freeTime, busyTimes) {
    var notIntersectedTime = [];
    var freeTimeIsNotIntersected = true;
    for (var j = 0; j < busyTimes.length; j++) {
        if (isTimeInInterval(busyTimes[j].from, freeTime)) {
            notIntersectedTime.push({ from: freeTime.from, to: busyTimes[j].from });
            freeTimeIsNotIntersected = false;
        }
        if (isTimeInInterval(busyTimes[j].to, freeTime)) {
            notIntersectedTime.push({ from: busyTimes[j].to, to: freeTime.to });
            freeTimeIsNotIntersected = false;
        }
        if (isIntervalInInterval(freeTime, busyTimes[j])) {
            freeTimeIsNotIntersected = false;
        }
    }
    if (freeTimeIsNotIntersected) {
        notIntersectedTime.push(freeTime);
    }

    return notIntersectedTime;
}

function isTimeInInterval(time, interval) {
    return interval.from.getTime() <= time.getTime() && time.getTime() <= interval.to.getTime();
}

function isIntervalInInterval(verifiableInterval, interval) {
    return (interval.from.getTime() <= verifiableInterval.from.getTime() &&
        verifiableInterval.to.getTime() <= interval.to.getTime());
}

function findTimeForRobbery(freeTimeSchedule, duration) {
    var timeForRobbery = null;
    for (var i = 0; i < freeTimeSchedule.length; i++) {
        var minutes = (freeTimeSchedule[i].to.getTime() - freeTimeSchedule[i].from.getTime()) /
            60000;
        if (minutes >= duration) {
            timeForRobbery = freeTimeSchedule[i];
            break;
        }
    }

    return timeForRobbery;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    BANK_TIME_ZONE = parseInt(workingHours.from.split('+')[1]);
    var bankSchedule = getBankSchedule(workingHours);
    var companionsSchedule = getCompanionsSchedule(schedule);
    var freeTimeSchedule = findFreeTimeSchedule(bankSchedule, companionsSchedule);
    var timeForRobbery = findTimeForRobbery(freeTimeSchedule, duration);

    return {

        exists: function () {
            return timeForRobbery !== null;
        },

        format: function (template) {
            if (timeForRobbery) {
                timeForRobbery.from.setUTCHours(
                    timeForRobbery.from.getUTCHours() + BANK_TIME_ZONE
                );
                var day = DAYS[timeForRobbery.from.getUTCDay() - 1];
                var hours = timeForRobbery.from.getUTCHours().toString();
                if (hours.length === 1) {
                    hours = '0' + hours;
                }
                var minutes = timeForRobbery.from.getUTCMinutes().toString();
                if (minutes.length === 1) {
                    minutes = '0' + minutes;
                }
                return template
                    .replace('%DD', day)
                    .replace('%HH', hours)
                    .replace('%MM', minutes);
            }

            return '';
        },

        tryLater: function () {
            return false;
        }
    };
};
