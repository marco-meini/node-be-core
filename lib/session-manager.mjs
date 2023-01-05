import * as jwt from "jsonwebtoken";
import * as redis from "redis";
import { v1 } from "uuid";
import _ from "lodash";
import { RedisDb } from "../enums.mjs";

const NotificationServices = {
  GOOGLE: "GOOGLE",
  APPLE: "APPLE"
};

const SessionSources = {
  MOBILE: "MOBILE"
};

/**
 * @typedef {{
 * idUser: number;
 * idPbx: number;
 * idCustomer: number;
 * grants: Array<string>;
 * persistent: boolean;
 * pbxSupplier?: string;
 * applicationId?: string;
 * source?: SessionSources;
 * }} SessionPayload
 */

class SessionManager {
  /**
   * @type {ReturnType<typeof redis.createClient>}
   * @private
   */
  __redisClientTokens;
  /**
   * @type {ReturnType<typeof redis.createClient>}
   * @private
   */
  __redisClientUsers;
  /**
   * @type {ReturnType<typeof redis.createClient>}
   * @private
   */
  __redisClientTokenToModify;
  /**
   * @type {import("redis").RedisClientOptions}
   * @private
   */
  __redisOptions;
  /**
   * @type {{ short: number; long: number }}
   * @private
   */
  __sessionExpiration;

  /**
   *
   * @param {import("redis").RedisClientOptions} redisOptions
   * @param {{ short: number; long: number }} sessionExpiration
   */
  constructor(redisOptions, sessionExpiration) {
    this.__redisOptions = redisOptions;
    this.__sessionExpiration = sessionExpiration;

    let optionsTokens = {
      ...this.__redisOptions,
      database: RedisDb.TOKEN_SECRETS
    };
    let optionsUsers = {
      ...this.__redisOptions,
      database: RedisDb.USER_TOKENS
    };
    let optionsTokenToModify = {
      ...this.__redisOptions,
      database: RedisDb.TOKEN_TO_MODIFY
    };

    this.__redisClientTokens = redis.createClient(optionsTokens);
    this.__redisClientUsers = redis.createClient(optionsUsers);
    this.__redisClientTokenToModify = redis.createClient(optionsTokenToModify);
  }

  /**
   * Create JWT token
   * @param {SessionPayload} sessionData
   * @param {string} secret
   * @param {number} expireIn
   * @returns {Promise<string>}
   * @private
   */
  __signToken(sessionData, secret, expireIn) {
    return (
      new Promise() <
      string >
      ((resolve, reject) => {
        jwt.sign(sessionData, secret, { expiresIn: expireIn }, (error, token) => {
          if (error) {
            reject(error);
          } else {
            resolve(token);
          }
        });
      })
    );
  }

  /**
   * Verify if token is a valid JWT
   * @param {string} token
   * @param {string} secret
   * @returns { Promise<SessionPayload>}
   * @private
   */
  __verifyToken(token, secret) {
    return (
      new Promise() <
      SessionPayload >
      ((resolve, reject) => {
        jwt.verify(token, secret, (error, decoded) => {
          if (error) {
            reject(error);
          } else if (!decoded) {
            reject(new Error("Token is invalid"));
          } else {
            resolve(decoded);
          }
        });
      })
    );
  }

