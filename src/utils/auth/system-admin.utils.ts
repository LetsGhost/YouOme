import { env } from "../../config/env";

const getEmails = () =>
  env.SYSTEM_ADMIN_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isSystemAdminEmail = (email?: string) => {
  if (!email) {
    return false;
  }

  return getEmails().includes(email.trim().toLowerCase());
};