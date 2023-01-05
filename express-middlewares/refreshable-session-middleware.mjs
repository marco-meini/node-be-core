import { NethServerSession } from "../lib/neth-server-session.mjs";
import { HttpResponseStatus } from "../enums.mjs";
import { MongoClienManager } from "../lib/mongo-client-manager.mjs";
import { PgClientManager } from "../lib/pg-client-manager.mjs";
import { SessionManagerMobile } from "../lib/session-manager-mobile.mjs";

/**
 * @typedef {{
 * session?: import("../lib/session-manager-mobile.mjs").DeviceSession;
 * nethServerSession?: NethServerSession;
 * } & import("express").Request} MobileSessionRequest
 */

class RefreshableSessionMiddleware {
  /**
   * @type {SessionManagerMobile}
   */
  sessionManager;

  /** @type {string} */
  sessionHeaderName;

  /**
   *
   * @param {string} sessionHeaderName
   * @param {{ short: number; long: number }} sessionExpiration
   * @param {MongoClienManager} mongoClient
   */
  constructor(sessionHeaderName, sessionExpiration, mongoClient) {
    this.sessionHeaderName = sessionHeaderName;
    this.sessionManager = new SessionManagerMobile(sessionExpiration, mongoClient);
  }

  /**
   *
   * @param {MobileSessionRequest} request
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
   * @param {MobileSessionRequest} request
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
      /**@type {MobileSessionRequest} */
      request,
      response,
      next
    ) => {
      try {
        let token = this.getToken(request);
        if (token) {
          let sessionData = await this.sessionManager.getSession(token);
          request.session = sessionData;
          request.token = token;
          next();
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
   * @param {string} permission
   * @returns {import("express").RequestHandler}
   */
  checkPermission(permission) {
    return async (
      /** @type {MobileSessionRequest} */
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
            request.token = token;
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
      /** @type {MobileSessionRequest} */
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
          request.token = token;
          next();
        }
      } catch (e) {
        response.setHeader("WWW-Authenticate", 'Bearer realm="youneed"');
        response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
      }
    };
  }

  /**
   *
   * @param {string} feature
   * @returns {import("express").RequestHandler}
   */
  checkFeature(feature) {
    return async (
      /** @type {MobileSessionRequest} */
      request,
      response,
      next
    ) => {
      try {
        let token = this.getToken(request);
        if (token) {
          let sessionData = await this.sessionManager.getSession(token);
          if (sessionData.features && sessionData.features[feature]) {
            request.session = sessionData;
            request.token = token;
            next();
          } else {
            response.sendStatus(HttpResponseStatus.NOT_AUTHORIZED);
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
   * @param {PgClientManager} connection
   * @returns
   */
  netheserverAuthentication(connection) {
    return async (
      /** @type {MobileSessionRequest} */
      request,
      response,
      next
    ) => {
      try {
        let token = this.getToken(request);
        if (token) {
          let sessionData = await this.sessionManager.getSession(token);
          if (sessionData.pbx_supplier !== NethServerSession.supplierName) {
            response.sendStatus(HttpResponseStatus.NOT_AUTHORIZED);
          } else {
            let sql = `select a.extensions_us->'main' as main_extension
            , b.protocol_pb
            , b.url_pb
            , b.port_pb
            , b.pbx_supplier_pb
            from users_us a
            inner join pbx_pb b on a.id_pbx_us=b.id_pb
            where a.id_us=$1`;
            /**
             * @type {{
             * main_extension: {
             *   number: string;
             *   username: string;
             *   password: string;
             * };
             * url_pb: string;
             * port_pb: string;
             * protocol_pb: string;
             * pbx_supplier_pb: string;
             * }}
             * */
            let user = await connection.queryReturnFirst({ sql: sql, replacements: [sessionData.user_id] });
            if (user) {
              request.nethServerSession = new NethServerSession(
                {
                  url: user.url_pb,
                  port: user.port_pb,
                  protocol: user.protocol_pb,
                  supplier: user.pbx_supplier_pb
                },
                user.main_extension
              );
              try {
                await request.nethServerSession.login();
                request.session = sessionData;
                request.token = token;
                next();
              } catch (e) {
                response.sendStatus(HttpResponseStatus.NOT_AUTHORIZED);
              }
            } else {
              response.setHeader("WWW-Authenticate", 'Bearer realm="youneed"');
              response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
            }
          }
        } else {
          response.setHeader("WWW-Authenticate", 'Bearer realm="youneed"');
          response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
        }
      } catch (e) {
        response.setHeader("WWW-Authenticate", 'Bearer realm="youneed"');
        response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
      }
    };
  }
}

export { RefreshableSessionMiddleware };
