import _ from "lodash";
import moment from "moment";

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
      this.__result.subMessages.push(`campo ${fieldName} obbligatorio`);
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
      this.__result.subMessages.push(`campo ${fieldName} obbligatorio`);
    } else if (_valued && !_.isFinite(value)) {
      this.__result.success = false;
      this.__result.subMessages.push(`il campo ${fieldName} deve esssere numerico`);
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
      this.__result.subMessages.push(`campo ${fieldName} obbligatorio`);
    } else if (_valued && typeof value !== "boolean") {
      this.__result.success = false;
      this.__result.subMessages.push(`il campo ${fieldName} deve esssere un booleano`);
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
      this.__result.subMessages.push(`campo ${fieldName} obbligatorio`);
    } else if (_valued && (typeof value !== "string" || !value.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))) {
      this.__result.success = false;
      this.__result.subMessages.push(`il campo ${fieldName} non è una mail valida`);
    }
  }

  /**
   * If the date is valid returns its ISO string with offset
   * @param {any} value
   * @param {boolean} required
   * @param {string} fieldName
   * @returns {string | null}
   */
  validateDate(value, required, fieldName) {
    let _valued = value !== null && value !== undefined;
    let _isoDate = null;
    if (!_valued && required) {
      this.__result.success = false;
      this.__result.subMessages.push(`campo ${fieldName} obbligatorio`);
    } else if (_valued) {
      let _date = moment(value, true);
      if (!_date.isValid()) {
        this.__result.success = false;
        this.__result.subMessages.push(`il campo ${fieldName} non è una data valida`);
      } else {
        _isoDate = _date.toISOString(true);
      }
    }
    return _isoDate;
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
