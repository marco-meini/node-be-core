import _ from "lodash";

class Validator {
  /**
   * @type {{
   * success: boolean,
   * message: string,
   * subMessages: Array<string>
   * }}
   * @private
   */
  __result;

  constructor() {
    this.__result = {
      success: true,
      subMessages: []
    };
  }

  /**
   *
   * @param {any} value
   * @param {string} fieldName
   */
  validateRequiredString(value, fieldName) {
    let _valued = value !== null && value !== undefined;
    if (!_valued || (typeof value === "string" && value.trim() === "")) {
      this.__result.success = false;
      this.__result.subMessages.push(`${fieldName} obbligatorio`);
    }
  }

  /**
   *
   * @param {any} value
   * @param {boolean} required
   * @param {string} fieldName
   */
  validateNumber(value, required, fieldName) {
    let _valued = value !== null && value !== undefined;
    if (!_valued && required) {
      this.__result.success = false;
      this.__result.subMessages.push(`${fieldName} obbligatorio`);
    } else if (_valued && !_.isFinite(value)) {
      this.__result.success = false;
      this.__result.subMessages.push(`${fieldName} deve esssere numerico`);
    }
  }

  /**
   *
   * @param {any} value
   * @param {boolean} required
   * @param {string} fieldName
   */
  validateBoolean(value, required, fieldName) {
    let _valued = value !== null && value !== undefined;
    if (!_valued && required) {
      this.__result.success = false;
      this.__result.subMessages.push(`${fieldName} obbligatorio`);
    } else if (_valued && typeof value !== "boolean") {
      this.__result.success = false;
      this.__result.subMessages.push(`${fieldName} deve esssere un booleano`);
    }
  }

  /**
   *
   * @param {any} value
   * @param {boolean} required
   * @param {string} fieldName
   */
  validateEmail(value, required, fieldName) {
    let _valued = value !== null && value !== undefined;
    if (!_valued && required) {
      this.__result.success = false;
      this.__result.subMessages.push(`${fieldName} obbligatorio`);
    } else if (_valued && (typeof value !== "string" || !value.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
      this.__result.success = false;
      this.__result.subMessages.push(`${fieldName} non è una mail valida`);
    }
  }

  /**
   *
   * @param {boolean} valid
   * @param {string} errorMessage
   */
  customValidation(valid, errorMessage) {
    if (!valid) {
      this.__result.success = false;
      this.__result.subMessages.push(errorMessage);
    }
  }

  validate(successMessage, errorMessage) {
    if (this.__result.success) this.__result.message = successMessage;
    else this.__result.message = errorMessage;

    return this.__result;
  }
}

export { Validator };
