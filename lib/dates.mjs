class Dates {
  /**
   * Return the number of days between two dates
   * @param {Date} val1
   * @param {Date} val2
   * @returns {number}
   */
  static dayDiff(val1, val2) {
    let diff = Math.abs(val1.getTime() - val2.getTime());
    return Math.ceil(diff / (1000 * 3600 * 24));
  }

  /**
   * Return the number of weeks between two dates
   * @param {Date} val1
   * @param {Date} val2
   * @returns {number}
   */
  static weekDiff(val1, val2) {
    return Math.floor(Dates.dayDiff(val1, val2) / 7);
  }

  /**
   * Return the number of months between two dates
   * @param {Date} val1
   * @param {Date} val2
   * @returns {number}
   */
  static monthDiff(val1, val2) {
    let diff = Math.abs(val2.getMonth() + 12 * Math.abs(val1.getFullYear() - val2.getFullYear()) - val1.getMonth());
    if (val1 < val2) {
      if (Dates.addMonths(val1, diff) > val2) {
        diff--;
      }
    } else {
      if (Dates.addMonths(val2, diff) > val1) {
        diff--;
      }
    }
    return diff;
  }

  /**
   * Return the number of years between two dates
   * @param {Date} val1
   * @param {Date} val2
   * @returns {number}
   */
  static yearDiff(val1, val2) {
    let diff = Math.abs(val1.getFullYear() - val2.getFullYear());
    if (val1 < val2) {
      if (Dates.addYears(val1, diff) > val2) {
        diff--;
      }
    } else {
      if (Dates.addYears(val2, diff) > val1) {
        diff--;
      }
    }
    return diff;
  }

  /**
   * Add given milliseconds to a date
   * @param {Date} val
   * @param {number} milliseconds
   * @returns Date
   */
  static addMilliseconds(val, milliseconds) {
    let dat = new Date(val.getTime());
    return new Date(dat.getTime() + milliseconds);
  }

  /**
   * Add given seconds to a date
   * @param {Date} val
   * @param {number} seconds
   * @returns {Date}
   */
  static addSeconds(val, seconds) {
    return Dates.addMilliseconds(val, seconds * 1000);
  }

  /**
   * Add given minutes to a date
   * @param {Date} val
   * @param {number} minutes
   * @returns {Date}
   */
  static addMinutes(val, minutes) {
    return Dates.addSeconds(val, minutes * 60);
  }

  /**
   * Add given hours to a date
   * @param {Date} val
   * @param {number} hours
   * @returns {Date}
   */
  static addHours(val, hours) {
    return Dates.addMinutes(val, hours * 60);
  }

  /**
   * Add given days to a date
   * @param {Date} val
   * @param {number} days
   * @returns {Date}
   */
  static addDays(val, days) {
    let date = new Date(val.getTime());
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Add given weeks to a date
   * @param {Date} val
   * @param {number} weeks
   * @returns  {Date}
   */
  static addWeeks(val, weeks) {
    return Dates.addDays(val, weeks * 7);
  }

  /**
   * Add given months to a date
   * @param {Date} val
   * @param {number} months
   * @returns {Date}
   */
  static addMonths(val, months) {
    let date = new Date(val.getTime());
    let n = val.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    date.setDate(Math.min(n, Dates.getDaysInMonth(date.getFullYear(), date.getMonth())));
    return date;
  }

  /**
   * Add given years to a date
   * @param {Date} val
   * @param {number} years
   * @returns {Date}
   */
  static addYears(val, years) {
    return Dates.addMonths(val, years * 12);
  }

  /**
   * Return minutes from two date
   * @param {Date} val1
   * @param {Date} val2
   * @returns {number}
   */
  static minuteDiff(val1, val2) {
    let diff = Math.abs(val2.getTime() - val1.getTime());
    return Math.ceil(diff / (1000 * 60));
  }

  /**
   * Return the number of days in a given month in a given year
   * @param {number} year
   * @param {number} month
   * @returns {number}
   */
  static getDaysInMonth(year, month) {
    let isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  }

  /**
   * Return the Easter date of a year
   * @param {number} year
   * @returns {Date}
   */
  static getEasterDate(year) {
    let a = year % 19;
    let b = Math.floor(year / 100);
    let c = year % 100;
    let d = Math.floor(b / 4);
    let e = b % 4;
    let f = Math.floor((b + 8) / 25);
    let g = Math.floor((b - f + 1) / 3);
    let h = (19 * a + b - d - g + 15) % 30;
    let i = Math.floor(c / 4);
    let k = c % 4;
    let l = (32 + 2 * e + 2 * i - h - k) % 7;
    let m = Math.floor((a + 11 * h + 22 * l) / 451);
    let n0 = h + l + 7 * m + 114;
    let n = Math.floor(n0 / 31) - 1;
    let p = (n0 % 31) + 1;
    let date = new Date(year, n, p);
    return date;
  }

  /**
   * @TODO use localization for festivities
   * Check if a date is a festivity date
   * @param {Date} value
   * @param {string[]} [excluded]
   * @param {{date: Date; description:string}[]} [added]
   * @returns {boolean}
   */
  static isItalianFestivity(value, excluded, added) {
    excluded = excluded || [];
    added = added || [];
    let festivities = [];
    if (excluded.indexOf("CAPODANNO") < 0) {
      festivities.push("01/01");
    }
    if (excluded.indexOf("EPIFANIA") < 0) {
      festivities.push("06/01");
    }
    if (excluded.indexOf("LIBERAZIONE") < 0) {
      festivities.push("25/04");
    }
    if (excluded.indexOf("LAVORATORI") < 0) {
      festivities.push("01/05");
    }
    if (excluded.indexOf("REPUBBLICA") < 0) {
      festivities.push("02/06");
    }
    if (excluded.indexOf("FERRAGOSTO") < 0) {
      festivities.push("15/08");
    }
    if (excluded.indexOf("OGNISSANTI") < 0) {
      festivities.push("01/11");
    }
    if (excluded.indexOf("IMMACOLATA") < 0) {
      festivities.push("08/12");
    }
    if (excluded.indexOf("NATALE") < 0) {
      festivities.push("25/12");
    }
    if (excluded.indexOf("SANTO_STEFANO") < 0) {
      festivities.push("26/12");
    }
    //Add Easter day and Easter monday to festivity list
    let _easter = Dates.getEasterDate(value.getFullYear());
    let _easterMonday = new Date(_easter.getTime());
    _easterMonday.setDate(_easterMonday.getDate() + 1);
    if (excluded.indexOf("PASQUA") < 0) {
      festivities.push(Utils.String.numberFormat(_easter.getDate(), 2) + "/" + Utils.String.numberFormat(_easter.getMonth() + 1, 2));
    }
    if (excluded.indexOf("PASQUETTA") < 0) {
      festivities.push(Utils.String.numberFormat(_easterMonday.getDate(), 2) + "/" + Utils.String.numberFormat(_easterMonday.getMonth() + 1, 2));
    }
    added.forEach((addingFestivity) => {
      festivities.push(addingFestivity.date);
    });

    if (festivities.indexOf(Utils.String.numberFormat(value.getDate(), 2) + "/" + Utils.String.numberFormat(value.getMonth() + 1, 2)) >= 0) {
      return true;
    }
    return false;
  }
}

export { Dates };
