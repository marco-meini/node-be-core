"use strict";

import * as https from "https";
import * as fs from "fs";

const HttpsResponseType = {
  TEXT: "TEXT",
  JSON: "JSON",
  FILE: "FILE",
  EMPTY: "EMPTY"
};

/**
 * @typedef {object} HttpsPostRequestOptions
 * @property {string} [contentType]
 * @property {string} responseType
 * @property {{[key: string]: any;}} [query]
 * @property {{[key: string]: any;}} [headers]
 * @property {string} [outputFilePath]
 * @property {object} [body]
 */

/**
 * @typedef {object} HttpsGetRequestOptions
 * @property {string} [contentType]
 * @property {string} responseType
 * @property {{[key: string]: any;}} [query]
 * @property {{[key: string]: any;}} [headers]
 * @property {string} [outputFilePath]
 */

/**
 * @typedef {object} HttpsResponse
 * @property {object} [body]
 * @property {import("http").IncomingHttpHeaders} headers
 * @property {number} [statusCode]
 * @property {string} [statusMessage]
 */

/**
 *
 * @param {string} url
 * @param {HttpsPostRequestOptions | HttpsGetRequestOptions} options
 * @param {string} responseType
 * @param {object} [body]
 * @param {string} [outputFilePath]
 * @returns {Promise<HttpsResponse>}
 */
const httpsPromised = (url, options, responseType, body, outputFilePath) => {
  return new Promise((resolve, reject) => {
    if (responseType === HttpsResponseType.FILE && !outputFilePath) {
      reject(new Error("Output file is needed for FILE response type"));
    } else {
      /** @type {fs.WriteStream} */
      let outputFile;
      /** @type {HttpsResponse} */
      let output;
      if (responseType === HttpsResponseType.FILE) {
        outputFile = fs.createWriteStream(outputFilePath);
      }
      // for node <11
      let _url = new URL(url);
      options.host = _url.host;
      options.hostname = _url.hostname;
      options.path = _url.pathname;
      options.port = _url.port;
      if (_url.search) options.path += _url.search;
      //
      let request = https.request(options, (response) => {
        output = {
          headers: response.headers,
          statusCode: response.statusCode,
          statusMessage: response.statusMessage
        };
        if (responseType === HttpsResponseType.FILE) {
          response.pipe(outputFile);
        } else {
          output.body = "";
          response.on("data", (chunk) => {
            output.body += chunk;
          });
        }
        response.on("end", () => {
          if (responseType === HttpsResponseType.JSON && output.body) output.body = JSON.parse(output.body);
          if (responseType !== HttpsResponseType.FILE) resolve(output);
        });
      });

      if (responseType === HttpsResponseType.FILE) {
        outputFile.on("error", (error) => {
          if (outputFile) fs.unlinkSync(outputFilePath);
          reject(error);
        });
        outputFile.on("finish", () => {
          resolve(output);
        });
      }

      request.on("error", (error) => {
        if (outputFile) fs.unlinkSync(outputFilePath);
        console.error(url);
        reject(error);
      });

      if (body) request.write(body);
      request.end();
    }
  });
};

class HttpsRequest {
  /**
   * Make an HTTPS GET request
   * @param {string} url
   * @param {HttpsGetRequestOptions} options
   * @returns {Promise<HttpsResponse>}
   */
  static async get(url, options) {
    /** @type {HttpsGetRequestOptions} */
    let _options = {
      method: "GET"
    };
    /** @type {import("http").OutgoingHttpHeaders} */
    let _headers = options.headers || {};
    if (options.contentType) {
      _headers["Content-Type"] = options.contentType;
    }
    _options.headers = _headers;
    if (options.query) {
      let queryString = Object.keys(options.query)
        .map((key) => `${key}=${options.query[key]}`)
        .join("&");
      if (queryString) url = `${url}?${queryString}`;
    }
    return await httpsPromised(url, _options, options.responseType, null, options.outputFilePath);
  }

  /**
   * Make an HTTPS POST request
   * @param {string} url
   * @param {HttpsPostRequestOptions} options
   * @returns {Promise<HttpsResponse>}
   */
  static async post(url, options) {
    /** @type {HttpsPostRequestOptions} */
    let _options = {
      method: "POST"
    };
    /** @type {import("http").OutgoingHttpHeaders} */
    let _headers = options.headers || {};
    if (options.body) {
      if (typeof options.body === "object") options.body = JSON.stringify(options.body);
      _headers["Content-Length"] = Buffer.byteLength(options.body);
    }
    if (options.contentType) {
      _headers["Content-Type"] = options.contentType;
    }
    _options.headers = _headers;
    return await httpsPromised(url, _options, options.responseType, options.body);
  }

  /**
   * Make an HTTPS PATCH request
   * @param {string} url
   * @param {HttpsPostRequestOptions} options
   * @returns {Promise<HttpsResponse>}
   */
  static async patch(url, options) {
    /** @type {HttpsPostRequestOptions} */
    let _options = {
      method: "PATCH"
    };
    /** @type {import("http").OutgoingHttpHeaders} */
    let _headers = options.headers || {};
    if (options.body) {
      if (typeof options.body === "object") options.body = JSON.stringify(options.body);
      _headers["Content-Length"] = Buffer.byteLength(options.body);
    }
    if (options.contentType) {
      _headers["Content-Type"] = options.contentType;
    }
    _options.headers = _headers;
    return await httpsPromised(url, _options, options.responseType, options.body);
  }

  /**
   * Make an HTTPS DELETE request
   * @param {string} url
   * @param {HttpsPostRequestOptions} options
   * @returns {Promise<HttpsResponse>}
   */
  static async delete(url, options) {
    /** @type {HttpsPostRequestOptions} */
    let _options = {
      method: "DELETE"
    };
    /** @type {import("http").OutgoingHttpHeaders} */
    let _headers = options.headers || {};
    if (options.body) {
      if (typeof options.body === "object") options.body = JSON.stringify(options.body);
      _headers["Content-Length"] = Buffer.byteLength(options.body);
    }
    if (options.contentType) {
      _headers["Content-Type"] = options.contentType;
    }
    _options.headers = _headers;
    return await httpsPromised(url, _options, options.responseType, options.body);
  }
}

export { HttpsRequest, HttpsResponseType };
