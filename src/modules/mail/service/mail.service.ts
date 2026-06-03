import { Resend } from "resend";
import React from "react";

import { pretty, render } from "@react-email/render";

import { env } from "../../../config/env";
import { MailPayload } from "../types/mailPayload.type";
import { logger } from "../../common/logger/logger";
import { MailVerifyPayload } from "../types/mailVerifyPayload";
import { VerifyEmailTemplate } from "../templates/verifyEmail.template";

export class MailService {
    private client: Resend | null = null;

    private getClient() {
        if (!env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set");
        }

        if (!this.client) {
            this.client = new Resend(env.RESEND_API_KEY);
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
        });

        if (error) {
            logger.error("Failed to send email", {
                subject: payload.subject,
                to: payload.to,
            });
            throw error;
        }

        return data;
    }

    async sendMailVerification(input: MailVerifyPayload) {
        return this.sendMail({
            to: input.to,
            subject: "Verify your email address",
            html: await pretty(
                await render(
                    React.createElement(VerifyEmailTemplate, {
                        name: input.name,
                        code: input.code,
                    })
                )
            ),
        });
    }
}

export const mailservice = new MailService();

