import React from "react";

type VerifyEmailTemplateProps = {
  name: string;
  code: string;
};

export function VerifyEmailTemplate({ name, code }: VerifyEmailTemplateProps) {
  return React.createElement(
    "div",
    {
      style: {
        fontFamily: "Arial, sans-serif",
        color: "#111827",
        backgroundColor: "#f9fafb",
        padding: "32px",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          maxWidth: "560px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          border: "1px solid #e5e7eb",
        },
      },
      React.createElement("h1", { style: { marginTop: 0, fontSize: "24px" } }, "Verify your email"),
      React.createElement(
        "p",
        { style: { fontSize: "16px", lineHeight: 1.6 } },
        `Hi ${name}, enter the code below to finish creating your account.`
      ),
      React.createElement(
        "div",
        {
          style: {
            margin: "24px 0",
            padding: "20px",
            textAlign: "center",
            letterSpacing: "8px",
            fontSize: "32px",
            fontWeight: 700,
            backgroundColor: "#f3f4f6",
            borderRadius: "12px",
          },
        },
        code
      ),
      React.createElement(
        "p",
        { style: { fontSize: "14px", lineHeight: 1.5, color: "#6b7280" } },
        "This code expires in 30 minutes. If you did not create this account, you can ignore this email."
      )
    )
  );
}