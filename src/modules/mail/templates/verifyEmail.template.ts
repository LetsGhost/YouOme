import { renderButton, renderLayout } from "./layout";

type VerifyEmailTemplateInput = {
  name: string;
  verifyUrl: string;
};

export function verifyEmailTemplate({ name, verifyUrl }: VerifyEmailTemplateInput) {
  const { html, text } = renderLayout({
    heading: "Verify your email",
    bodyHtml: `<p style="font-size: 16px; line-height: 1.6;">Hi ${name}, confirm your email address to finish creating your YouOme account.</p>
    ${renderButton(verifyUrl, "Verify email")}
    <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
    bodyText: `Hi ${name}, confirm your email address to finish creating your YouOme account.\n\n${verifyUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
  });

  return {
    subject: "Verify your email address",
    html,
    text,
  };
}
