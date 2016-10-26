'use strict';

exports.isStar = false;

function convertSchedule(schedule) {
    var res = {};
    for (var i in schedule) {
        res[i] = [];
        for (var j = 0; j < schedule[i].length; j++) {
            var from = convertToDate(schedule[i][j].from);
            var to = convertToDate(schedule[i][j].to);
            res[i].push({from: from, to: to});
        }
    }

    return res;
}

function convertToDate(stringDate) {
    var days = {'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7};
    var re = /^([А-Я]{2}) (.*)(\+\d+)$/;
    var parseDate = stringDate.match(re);

    return new Date(Date.parse(days[parseDate[1]] + ' Jan 1900 ' + parseDate[2] + ' GMT' + parseDate[3] + '00'));
}

function getSchedBank(workingHours) {
    var daysOfWorkBank = ['ПН', 'ВТ', 'СР'];
    var sched = [];
    for (var i = 0; i < daysOfWorkBank.length; i++) {
        var from = convertToDate(daysOfWorkBank[i] + ' ' + workingHours.from);
        var to = convertToDate(daysOfWorkBank[i] + ' ' + workingHours.to);
        sched.push({from: from, to: to});
    }

    return sched;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var sched = convertSchedule(schedule);
    //console.log(sched);
    var schedBank = getSchedBank(workingHours);
    //console.log(schedBank);
    for (var name in sched) {
        var neperesek = [];
        for (var i = 0; i < schedBank.length; i++) {
            var neperes = true;
            for (var j = 0; j < sched[name].length; j++) {
                if (sched[name][j].from.getTime() <= schedBank[i].to.getTime() &&
                    sched[name][j].from.getTime() >= schedBank[i].from.getTime()) {
                    neperesek.push({from: schedBank[i].from, to: sched[name][j].from});
                    neperes = false;
                }
                if (sched[name][j].to.getTime() <= schedBank[i].to.getTime() &&
                    sched[name][j].to.getTime() >= schedBank[i].from.getTime()) {
                    neperesek.push({from: sched[name][j].to, to: schedBank[i].to});
                    neperes = false;
                }
            }
            if (neperes) {
                neperesek.push(schedBank[i]);
            }
        }
        schedBank = neperesek;
    }
    var time = null;
    for (var i = 0; i < schedBank.length; i++) {
        var min = (schedBank[i].to.getTime() - schedBank[i].from.getTime()) / 60000;
        if (min >= duration) {
            time = schedBank[i];
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
            if (time){
                var days = ['ПН', 'ВТ', 'СР'];
                template = template.replace('%DD', days[time.from.getDay() - 1]);
                var bankTimeZone = parseInt(workingHours.from.split('+')[1]);
                var currentTimeZone = -time.from.getTimezoneOffset()/60;
                var h = (time.from.getHours() + (bankTimeZone - currentTimeZone)).toString();
                if (h.length == 1) h = '0' + h;
                template = template.replace('%HH', h);
                var m = time.from.getMinutes().toString();
                if (m.length == 1) m = '0' + m;
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
