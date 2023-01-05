"use strict";

class Strings {
  /**
   * Check if a given string could be a valid password:
   * - minimum length of 8
   * - at least an uppercase letter
   * - at least a lowercase letter
   * - at least a number
   * - at least a special character
   * @param {string} value
   * @returns {boolean}
   */
  static validatePassword(value) {
    if (!value) {
      return false;
    }
    if (value.length < 8) {
      return false;
    }
    return /\d/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\W|_/.test(value);
  }
}

export { Strings };
