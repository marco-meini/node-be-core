import { MongoClient, Db } from "mongodb";

/**
 * @typedef {{
 * host: string;
 * port: number;
 * db: string;
 * }} MongoDbConfig
 */

class MongoClienManager {
  /**
   * @type {MongoClient}
   * @private
   */
  client;
  /** @type {Db} */
  db;
  /**
   * @type {MongoDbConfig | string}
   * @private
   */
  __dbconfig;
  /**
   * @type {import("mongodb").MongoClientOptions}
   * @private
   */
  __options;
  constructor(__dbconfig, __options) {
    this.__dbconfig = __dbconfig;
    this.__options = __options;
  }

  /**
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      if (typeof this.__dbconfig === "string") {
        this.client = await MongoClient.connect(this.__dbconfig, this.__options);
        this.db = this.client.db();
      } else {
        this.client = await MongoClient.connect(`mongodb://${this.__dbconfig.host}:${this.__dbconfig.port}/${this.__dbconfig.db}`, this.__options);
        this.db = this.client.db(this.__dbconfig.db);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  disconnect() {
    this.client.close();
  }
}

export { MongoClienManager };
