'use strict';

exports.isStar = false;

function convertSchedule(schedule, bankTimeZone) {
    var res = {};
    var names = Object.keys(schedule);
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        res[name] = [];
        for (var j = 0; j < schedule[name].length; j++) {
            var from = convertToDate(schedule[name][j].from, bankTimeZone);
            var to = convertToDate(schedule[name][j].to, bankTimeZone);
            res[name].push({ from: from, to: to });
        }
    }

    return res;
}

function convertToDate(stringDate, bankTimeZone) {
    var days = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7 };
    var re = /^([А-Я]{2}) (.*)(\+\d+)$/;
    var parseDate = stringDate.match(re);
    var date = new Date(Date.parse(days[parseDate[1]] + ' Jan 1900 ' +
        parseDate[2] + ' GMT' + parseDate[3] + '00'));
    var currentTimeZone = - date.getTimezoneOffset() / 60;
    date.setHours(date.getHours() + (bankTimeZone - currentTimeZone));

    return date;
}

function getSchedBank(workingHours, bankTimeZone) {
    var daysOfWorkBank = ['ПН', 'ВТ', 'СР'];
    var sched = [];
    for (var i = 0; i < daysOfWorkBank.length; i++) {
        var from = convertToDate(daysOfWorkBank[i] + ' ' + workingHours.from, bankTimeZone);
        var to = convertToDate(daysOfWorkBank[i] + ' ' + workingHours.to, bankTimeZone);
        sched.push({ from: from, to: to });
    }

    return sched;
}

function getNeperesekItem(svTime, zTime) {
    var neperesekItem = [];
    var neperes = true;
    for (var j = 0; j < zTime.length; j++) {
        if (zTime[j].from.getTime() <= svTime.to.getTime() &&
            zTime[j].from.getTime() >= svTime.from.getTime()) {
            neperesekItem.push({ from: svTime.from, to: zTime[j].from });
            neperes = false;
        }
        if (zTime[j].to.getTime() <= svTime.to.getTime() &&
            zTime[j].to.getTime() >= svTime.from.getTime()) {
            neperesekItem.push({ from: zTime[j].to, to: svTime.to });
            neperes = false;
        }
        if (zTime[j].to.getTime() >= svTime.to.getTime() &&
            zTime[j].from.getTime() <= svTime.from.getTime()) {
            neperes = false;
        }
    }
    if (neperes) {
        neperesekItem.push(svTime);
    }

    return neperesekItem;
}

function findFreeTime(schedBank, duration) {
    var time = null;
    for (var n = 0; n < schedBank.length; n++) {
        var min = (schedBank[n].to.getTime() - schedBank[n].from.getTime()) / 60000;
        if (min >= duration) {
            time = schedBank[n];
            break;
        }
    }

    return time;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var bankTimeZone = parseInt(workingHours.from.split('+')[1]);
    var sched = convertSchedule(schedule, bankTimeZone);
    var schedBank = getSchedBank(workingHours, bankTimeZone);
    var names = Object.keys(sched);
    for (var j = 0; j < names.length; j++) {
        var neperesek = [];
        for (var i = 0; i < schedBank.length; i++) {
            neperesek = neperesek.concat(getNeperesekItem(schedBank[i], sched[names[j]]));
        }
        schedBank = neperesek;
    }
    var time = findFreeTime(schedBank, duration);

    return {

        exists: function () {
            if (time) {
                return true;
            }

            return false;
        },

        format: function (template) {
            if (time) {
                var days = ['ПН', 'ВТ', 'СР'];
                template = template.replace('%DD', days[time.from.getDay() - 1]);
                var h = time.from.getHours().toString();
                if (h.length === 1) {
                    h = '0' + h;
                }
                template = template.replace('%HH', h);
                var m = time.from.getMinutes().toString();
                if (m.length === 1) {
                    m = '0' + m;
                }
                template = template.replace('%MM', m);

                return template;
            }

            return '';
        },

        tryLater: function () {
            return false;
        }
    };
};
