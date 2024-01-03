import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

class EmailSender {
  /**
   * @type {import("nodemailer").Transporter}
   * @private
   */
  __transporter;

  /**
   *
   * @param {string} smtpServer
   * @param {number} smtpPort
   * @param {string} username
   * @param {string} password
   * @param {boolean} [useSsl]
   */
  constructor(smtpServer, smtpPort, username, password, useSsl = false) {
    this.__transporter = nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      secure: useSsl,
      auth: {
        user: username,
        pass: password
      }
    });
  }

  /**
   *
   * @param {Email} email
   */
  async send(email) {
    try {
      let response = await this.__transporter.sendMail(email.toMailOptions());
      return Promise.resolve(response.response);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

class Email {
  /**
   * @type {import("nodemailer/lib/mailer").Address}
   * @private
   */
  __from;
  /**
   * @type {string}
   * @private
   */
  __subject;
  /**
   * @type {string}
   * @private
   */
  __html;
  /**
   * @type {Array<import("nodemailer/lib/mailer").Address | string>}
   * @private
   */
  __to;
  /**
   * @type {Array<import("nodemailer/lib/mailer").Address | string>}
   * @private
   */
  __cc;
  /**
   * @type {Array<import("nodemailer/lib/mailer").Address | string>}
   * @private
   */
  __bcc;
  /**
   * @type {Array<import("nodemailer/lib/mailer").Attachment>}
   * @private
   */
  __attachments;

  /**
   *
   * @param {import("nodemailer/lib/mailer").Address | string} from
   * @param {string} subject
   * @param {string} html
   */
  constructor(from, subject, html) {
    this.__from = from;
    this.__subject = subject;
    this.__html = html;
    this.__to = [];
    this.__cc = [];
    this.__bcc = [];
    this.__attachments = [];
  }

  /**
   *
   * @param {import("nodemailer/lib/mailer").Address | string} address
   */
  addTo(address) {
    this.__to.push(address);
  }

  /**
   *
   * @param {import("nodemailer/lib/mailer").Address | string} address
   */
  addCC(address) {
    this.__cc.push(address);
  }

  /**
   *
   * @param {import("nodemailer/lib/mailer").Address | string} address
   */
  addBCC(address) {
    this.__bcc.push(address);
  }

  /**
   *
   * @param {string} fileFullPath
   */
  addAttachment(fileFullPath) {
    let filename = path.basename(fileFullPath);
    this.__attachments.push({
      filename: filename,
      content: fs.createReadStream(fileFullPath)
    });
  }

  /**
   *
   * @param {string} fileFullPath
   */
  addInlineAttachment(fileFullPath, contentId) {
    let filename = path.basename(fileFullPath);
    this.__attachments.push({
      filename: filename,
      content: fs.createReadStream(fileFullPath),
      cid: contentId
    });
  }

  /**
   * @returns {import("nodemailer/lib/mailer").Options}
   */
  toMailOptions() {
    if (!this.__to.length && !this.__cc.length && !this.__bcc.length) {
      throw new Error("The email has not recipients!");
    }
    /** @type {import("nodemailer/lib/mailer").Options} */
    let options = {
      from: this.__from,
      subject: this.__subject,
      html: this.__html
    };
    if (this.__to.length) options.to = this.__to;
    if (this.__cc.length) options.cc = this.__cc;
    if (this.__bcc.length) options.bcc = this.__bcc;
    if (this.__attachments.length) options.attachments = this.__attachments;
    return options;
  }
}

export { EmailSender, Email };
