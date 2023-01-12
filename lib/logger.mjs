"use strict";

import moment from "moment";

const LogLevel = {
  ERRORS: 1,
  WARNINGS: 2,
  INFO: 3,
  SQL: 4
};

class Logger {
  constructor(logLevel) {
    this.logLevel = logLevel;
  }
  info(...args) {
    if (this.logLevel >= LogLevel.INFO) {
      let date = moment().format("YYYY-MM-DD HH:mm:ss");
      console.info("[", date, "]", ...args);
    }
  }
  error(...args) {
    if (this.logLevel >= LogLevel.ERRORS) {
      let date = moment().format("YYYY-MM-DD HH:mm:ss");
      console.error("[", date, "]", ...args);
    }
  }
  warning(...args) {
    if (this.logLevel >= LogLevel.WARNINGS) {
      let date = moment().format("YYYY-MM-DD HH:mm:ss");
      console.warn("[", date, "]", ...args);
    }
  }
  sql(sql) {
    if (this.logLevel >= LogLevel.SQL) {
      let date = moment().format("YYYY-MM-DD HH:mm:ss");
      console.info("[", date, "]", sql);
    }
  }
}

export { LogLevel, Logger };