import jwt from "jsonwebtoken";
import { v1 } from "uuid";
import _ from "lodash";
import moment from "moment";
import { MongoClienManager } from "./mongo-client-manager.mjs";
import { Collection, ObjectId } from "mongodb";

/**
 * @typedef {{
 * _id?: ObjectId;
 * refresh_token: string;
 * access_token: string;
 * id_user: number;
 * grants: Array<string>;
 * created: number;
 * last_seen: number;
 * user_agent?: string;
 * refresh_count: number;
 * refreshed?: number;
 * }} ISession
 */

/**
 * @typedef {{
 * id_user: number;
 * grants: Array<string>;
 * }} SessionData
 */

class SessionManager {
  /**
   * @type {number}
   * @private
   */
  __sessionExpiration;

  /**
   * @type {MongoClienManager}
   * @private
   */
  __mongoClient;

  /**
   *
   * @param {number} sessionExpiration
   * @param {MongoClienManager} mongoClient
   */
  constructor(sessionExpiration, mongoClient) {
    this.__sessionExpiration = sessionExpiration;
    this.__mongoClient = mongoClient;
  }

  /**
   *
   * @returns {Collection<ISession>}
   * @private
   */
  __getCollection() {
    return this.__mongoClient.db.collection("sessions");
  }

  /**
   * Create JWT token
   * @param {{id_user:number}} payload
   * @param {string} secret
   * @returns {Promise<string>}
   * @private
   */
  __signToken(payload, secret) {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, { expiresIn: this.__sessionExpiration }, (error, token) => {
        if (error) {
          reject(error);
        } else {
          resolve(token);
        }
      });
    });
  }

  /**
   * Verify if token is a valid JWT
   * @param {string} token
   * @param {string} secret
   * @returns {Promise<boolean>}
   * @private
   */
  __verifyToken(token, secret) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (error, decoded) => {
        if (error) {
          reject(error);
        } else if (!decoded) {
          reject(new Error("Token is invalid"));
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Store new Session into MongoDb
   * @param {SessionData} sessionData
   * @returns {Promise<ISession> }
   */
  async storeNewSession(sessionData) {
    try {
      let secret = v1();
      let jwtToken = await this.__signToken({ id_user: sessionData.id_user }, secret);
      let nowTS = moment().valueOf();
      /** @type {ISession} */
      let deviceSession = {
        ...sessionData,
        access_token: jwtToken,
        refresh_token: secret,
        created: nowTS,
        last_seen: nowTS,
        refresh_count: 0
      };
      await this.__getCollection().insertOne(deviceSession);
      return Promise.resolve(deviceSession);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Get secret with wich token is signed
   * @param {string} access_token
   * @returns {Promise<ISession | null>}
   * @private
   */
  async __getSession(access_token) {
    try {
      if (access_token) {
        return this.__getCollection().findOne({ access_token: access_token });
      } else {
        return Promise.reject(new Error("Empty token"));
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Get session data from a JWT
   * @param {string} access_token
   * @returns {Promise<ISession>}
   */
  async getSession(access_token) {
    try {
      let deviceSession = await this.__getSession(access_token);
      if (deviceSession && (await this.__verifyToken(deviceSession.access_token, deviceSession.refresh_token))) {
        return Promise.resolve(deviceSession);
      } else {
        return Promise.reject(new Error("Invalid token"));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {string} refresh_token
   * @returns {Promise<import("mongodb").WithId<ISession>>}
   */
  async getSessionByRefeshToken(refresh_token) {
    try {
      return await this.__getCollection().findOne({ refresh_token: refresh_token });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Remove session from MongoDb
   * @param {string} access_token
   * @returns {Promise<number>}
   */
  async removeToken(access_token) {
    try {
      let result = await this.__getCollection().deleteOne({
        access_token: access_token
      });
      return Promise.resolve(result.deletedCount || 0);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Given a device session record, generate a new access token
   * @param {string} refresh_token
   * @returns {Promise<ISession | null>}
   */
  async updateDeviceSession(refresh_token) {
    try {
      let deviceSession = await this.getSessionByRefeshToken(refresh_token);
      if (deviceSession && deviceSession._id) {
        let accessToken = await this.__signToken({ id_user: deviceSession.id_user }, deviceSession.refresh_token);
        await this.__getCollection().updateOne(
          {
            _id: deviceSession._id
          },
          {
            $set: {
              access_token: accessToken,
              refresh_count: (deviceSession.refresh_count || 0) + 1,
              last_seen: moment().utc().valueOf(),
              refreshed: moment().utc().valueOf()
            }
          }
        );
        deviceSession.access_token = accessToken;
        return Promise.resolve(deviceSession);
      }
      return Promise.resolve(null);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Given a device session record, generate a new access token and update grants
   * @param {ISession} deviceSession
   * @returns {Promise<ISession | null>}
   */
  async updateDeviceSessionAndGrants(deviceSession) {
    try {
      if (deviceSession && deviceSession._id) {
        deviceSession.access_token = await this.__signToken({ id_user: deviceSession.id_user }, deviceSession.refresh_token);
        deviceSession.refresh_count = (deviceSession.refresh_count || 0) + 1;
        deviceSession.last_seen = moment().utc().valueOf();
        deviceSession.refreshed = moment().utc().valueOf();
        await this.__getCollection().updateOne(
          {
            _id: deviceSession._id
          },
          {
            $set: {
              access_token: deviceSession.access_token,
              refresh_count: deviceSession.refresh_count,
              last_seen: deviceSession.last_seen,
              refreshed: deviceSession.refreshed,
              grants: deviceSession.grants,
              features: deviceSession.features
            }
          }
        );
        return Promise.resolve(deviceSession);
      }
      return Promise.resolve(null);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { SessionManager };
