import { Resend } from "resend";
import React from "react";

import { env } from "../../../config/env"
import { MailPayload } from "../types/mailPayload.type";
import { logger } from "../../common/logger/logger";
import { subscribe } from "node:diagnostics_channel";
import { MailVerifyPayload } from "../types/mailVerifyPayload";
import { pretty, render } from "@react-email/render";

export class MailService {
    private client: Resend | null = null;

    private getClient() {
        if(!env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set")
        }

        if (!this.client) {
            this.client = new Resend(process.env.RESEND_API_KEY!);
        }

        return this.client;
    }

    private getFromAddress() {
        if (!env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is not configured");
        }

        return env.EMAIL_FROM;
    }

    private async sendMail(payload: MailPayload) {
        const resendClient = this.getClient();
        const { data, error } = await resendClient.emails.send({
            from: this.getFromAddress(),
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
        })

        if(error) {
            logger.error("Failed to send email", {
                subject: payload.subject,
                to: payload.to,
            })
        }

        return data;
    }

    async sendMailVerification(input: MailVerifyPayload) {
        return this.sendMail({
            to: input.to,
            subject: "E-Mail verify",
            html: await pretty(await render(React.createElement("div", {}, "Email Verification")))
        })
    }
}

export const mailservice = new MailService();

