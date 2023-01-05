"use strict";

import * as Jimp from "jimp";
import * as path from "path";
import * as fs from "fs";
import { HttpResponseStatus } from "../enums.mjs";

class Files {
  /**
   *
   * @param {string} originalPath
   * @param {number} fileResize
   * @param {string} pathToWrite
   * @returns
   */
  static async createFile(originalPath, fileResize, pathToWrite) {
    try {
      let image = await Jimp.read(path.join(originalPath));
      let img = await image.resize(fileResize, fileResize).quality(100).writeAsync(pathToWrite);
      return Promise.resolve(img);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {string} parentPath
   * @param {string} size
   * @param {string} avatar
   * @returns
   */
  static checkSizeFile(parentPath, size, avatar) {
    try {
      let existOnAvatarFolder = false;
      // check if avatar exists into avatar "sized" folder
      let existOnSizeFolder = fs.existsSync(path.join(parentPath, size, avatar));
      if (!existOnSizeFolder) {
        // check if avatar exists into avatar folder
        existOnAvatarFolder = fs.existsSync(path.join(parentPath, avatar));
      } else {
        return Promise.resolve(true);
      }
      // if it doesn't exist return 404
      if (!existOnAvatarFolder) {
        return Promise.reject({ status: HttpResponseStatus.NOT_FOUND });
      } else {
        return Promise.resolve();
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { Files };
