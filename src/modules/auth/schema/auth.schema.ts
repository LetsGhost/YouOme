import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginDTO:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           example: password123
 *         rememberMe:
 *           type: boolean
 *           example: false
 *           description: Issue a long-lived refresh token that keeps the user signed in.
 *     RefreshTokenDTO:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             name:
 *               type: string
 *             role:
 *               type: string
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *     UpdateProfileDTO:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         bio:
 *           type: string
 *           example: Splitting the rent, not the friendship.
 *     ChangePasswordDTO:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           example: oldPassword123
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           example: newPassword123
 */

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  bio: z.string().max(240).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
