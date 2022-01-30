import { EMAIL_HOST, EMAIL_PASSWORD, EMAIL_USER_NAME } from "../shared/constants/env-constants";

const nodemailer = require("nodemailer");

const getEmailAccount = async () => {
    const host = EMAIL_HOST, user = EMAIL_USER_NAME, pass = EMAIL_PASSWORD;
    return {
        host,
        auth: {
            user,
            pass
        }
    }
}

export class EmailService {
    public async sendMail(email: string, subject: string, html: string, text: string) {
        try {
            const { host, auth } = await getEmailAccount();
            const transporter = nodemailer.createTransport({
                host,
                port: 587,
                secure: false,
                auth,
            });
            const info = await transporter.sendMail({
                from: EMAIL_USER_NAME,
                to: email,
                subject: subject,
                text,
                html
            });
            return true;
        } catch (error) {
            console.log(error, "email not sent");
            return false;
        }
    }
}