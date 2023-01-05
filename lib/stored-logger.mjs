"use strict";

import { MongoClienManager } from "./mongo-client-manager.mjs";
import { Logger } from "./logger.mjs";
import moment from "moment";

const StoredLogScopes = {
  NOTIFICATIONS: "NOTIFICATIONS"
};

const StoredLogTypes = {
  INFO: "INFO",
  ERROR: "ERROR"
};

/**
 * @typedef {{
 * scope: string;
 * type: string;
 * message?: string;
 * }} StoredLog
 */

class StoredLogger {
  /**
   * @type {MongoClienManager}
   * @private
   */
  __dbMan;
  /**
   * @type {Logger}
   * @private
   */
  __logger;

  /**
   *
   * @param {MongoClienManager} __dbMan
   * @param {Logger} __logger
   */
  constructor(__dbMan, __logger) {
    this.__dbMan = __dbMan;
    this.__logger = __logger;
  }

  /**
   *
   * @param {StoredLog} log
   * @returns {Promise<void>}
   */
  async add(log) {
    try {
      await this.__dbMan.db.collection("logs").insertOne({
        ...log,
        date: moment().toISOString(true)
      });
    } catch (e) {
      this.__logger.error(e);
    }
    return Promise.resolve();
  }
}

export { StoredLogger, StoredLogScopes, StoredLogTypes };
