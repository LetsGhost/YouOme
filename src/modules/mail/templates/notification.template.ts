import { renderButton, renderLayout } from "./layout";

type NotificationTemplateInput = {
  heading: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
};

/**
 * Generic template for the sendNotificationEmail() groundwork - future event handlers
 * (friend invites, expense activity, etc.) can call this directly rather than writing
 * a bespoke template per notification type.
 */
export function notificationTemplate({ heading, message, actionUrl, actionLabel }: NotificationTemplateInput) {
  const { html, text } = renderLayout({
    heading,
    bodyHtml: `<p style="font-size: 16px; line-height: 1.6;">${message}</p>
    ${actionUrl && actionLabel ? renderButton(actionUrl, actionLabel) : ""}`,
    bodyText: `${message}${actionUrl ? `\n\n${actionUrl}` : ""}`,
  });

  return {
    subject: heading,
    html,
    text,
  };
}
