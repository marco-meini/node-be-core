import { HttpResponseStatus } from "../enums.mjs";
import { MongoClienManager } from "../lib/mongo-client-manager.mjs";
import { SessionManager } from "../lib/session-manager.mjs";

/**
 * @typedef {{
 * session?: import("../lib/session-manager.mjs").ISession,
 * } & import("express").Request} SessionRequest
 */

/**
 * @typedef {{
 * cookie?: { name: string },
 * header?: { name: string },
 * expiration: number
 * }} IOptions
 */

class SessionMiddleware {
  /**
   * @type {SessionManager}
   */
  sessionManager;

  /** @type {string} */
  sessionHeaderName;

  /** @type {string} */
  cookieName;

  /** @type {IOptions} */
  options;

  /**
   *
   * @param {IOptions} options
   * @param {MongoClienManager} mongoClient
   */
  constructor(options, mongoClient) {
    this.options = options;
    this.sessionManager = new SessionManager(sessionExpiration, mongoClient);
  }

  /**
   *
   * @param {SessionRequest} request
   * @returns
   */
  getToken(request) {
    if (this.options.cookie) {
      return request.cookies[this.options.cookie.name];
    }
    if (this.options.header) {
      let header = request.header[this.options.header.name];
      if (header.startsWith("Bearer")) {
        let headerSplit = header.split(" ");
        return headerSplit.length > 1 ? headerSplit[1] : "";
      }
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
    if (this.options.cookie) {
      response.cookie(this.options.cookie.name, newToken, {
        httpOnly: true,
        sameSite: true,
        expires: moment().add(this.options.expiration, "seconds").toDate(),
        secure: true
      });
    }
    if (this.options.header) {
      response.setHeader(this.options.header.name, newToken);
    }
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
