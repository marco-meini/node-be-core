import sgMail from "@sendgrid/mail";
import fs from "fs";
import path from "path";
import * as mime from "mime-types";

/**
 * @typedef {{
 * content: string;
 * filename: string;
 * type?: string;
 * disposition?: string;
 * content_id?: string;
 * }} IAttachment
 */

class SendGridMailManager {
  constructor(apiKey) {
    sgMail.setApiKey(apiKey);
  }

  /**
   *
   * @param {import("@sendgrid/mail").MailDataRequired} mail
   * @returns
   */
  async send(mail) {
    try {
      let [response] = await sgMail.send(mail);
      if (response.statusCode >= 200 && response.statusCode <= 300) {
        return Promise.resolve();
      } else {
        return Promise.reject(new Error(response.body));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {string} fileFullPath
   * @returns {IAttachment}
   */
  fileToAttachmentItem(fileFullPath) {
    return {
      content: fs.readFileSync(fileFullPath).toString("base64"),
      filename: path.basename(fileFullPath),
      type: mime.contentType(path.extname(fileFullPath)).toString(),
      disposition: "attachment"
    };
  }

  /**
   *
   * @param {string} fileFullPath
   * @param {string} contentId
   * @returns {IAttachment}
   */
  fileToInlineAttachmentItem(fileFullPath, contentId) {
    return {
      content: fs.readFileSync(fileFullPath).toString("base64"),
      filename: path.basename(fileFullPath),
      type: mime.contentType(fileFullPath).toString(),
      disposition: "inline",
      content_id: contentId
    };
  }
}

export { SendGridMailManager };
