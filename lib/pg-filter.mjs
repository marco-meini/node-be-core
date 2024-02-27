class PgFilter {
  constructor() {
    /** @type {Array<string>} */
    this.__conditions = [];
    /** @type {Array<any>} */
    this.replacements = [];
  }

  /**
   *
   * @param {string} condition
   */
  addCondition(condition) {
    this.__conditions.push("(" + condition + ")");
  }

  /**
   *
   * @param {string} field
   * @param {any} value
   */
  addEqual(field, value) {
    if (value !== null && value !== undefined) {
      this.__conditions.push(`(${field}=$${this.replacements.length + 1})`);
      this.replacements.push(value);
    } else {
      this.__conditions.push(`(${field} is null)`);
    }
  }

  /**
   *
   * @param {string} field
   * @param {any} value
   */
  addNotEqual(field, value) {
    if (value !== null && value !== undefined) {
      this.__conditions.push(`(${field}<>$${this.replacements.length + 1})`);
      this.replacements.push(value);
    } else {
      this.__conditions.push(`(${field} is not null)`);
    }
  }

  /**
   *
   * @param {string} field
   * @param {any} value
   * @param {boolean} orEqual
   */
  addGreaterThan(field, value, orEqual = false) {
    let operation = orEqual ? ">=" : ">";
    this.__conditions.push(`(${field}${operation}$${this.replacements.length + 1})`);
    this.replacements.push(value);
  }

  /**
   *
   * @param {string} field
   * @param {any} value
   * @param {boolean} orEqual
   */
  addLessThan(field, value, orEqual = false) {
    let operation = orEqual ? "<=" : "<";
    this.__conditions.push(`(${field}${operation}$${this.replacements.length + 1})`);
    this.replacements.push(value);
  }

  /**
   *
   * @param {string} field
   * @param {Array<any>} values
   */
  addIn(field, values) {
    if (values.length) {
      let indexes = [];
      values.forEach((value) => {
        indexes.push(`$${this.replacements.length + 1}`);
        this.replacements.push(value);
      });
      this.__conditions.push(`(${field} in (${indexes.join(",")}))`);
    }
  }

  /**
   *
   * @param {string} field
   * @param {Array<any>} values
   */
  addNotIn(field, values) {
    if (values.length) {
      let indexes = [];
      values.forEach((value) => {
        indexes.push(`$${this.replacements.length + 1}`);
        this.replacements.push(value);
      });
      this.__conditions.push(`(${field} not in (${indexes.join(",")}))`);
    }
  }

  addSearchInString(field, value) {
    if (value !== null && value !== undefined) {
      this.__conditions.push(`(${field} iLike $${this.replacements.length + 1})`);
      this.replacements.push(`%${value}%`);
    }
  }

  addStartsWithString(field, value) {
    if (value !== null && value !== undefined) {
      this.__conditions.push(`(${field} iLike $${this.replacements.length + 1})`);
      this.replacements.push(`${value}%`);
    }
  }

  addEndWithString(field, value) {
    if (value !== null && value !== undefined) {
      this.__conditions.push(`(${field} iLike $${this.replacements.length + 1})`);
      this.replacements.push(`%${value}`);
    }
  }

  /**
   *
   * @param {boolean} addWhere
   * @returns {string}
   */
  getWhere(addWhere = true) {
    if (this.__conditions.length) {
      let where = addWhere ? "WHERE " : "";
      return where + this.__conditions.join(" AND ");
    }
    return "";
  }

  /**
   *
   * @param {boolean} addWhere
   * @returns {string}
   */
  getWhereUsingOR(addWhere = true) {
    if (this.__conditions.length) {
      let where = addWhere ? "WHERE " : "";
      return where + this.__conditions.join(" OR ");
    }
    return "";
  }
}

export { PgFilter };
