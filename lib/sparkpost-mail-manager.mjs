import SparkPost from "sparkpost";
import * as mime from "mime-types";
import * as fs from "fs";
import * as path from "path";
import * as nodemailer from "nodemailer";

/**
 * @typedef {{
 * results: {
 *   total_rejected_recipients: number;
 *   total_accepted_recipients: number;
 *   id: string;
 * };
 * }} SendResult
 */

/**
 * @typedef {{results: Array<import("sparkpost").MessageEvent>;}} EventsResult
 */

class SparkpostMail {
  /**
   * @type {import("sparkpost").InlineContent}
   * @private
   */
  __content;

  /**
   *
   * @param {string} from
   * @param {string} subject
   * @param {string} html
   */
  constructor(from, subject, html) {
    this.__content = {
      from: from,
      subject: subject,
      html: html,
      attachments: [],
      inline_images: []
    };
  }

  /**
   *
   * @param {string} filePath
   */
  addAttachment(filePath) {
    this.__content.attachments.push({
      type: mime.contentType(filePath).toString(),
      name: path.basename(filePath),
      data: fs.readFileSync(filePath).toString("base64")
    });
  }

  /**
   *
   * @param {string} filePath
   * @param {string} cidName
   */
  addInlineImage(filePath, cidName) {
    this.__content.inline_images.push({
      type: mime.contentType(filePath).toString(),
      name: cidName,
      data: fs.readFileSync(filePath).toString("base64")
    });
  }

  getContent() {
    return this.__content;
  }
}

class SparkpostMailer {
  /**
   * @type {SparkPost}
   * @private
   */
  __client;

  /** @type {string} */
  __sparkpostApi;

  /**
   *
   * @param {string} sparkpostApi
   */
  constructor(sparkpostApi) {
    this.__sparkpostApi = sparkpostApi;
    this.__client = new SparkPost(sparkpostApi);
  }

  /**
   *
   * @param {SparkpostMail} mail
   * @param {Array<string>} recipients
   * @returns {Promise<{total_rejected_recipients: number;total_accepted_recipients: number;id: string;}>}
   */
  async send(mail, recipients) {
    try {
      /** @type {Array<import("sparkpost").Recipient>} */
      let _recipients = [];
      recipients.forEach((recipient) => {
        _recipients.push({
          address: recipient
        });
      });
      let result = await this.__client.transmissions.send({
        content: mail.getContent(),
        recipients: _recipients
      });
      if (result.results) {
        return Promise.resolve(result.results);
      }
      return Promise.reject(new Error("No results"));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {SparkpostMail} mail
   * @param {Array<string>} recipients
   * @returns
   */
  async sendSmtp(mail, recipients) {
    try {
      let transporter = nodemailer.createTransport(
        {
          host: "smtp.sparkpostmail.com",
          port: 2525,
          auth: {
            user: "SMTP_Injection",
            pass: this.__sparkpostApi
          }
        },
        {
          ignoreTLS: true,
          requireTLS: false
        }
      );
      let emailContent = mail.getContent();
      /**
       * @type {{
       * from?: string;
       * subject?: string;
       * html?: string;
       * to?: string;
       * attachments?: Array<{
       *   filename?: string;
       *   cid?: string;
       *   content: string;
       *   encoding: string;
       * }}
       */
      let options = {
        from: emailContent.from,
        subject: emailContent.subject,
        html: emailContent.html
      };
      options.attachments = [];
      if (emailContent.attachments)
        options.attachments = options.attachments.concat(
          emailContent.attachments.map((item) => {
            return {
              filename: item.name,
              content: item.data,
              encoding: "base64",
              contentType: item.type
            };
          })
        );
      if (emailContent.inline_images)
        options.attachments = options.attachments.concat(
          emailContent.inline_images.map((item) => {
            return {
              filename: item.name,
              cid: item.name,
              content: item.data,
              encoding: "base64",
              contentType: item.type
            };
          })
        );
      let output = [];
      for (let recipient of recipients) {
        options.to = recipient;
        let result = await transporter.sendMail(options);
        output.push(result);
      }
      return Promise.resolve(output);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {string} transmissionId
   * @returns {Promise<import("sparkpost").MessageEvent[]>}
   */
  async getEvents(transmissionId) {
    try {
      let data = await this.__client.messageEvents.search({
        transmission_ids: transmissionId
      });
      if (data && data.results) {
        return Promise.resolve(data.results);
      }
      return Promise.reject(new Error("No results"));
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { SparkpostMailer, SparkpostMail };