  /**
   * Store new Token into Redis
   * @param {number} userId
   * @param {string} token
   * @param {string} secret
   * @param {number} expireIn
   * @returns {Promise<void>}
   * @private
   */
  async __storeNewToken(userId, token, secret, expireIn) {
    try {
      await this.__redisClientTokens.set(token, secret, { EX: expireIn });
      await this.__redisClientUsers.lPush(userId.toString(), token);
      return Promise.resolve();
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Get secret with wich token is signed
   * @param {string} token
   * @returns {Promise<string | null>}
   * @private
   */
  async __getSecret(token) {
    try {
      if (token) {
        let secret = await this.__redisClientTokens.get(token);
        return Promise.resolve(secret);
      } else {
        return Promise.reject(new Error("Empty token"));
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Create a new JWT and store it into Redis
   * @param {SessionPayload} sessionData
   * @returns {Promise<string>}
   */
  async set(sessionData) {
    try {
      let expireIn = sessionData.persistent ? this.__sessionExpiration.long : this.__sessionExpiration.short;
      let secret = v1();
      let jwtToken = await this.__signToken(sessionData, secret, expireIn);
      await this.__storeNewToken(sessionData.idUser, jwtToken, secret, expireIn);
      return Promise.resolve(jwtToken);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Mark token as "To be refreshed" with new data
   * @param {string} token
   * @param {SessionPayload} sessionData
   * @returns {Promise<void>}
   */
  async update(token, sessionData) {
    try {
      await this.__redisClientTokenToModify.set(token, JSON.stringify(sessionData));
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Check if JWT token is signed as "To be refreshed"
   * @param {string} token
   * @returns {Promise<SessionPayload | null>}
   */
  async checkRefresh(token) {
    try {
      let result = await this.__redisClientTokenToModify.get(token);
      if (result) {
        let payload = JSON.parse(result);
        return Promise.resolve(payload);
      } else {
        return Promise.resolve(null);
      }
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Remove old JWT token and create a new one with new data
   * @param {string} token
   * @param {SessionPayload} sessionData
   * @returns {Promise<string>}
   */
  async refreshToken(token, sessionData) {
    try {
      await this.removeToken(token, sessionData.idUser);
      let newToken = await this.set(sessionData);
      return Promise.resolve(newToken);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Get session data from a JWT
   * @param {string} token
   * @returns {Promise<SessionPayload>}
   */
  async get(token) {
    try {
      let secret = await this.__getSecret(token);
      let data = await this.__verifyToken(token, secret);
      return Promise.resolve(data);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Get user's valit tokens
   * @param {number} userId
   * @returns {Promise<string[]>}
   */
  async getUserValidTokes(userId) {
    try {
      let values = await this.__redisClientUsers.lRange(userId.toString(), 0, -1);
      return Promise.resolve(values);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Remove JWT token from Redis
   * @param {string} token
   * @param {number} userId
   * @returns {Promise<void>}
   */
  async removeToken(token, userId) {
    try {
      await this.__redisClientTokens.del(token);
      await this.__redisClientUsers.lRem(userId.toString(), 0, token);
      await this.__redisClientTokenToModify.del(token);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  /**
   * Loop all active tokens of an user and check if grants have been modified.
   * If yes mark these tokens as to be refreshed
   * @param {number} userId
   * @param {Array<string>} grants
   * @returns {Promise<void>}
   */
  async updateUserGrants(userId, grants) {
    try {
      let tokens = await this.getUserValidTokes(userId);
      for (let token of tokens) {
        /** @type {SessionPayload} */
        let payload = jwt.decode(token);
        if (!_.isEqual(payload.grants, grants)) {
          try {
            if (payload.source === SessionSources.MOBILE) {
              await this.removeToken(token, payload.idUser);
            } else {
              await this.update(token, {
                grants: grants,
                idCustomer: payload.idCustomer,
                idPbx: payload.idPbx,
                idUser: payload.idUser,
                persistent: payload.persistent,
                applicationId: payload.applicationId,
                pbxSupplier: payload.pbxSupplier
              });
            }
          } catch (ex) {
            throw ex;
          }
        }
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async connect() {
    try {
      await this.__redisClientTokens.connect();
      await this.__redisClientUsers.connect();
      await this.__redisClientTokenToModify.connect();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Close all redis client connections
   */
  async end() {
    try {
      await this.__redisClientTokens.disconnect();
      await this.__redisClientUsers.disconnect();
      await this.__redisClientTokenToModify.disconnect();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { SessionManager, SessionSources, NotificationServices };
