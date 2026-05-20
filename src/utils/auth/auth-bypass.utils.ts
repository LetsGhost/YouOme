import { env } from "../../config/env";
import { verifyToken } from "../../modules/common/auth/jwt";

export const isAuthBypassEnabled = () => {
  return env.NODE_ENV === "development" && env.BYPASS_AUTH === "true";
};

const DEV_USER_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

const isValidDevUserId = (value: string) => DEV_USER_ID_PATTERN.test(value);

export const getDevUser = (token?: string, devUserId?: string) => {
  if (token) {
    try {
      const payload = verifyToken(token);
      return { id: payload.sub, role: payload.role };
    } catch {
      void 0;
    }
  }

  if (devUserId && isValidDevUserId(devUserId)) {
    return {
      id: devUserId,
      role: "admin",
    };
  }

  return {
    id: "000000000000000000000000", // Valid ObjectId format
    role: "admin",
  };
};