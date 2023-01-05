import { PgClientManager } from "../lib/pg-client-manager.mjs";

class Abstract_PgModel {
  /**
   *
   * @param {PgClientManager} connection
   */
  constructor(connection) {
    /** @type {PgClientManager} */
    this.__connection = connection;
  }
}

export { Abstract_PgModel };
