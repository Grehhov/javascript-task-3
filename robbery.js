'use strict';

exports.isStar = false;

function convertSchedule(schedule) {
    var res = {};
    var names = Object.keys(schedule);
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        res[name] = [];
        for (var j = 0; j < schedule[name].length; j++) {
            var from = convertToDate(schedule[name][j].from);
            var to = convertToDate(schedule[name][j].to);
            res[name].push({ from: from, to: to });
        }
    }

    return res;
}

function convertToDate(stringDate) {
    var days = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7 };
    var re = /^([А-Я]{2}) (.*)(\+\d+)$/;
    var parseDate = stringDate.match(re);

    return new Date(Date.parse(days[parseDate[1]] + ' Jan 1900 ' +
        parseDate[2] + ' GMT' + parseDate[3] + '00'));
}

function getSchedBank(workingHours) {
    var daysOfWorkBank = ['ПН', 'ВТ', 'СР'];
    var sched = [];
    for (var i = 0; i < daysOfWorkBank.length; i++) {
        var from = convertToDate(daysOfWorkBank[i] + ' ' + workingHours.from);
        var to = convertToDate(daysOfWorkBank[i] + ' ' + workingHours.to);
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

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var sched = convertSchedule(schedule);
    var schedBank = getSchedBank(workingHours);
    var names = Object.keys(sched);
    for (var j = 0; j < names.length; j++) {
        var neperesek = [];
        for (var i = 0; i < schedBank.length; i++) {
            neperesek = neperesek.concat(getNeperesekItem(schedBank[i], sched[names[j]]));
        }
        schedBank = neperesek;
    }
    var time = null;
    for (var n = 0; n < schedBank.length; n++) {
        var min = (schedBank[n].to.getTime() - schedBank[n].from.getTime()) / 60000;
        if (min >= duration) {
            time = schedBank[n];
            break;
        }
    }

    return {

        exists: function () {
            if (time) {
                return true;
            }

            return false;
        },

        format: function (template) {
            if (time) {
                var bankTimeZone = parseInt(workingHours.from.split('+')[1]);
                var currentTimeZone = - time.from.getTimezoneOffset() / 60;
                time.from.setHours(time.from.getHours() + (bankTimeZone - currentTimeZone));
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
