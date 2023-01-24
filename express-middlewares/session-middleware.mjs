import { HttpResponseStatus } from "../enums.mjs";
import { MongoClienManager } from "../lib/mongo-client-manager.mjs";
import { SessionManager } from "../lib/session-manager.mjs";

/**
 * @typedef {{
 * session?: import("../lib/session-manager.mjs").ISession,
 * } & import("express").Request} SessionRequest
 */

class SessionMiddleware {
  /**
   * @type {SessionManager}
   */
  sessionManager;

  /** @type {string} */
  sessionHeaderName;

  /**
   *
   * @param {string} sessionHeaderName
   * @param {number} sessionExpiration
   * @param {MongoClienManager} mongoClient
   */
  constructor(sessionHeaderName, sessionExpiration, mongoClient) {
    this.sessionHeaderName = sessionHeaderName;
    this.sessionManager = new SessionManager(sessionExpiration, mongoClient);
  }

  /**
   *
   * @param {SessionRequest} request
   * @returns
   */
  getToken(request) {
    let header = request.header(this.sessionHeaderName);
    if (header.startsWith("Bearer")) {
      let headerSplit = header.split(" ");
      return headerSplit.length > 1 ? headerSplit[1] : "";
    }
    return "";
  }

  /**
   *
   * @param {SessionRequest} request
   * @param {import("express").Response} response
   * @param {string} newToken
   */
  updateResponseToken(request, response, newToken) {
    response.setHeader(this.sessionHeaderName, newToken);
  }

  /**
   *
   * @returns {import("express").RequestHandler}
   */
  checkAuthentication() {
    return async (
      /**@type {SessionRequest} */
      request,
      response,
      next
    ) => {
      try {
        let token = this.getToken(request);
        if (token) {
          request.session = await this.sessionManager.getSession(token);
          next();
        } else {
          response.setHeader("WWW-Authenticate", 'Bearer realm="pania"');
          response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
        }
      } catch (e) {
        response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
      }
    };
  }

  /**
   *
   * @param {string} permission
   * @returns {import("express").RequestHandler}
   */
  checkPermission(permission) {
    return async (
      /** @type {SessionRequest} */
      request,
      response,
      next
    ) => {
      try {
        let token = this.getToken(request);
        if (token) {
          let sessionData = await this.sessionManager.getSession(token);
          if (sessionData.grants.indexOf(permission) < 0) {
            response.sendStatus(HttpResponseStatus.NOT_AUTHORIZED);
          } else {
            request.session = sessionData;
            next();
          }
        } else {
          response.setHeader("WWW-Authenticate", 'Bearer realm="youneed"');
          response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
        }
      } catch (e) {
        response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
      }
    };
  }

  /**
   *
   * @param {string[]} permissions
   * @returns {import("express").RequestHandler}
   */
  checkAtLeastOnePermission(permissions) {
    return async (
      /** @type {SessionRequest} */
      request,
      response,
      next
    ) => {
      try {
        let token = this.getToken(request);
        let sessionData = await this.sessionManager.getSession(token);
        let authorized = false;
        permissions.forEach((permission) => {
          if (sessionData.grants.indexOf(permission) >= 0) {
            authorized = true;
            return;
          }
        });
        if (!authorized) {
          response.sendStatus(HttpResponseStatus.NOT_AUTHORIZED);
        } else {
          request.session = sessionData;
          next();
        }
      } catch (e) {
        response.setHeader("WWW-Authenticate", 'Bearer realm="youneed"');
        response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
      }
    };
  }
}

export { SessionMiddleware };
