import { PgClientManager } from "../lib/pg-client-manager.mjs";

class Abstract_PgModel {
  /**
   * @type {PgClientManager}
   * @private
   */
  __connection;

  /**
   *
   * @param {PgClientManager} connection
   */
  constructor(connection) {
    this.__connection = connection;
  }
}

export { Abstract_PgModel };
