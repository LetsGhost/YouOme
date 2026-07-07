type LayoutInput = {
  heading: string;
  bodyHtml: string;
  bodyText: string;
};

export function renderLayout({ heading, bodyHtml, bodyText }: LayoutInput): { html: string; text: string } {
  const html = `<div style="font-family: Arial, sans-serif; color: #111827; background-color: #f9fafb; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb;">
    <h1 style="margin-top: 0; font-size: 24px;">${heading}</h1>
    ${bodyHtml}
    <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; margin-top: 32px;">YouOme</p>
  </div>
</div>`;

  const text = `${heading}\n\n${bodyText}`;

  return { html, text };
}

export function renderButton(url: string, label: string): string {
  return `<div style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">${label}</a>
  </div>
  <p style="font-size: 13px; line-height: 1.5; color: #6b7280; word-break: break-all;">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${url}" style="color: #6b7280;">${url}</a></p>`;
}
