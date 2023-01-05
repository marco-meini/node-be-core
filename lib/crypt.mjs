"use strict";

import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as crypto from "crypto";
import _ from "lodash";

class Crypt {
  /**
   *
   * @param {string} plain
   * @returns {Promise<string>}
   */
  static hash(plain) {
    return bcrypt.hash(plain, 10);
  }

  /**
   *
   * @param {string} plain
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  static compare(plain, hash) {
    return bcrypt.compare(plain, hash);
  }

  /**
   *
   * @param {string} plain
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  static async validateHash(plain, hash) {
    try {
      if (_.isEmpty(plain)) {
        return Promise.resolve(false);
      } else if (_.isEmpty(hash)) {
        return Promise.resolve(false);
      } else {
        let result = await Crypt.compare(plain, hash);
        return Promise.resolve(result);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {string} val
   * @param {string} [charset]
   * @returns {string}
   */
  static base64encode(val, charset) {
    charset = charset || "utf8";
    return Buffer.from(val).toString("base64");
  }

  /**
   *
   * @param {string} base64
   * @param {any} [charset]
   * @returns {string}
   */
  static base64Decode(base64, charset) {
    charset = charset || "utf8";
    return Buffer.from(base64, "base64").toString(charset);
  }

  /**
   *
   * @param {string} filePath
   * @param {any} encoding
   * @returns {Promise<string>}
   */
  static fileToMd5(filePath, encoding = "hex") {
    return new Promise((resolve, reject) => {
      try {
        let stream = fs.createReadStream(filePath);
        let hash = crypto.createHash("md5");
        hash.setEncoding(encoding);
        stream.on("end", () => {
          hash.end();
          resolve(hash.read());
        });
        stream.pipe(hash);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   *
   * @param {Buffer} file
   * @param {any} encoding
   * @returns {Promise<string>
   */
  static bufferToMd5(file, encoding = "hex") {
    return new Promise((resolve, reject) => {
      try {
        let hash = crypto.createHash("md5");
        hash.update(file);
        resolve(hash.digest(encoding));
      } catch (e) {
        reject(e);
      }
    });
  }
}

export { Crypt };
