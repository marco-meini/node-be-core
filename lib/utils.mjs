"use strict";

class Utils {
  /**
   *
   * @param {any} obj
   * @returns {number}
   */
  static sizeOf(obj) {
    let bytes = 0;
    if (obj !== null && obj !== undefined) {
      switch (typeof obj) {
        case "number":
          bytes += 8;
          break;
        case "string":
          bytes += obj.length * 2;
          break;
        case "boolean":
          bytes += 4;
          break;
        case "object":
          var objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === "Object" || objClass === "Array") {
            for (var key in obj) {
              if (!obj.hasOwnProperty(key)) continue;
              Utils.sizeOf(obj[key]);
            }
          } else bytes += obj.toString().length * 2;
          break;
      }
    }
    return bytes;
  }
}

export { Utils };
