import { SendGridMailManager } from "../lib/sendgrid-mail-manager.mjs";
import { Files } from "../index.mjs";
import path from "path";
import config from "./config.mjs";

const sg = new SendGridMailManager(config.sendGridApiKey);

describe("SendGrid", () => {
  it("send en email", async () => {
    let testFilePath = path.join(Files.appRoot(), "spec/files/test_file.pdf");
    let attachment = sg.fileToAttachmentItem(testFilePath);
    await sg.send({ from: "support@marcomeini.it", to: "m.meini@ambrogio.com", html: "<b>Test</b>", subject: "SendGrid second test email", attachments: [attachment] });
  });
});
