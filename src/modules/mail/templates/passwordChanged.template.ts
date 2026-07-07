import { renderLayout } from "./layout";

type PasswordChangedTemplateInput = {
  name: string;
  sessionsRevoked: boolean;
};

export function passwordChangedTemplate({ name, sessionsRevoked }: PasswordChangedTemplateInput) {
  const revokedNote = sessionsRevoked
    ? " Your other active sessions have been signed out as a precaution."
    : "";

  const { html, text } = renderLayout({
    heading: "Your password was changed",
    bodyHtml: `<p style="font-size: 16px; line-height: 1.6;">Hi ${name}, this is a confirmation that your YouOme account password was just changed.</p>
    <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">If this wasn't you, please contact support immediately.${revokedNote}</p>`,
    bodyText: `Hi ${name}, this is a confirmation that your YouOme account password was just changed.\n\nIf this wasn't you, please contact support immediately.${revokedNote}`,
  });

  return {
    subject: "Your password was changed",
    html,
    text,
  };
}
