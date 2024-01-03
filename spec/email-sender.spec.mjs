import { Email, EmailSender } from "../lib/email-sender.mjs";
import { Files } from "../index.mjs";
import config from "./config.mjs";
import path from "path";

const mailsender = new EmailSender(config.smtp.smtp, config.smtp.port, config.smtp.username, config.smtp.password, config.smtp.useSSL);

describe("Email", () => {
  it("send en email", async () => {
    let email = new Email(config.smtp.username, "Test invio allegato", "<b>Ciao, questa è una email di prova con allegato</b>");
    email.addTo("marco@marcomeini.it");
    email.addTo("m.meini@ambrogio.com");
    let testFilePath = path.join(Files.appRoot(), "spec/files/test_file.pdf");
    email.addAttachment(testFilePath);
    let result = await mailsender.send(email);
    console.log(result);
  });
});
