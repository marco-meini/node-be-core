"use strict";

import pkg from "pg";

/**
 * @typedef {object} QueryOptions
 * @property {string} sql
 * @property {Array<any>} [replacements]
 * @property {import("pg").PoolClient} [transactionClient]
 */

class PgClientManager {
  /**
   * @type {pkg.Pool}
   * @private
   */
  __pool;
  /**
   * @type {(sql: string) => void}
   * @private
   */
  __logger;

  /**
   *
   * @param {import("pg").PoolConfig} config
   * @param {(sql: string) => void} [__logger]
   */
  constructor(config, __logger) {
    this.__pool = new pkg.Pool(config);
    if (__logger) this.__logger = __logger;
  }

  /**
   * @returns {Promise<PoolClient>}
   */
  async startTransaction() {
    /**
     * @type {import("pg").PoolClient}
     */
    let transactionClient = null;
    try {
      transactionClient = await this.__pool.connect();
      await transactionClient.query("BEGIN");
      return Promise.resolve(transactionClient);
    } catch (e) {
      if (transactionClient) transactionClient.release();
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {import("pg").PoolClient} transactionClient
   * @returns {Promise<void>}
   */
  async commit(transactionClient) {
    try {
      if (transactionClient) {
        await transactionClient.query("COMMIT");
        transactionClient.release();
        return Promise.resolve();
      } else {
        return Promise.reject(new Error("Try to commit a not initialized transaction"));
      }
    } catch (e) {
      if (transactionClient) transactionClient.release();
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {import("pg").PoolClient} transactionClient
   * @returns {Promise<void>}
   */
  async rollback(transactionClient) {
    try {
      if (transactionClient) {
        await transactionClient.query("ROLLBACK");
        transactionClient.release();
        return Promise.resolve();
      } else {
        return Promise.reject(new Error("Try to rollback a not initialized transaction"));
      }
    } catch (e) {
      if (transactionClient) transactionClient.release();
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {QueryOptions} options
   * @returns {Promise<import("pg").QueryResult>}
   */
  async query(options) {
    try {
      if (this.__logger) {
        this.__logger(options.sql);
        if (options.replacements && options.replacements.length) this.__logger(`REPLACEMENT: ${JSON.stringify(options.replacements)}`);
      }
      if (options.transactionClient) {
        return options.transactionClient.query(options.sql, options.replacements);
      } else {
        return this.__pool.query(options.sql, options.replacements);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {QueryOptions} options
   * @returns {Promise<any>}
   */
  async queryReturnFirst(options) {
    try {
      if (this.__logger) {
        this.__logger(options.sql);
        if (options.replacements && options.replacements.length) this.__logger(`REPLACEMENT: ${JSON.stringify(options.replacements)}`);
      }
      /**
       * @type {import("pg").QueryResult}
       */
      let result;
      if (options.transactionClient) {
        result = await options.transactionClient.query(options.sql, options.replacements);
      } else {
        result = await this.__pool.query(options.sql, options.replacements);
      }
      if (result.rowCount > 0) {
        return Promise.resolve(result.rows[0]);
      } else {
        return Promise.resolve(null);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {any} item
   * @param {string} tableName
   * @returns
   */
  async insert(item, tableName) {
    try {
      let columns = [];
      let values = [];
      let indexes = [];
      let k = 1;
      for (let p in item) {
        columns.push(p);
        values.push(item[p]);
        indexes.push(`$${k}`);
        k++;
      }
      let sql = `insert into ${tableName} (${columns.join(",")}) values (${indexes.join(",")}) returning *`;
      let insertedItem = await this.queryReturnFirst({ sql: sql, replacements: values });
      return Promise.resolve(insertedItem);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {any} item
   * @param {Array<string>} fieldsToUpdate
   * @param {Array<string>} keys
   * @param {string} tableName
   * @returns {Promise<void>}
   */
  async updateByKey(item, fieldsToUpdate, keys, tableName) {
    try {
      let sets = [];
      let where = [];
      let values = [];
      let k = 1;
      for (let p in item) {
        if (fieldsToUpdate.indexOf(p) >= 0) {
          sets.push(`${p}=$${k}`);
          values.push(item[p]);
          k++;
        }
        if (keys.indexOf(p) >= 0) {
          where.push(`${p}=$${k}`);
          values.push(item[p]);
          k++;
        }
      }

      if (sets.length) {
        let sql = `update ${tableName} SET ${sets.join(",")}`;
        if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
        await this.query({ sql: sql, replacements: values });
      }

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async disconnect() {
    await this.__pool.end();
  }
}

export { PgClientManager };
