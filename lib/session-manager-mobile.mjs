import jwt from "jsonwebtoken";
import { v1 } from "uuid";
import _ from "lodash";
import moment from "moment";
import { MongoClienManager } from "./mongo-client-manager.mjs";
import { Collection, ObjectId } from "mongodb";

const OS = {
  ANDROID: "ANDROID",
  iOS: "iOS"
};

/**
 * @typedef {{
 * _id?: ObjectId;
 * refresh_token: string;
 * access_token: string;
 * user_id: number;
 * customer_id: number;
 * pbx_id: number;
 * pbx_supplier?: string;
 * application_id?: string;
 * grants: Array<string>;
 * gcm_token?: string;
 * apn_token?: {
 *  token: string;
 *  is_sandbox: boolean;
 * };
 * apn_voip_token?: {
 *  token: string;
 *  is_sandbox: boolean;
 * };
 * created: number;
 * last_seen: number;
 * user_agent?: string;
 * os: OS;
 * refresh_count: number;
 * refreshed?: number;
 * features: {
 *  [key: string]: boolean
 * }
 * }} DeviceSession
 */

/**
 * @typedef {{
 * user_id: number;
 * customer_id: number;
 * pbx_id: number;
 * pbx_supplier?: string;
 * application_id?: string;
 * grants: Array<string>;
 * os: OS;
 * features: {
 *  [key: string]: boolean
 * }
 * }} SessionData
 */

class SessionManagerMobile {
  /**
   * @type {{ short: number; long: number }}
   * @private
   */
  sessionExpiration;

  /**
   * @type {MongoClienManager}
   * @private
   */
  mongoClient;

  /**
   *
   * @param {{ short: number; long: number }} sessionExpiration
   * @param {MongoClienManager} mongoClient
   */
  constructor(sessionExpiration, mongoClient) {
    (this.sessionExpiration = sessionExpiration), (this.mongoClient = mongoClient);
  }

  /**
   *
   * @returns {Collection<DeviceSession>}
   * @private
   */
  __getCollection() {
    return this.mongoClient.db.collection("devices_session");
  }

  /**
   * Create JWT token
   * @param {string} secret
   * @returns {Promise<string>}
   * @private
   */
  __signToken(secret) {
    return new Promise((resolve, reject) => {
      jwt.sign({}, secret, { expiresIn: this.sessionExpiration.short }, (error, token) => {
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
   * @returns {Promise<DeviceSession> }
   */
  async storeNewSession(sessionData) {
    try {
      let secret = v1();
      let jwtToken = await this.__signToken(secret);
      let nowTS = moment().valueOf();
      /** @type {DeviceSession} */
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
   * @param {string} token
   * @returns {Promise<DeviceSession | null>}
   * @private
   */
  async __getSession(token) {
    try {
      if (token) {
        return this.__getCollection().findOne({ access_token: token });
      } else {
        return Promise.reject(new Error("Empty token"));
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Get session data from a JWT
   * @param {string} token
   * @returns {Promise<DeviceSession>}
   */
  async getSession(token) {
    try {
      let deviceSession = await this.__getSession(token);
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
   * @param {string} refreshToken
   * @returns {Promise<import("mongodb").WithId<DeviceSession>>}
   */
  async getSessionByRefeshToken(refreshToken) {
    try {
      return await this.__getCollection().findOne({ refresh_token: refreshToken });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Remove session from MongoDb
   * @param {string} refreshToken
   * @returns {Promise<number>}
   */
  async removeToken(refreshToken) {
    try {
      let result = await this.__getCollection().deleteOne({
        refresh_token: refreshToken
      });
      return Promise.resolve(result.deletedCount || 0);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Given a device session record, generate a new access token
   * @param {string} refreshToken
   * @returns {Promise<DeviceSession | null>}
   */
  async updateDeviceSession(refreshToken) {
    try {
      let deviceSession = await this.getSessionByRefeshToken(refreshToken);
      if (deviceSession && deviceSession._id) {
        let accessToken = await this.__signToken(deviceSession.refresh_token);
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
   * @param {DeviceSession} deviceSession
   * @returns {Promise<DeviceSession | null>}
   */
  async updateDeviceSessionAndGrants(deviceSession) {
    try {
      if (deviceSession && deviceSession._id) {
        deviceSession.access_token = await this.__signToken(deviceSession.refresh_token);
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

  /**
   *
   * @param {string} token
   */
  async __removeApnToken(token) {
    try {
      // remove previous used tokens
      await this.__getCollection().updateMany(
        {
          "apn_token.token": token
        },
        {
          $unset: { apn_token: "" }
        }
      );
      await this.__getCollection().updateMany(
        {
          "apn_voip_token.token": token
        },
        {
          $unset: { apn_voip_token: "" }
        }
      );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {DeviceSession} session
   * @param {{
   * token: string,
   * is_sandbox?: boolean,
   * is_voip?: boolean
   * }} tokenData
   */
  async updateApnToken(session, tokenData) {
    try {
      await this.__removeApnToken(tokenData.token);
      let _token = {
        token: tokenData.token,
        is_sandbox: tokenData.is_sandbox ?? false
      };
      /** @type {import("mongodb").MatchKeysAndValues<DeviceSession>} */
      let _set = tokenData.is_voip ? { apn_voip_token: _token } : { apn_token: _token };
      await this.__getCollection().updateOne(
        {
          _id: session._id
        },
        {
          $set: _set
        }
      );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {string} token
   */
  async __removeGcmToken(token) {
    try {
      await this.__getCollection().updateMany(
        {
          gcm_token: token
        },
        {
          $unset: { gcm_token: "" }
        }
      );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {DeviceSession} session
   * @param {string} token
   */
  async updateGcmToken(session, token) {
    try {
      await this.__removeGcmToken(token);
      await this.__getCollection().updateOne(
        {
          _id: session._id
        },
        {
          $set: {
            gcm_token: token
          }
        }
      );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { SessionManagerMobile, OS };
