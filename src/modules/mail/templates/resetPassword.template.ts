import { renderButton, renderLayout } from "./layout";

type ResetPasswordTemplateInput = {
  name: string;
  resetUrl: string;
};

export function resetPasswordTemplate({ name, resetUrl }: ResetPasswordTemplateInput) {
  const { html, text } = renderLayout({
    heading: "Reset your password",
    bodyHtml: `<p style="font-size: 16px; line-height: 1.6;">Hi ${name}, we received a request to reset your YouOme password.</p>
    ${renderButton(resetUrl, "Reset password")}
    <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">This link expires in 1 hour and can only be used once. If you did not request this, you can safely ignore this email - your password will not be changed.</p>`,
    bodyText: `Hi ${name}, we received a request to reset your YouOme password.\n\n${resetUrl}\n\nThis link expires in 1 hour and can only be used once. If you did not request this, you can safely ignore this email - your password will not be changed.`,
  });

  return {
    subject: "Reset your password",
    html,
    text,
  };
}
