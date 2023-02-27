"use strict";

import { MongoClienManager } from "../lib/mongo-client-manager.mjs";
import mongodb from "mongodb";

class Abstract_BaseCollection {
  /**
   *
   * @param {MongoClienManager} dbMan
   * @param {string} collectionName
   */
  constructor(dbMan, collectionName) {
    /** @type {mongodb.Collection} */
    this.__collection = dbMan.db.collection(collectionName);
  }

  /**
   *
   * @param {mongodb.ObjectId} id
   * @param {{ [key: string]: string }} fields
   * @returns {Promise<mongodb.WithId<mongodb.Document>>}
   */
  async findBy_id(id, fields = {}) {
    try {
      let result = await this.__collection.findOne(
        {
          _id: id
        },
        {
          projection: fields
        }
      );
      return Promise.resolve(result);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * @param {mongodb.Filter<any>} filter
   * @param {{ [key: string]: string }} fields
   * @returns {Promise<Array<mongodb.WithId<mongodb.Document>>>}
   */
  async findAll(filter, fields = {}) {
    try {
      let cursor = this.__collection.find(filter, { projection: fields });
      let rows = await cursor.toArray();
      cursor.close();
      return Promise.resolve(rows);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {mongodb.Filter<any>} filter
   * @param {number} limit
   * @param {number} offset
   * @param {{ [key: string]: string }} fields
   * @returns {Promise<{ total: number, data: Array<any> }>}
   */
  async findAllPaged(filter, limit, offset, fields = {}) {
    try {
      let count = await this.__collection.countDocuments(filter);
      let cursor = this.__collection.find(filter, { projection: fields }).skip(offset).limit(limit);
      let rows = await cursor.toArray();
      cursor.close();
      return Promise.resolve({ total: count, data: rows });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {mongodb.Filter<any>} filter
   * @param {{ [key: string]: string }} fields
   * @returns {Promise<mongodb.WithId<mongodb.Document>>}
   */
  async findOne(filter, fields = {}) {
    try {
      let result = await this.__collection.findOne(filter, { projection: fields });
      return Promise.resolve(result);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {object} data
   * @returns {Promise<mongodb.ObjectId>}
   */
  async addDocument(data) {
    try {
      if (data) {
        let result = await this.__collection.insertOne(data);
        return Promise.resolve(result.insertedId);
      } else {
        return Promise.resolve(null);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {Array<object>} rows
   * @returns {Promise<{ [key: number]: mongodb.ObjectId }>}
   */
  async addDocuments(rows) {
    try {
      if (rows && rows.length) {
        let result = await this.__collection.insertMany(rows);
        return Promise.resolve(result.insertedIds);
      } else {
        return Promise.resolve({});
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {object} data
   * @returns {Promise<void>}
   */
  async upsertDocument(data) {
    try {
      if (data) {
        let properties = { ...data };
        delete properties["_id"];
        await this.__collection.updateOne(
          {
            _id: data["_id"]
          },
          {
            $set: properties
          },
          {
            upsert: true
          }
        );
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {Array<object>} rows
   * @returns {Promise<void>}
   */
  async upsertDocuments(rows) {
    try {
      if (rows && rows.length) {
        await this.__collection.bulkWrite(
          rows.map((data) => {
            let properties = { ...data };
            delete properties["_id"];
            return {
              updateOne: {
                filter: {
                  _id: data["_id"]
                },
                update: {
                  $set: properties
                },
                upsert: true
              }
            };
          })
        );
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {mongodb.Filter<any>} filters
   * @param {{ [key: string]: any }} data
   * @returns {Promise<number>}
   */
  async updateOne(filters = {}, data = {}) {
    try {
      let result = await this.__collection.updateOne(filters, {
        $set: data
      });
      return Promise.resolve(result.modifiedCount);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {mongodb.Filter<any>} filter
   * @returns {Promise<void>}
   */
  async deleteManyDocuments(filter) {
    try {
      await this.__collection.deleteMany(filter);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { Abstract_BaseCollection };
