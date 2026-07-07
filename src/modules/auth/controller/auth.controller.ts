import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { authService } from "../service/auth.service";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schema/auth.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { userService } from "../../user/service/user.service";

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
class AuthController extends BaseController {
  constructor() {
    super();
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.deleteCurrentUser = this.deleteCurrentUser.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerification = this.resendVerification.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/auth/login:
     *   post:
     *     summary: Login user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginDTO'
     *     responses:
     *       200:
     *         description: Login successful
     *       401:
     *         description: Invalid credentials
     */
    this.router.post("/login", this.wrap(this.login));

    /**
     * @openapi
      * /api/auth/register:
     *   post:
     *     summary: Register a new user (requires email verification before login)
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserDTO'
     *     responses:
     *       201:
     *         description: Registration received, verification email sent
     *       400:
     *         description: Bad request
     */
    this.router.post("/register", this.wrap(this.register));

    /**
     * @openapi
     * /api/auth/verify-email:
     *   post:
     *     summary: Verify a user's email address using the token from the verification email
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/VerifyEmailDTO'
     *     responses:
     *       200:
     *         description: Email verified successfully
     *       400:
     *         description: Invalid or expired verification link
     */
    this.router.post("/verify-email", this.wrap(this.verifyEmail));

    /**
     * @openapi
     * /api/auth/resend-verification:
     *   post:
     *     summary: Resend the email verification link
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ResendVerificationDTO'
     *     responses:
     *       200:
     *         description: Always returns a generic success message
     */
    this.router.post("/resend-verification", this.wrap(this.resendVerification));

    /**
     * @openapi
     * /api/auth/forgot-password:
     *   post:
     *     summary: Request a password reset link
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ForgotPasswordDTO'
     *     responses:
     *       200:
     *         description: Always returns a generic success message
     */
    this.router.post("/forgot-password", this.wrap(this.forgotPassword));

    /**
     * @openapi
     * /api/auth/reset-password:
     *   post:
     *     summary: Reset a password using the token from the reset email
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ResetPasswordDTO'
     *     responses:
     *       200:
     *         description: Password reset successfully
     *       400:
     *         description: Invalid or expired reset link
     */
    this.router.post("/reset-password", this.wrap(this.resetPassword));

    /**
     * @openapi
      * /api/auth/refresh:
     *   post:
     *     summary: Refresh access token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RefreshTokenDTO'
     *     responses:
     *       200:
     *         description: Token refreshed
     *       401:
     *         description: Invalid refresh token
     */
    this.router.post("/refresh", this.wrap(this.refreshToken));

    /**
     * @openapi
      * /api/auth/logout:
     *   post:
     *     summary: Logout user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/logout", authenticate, this.wrap(this.logout));

    /**
     * @openapi
      * /api/auth/me:
     *   get:
     *     summary: Get current user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Current user details
     *       401:
     *         description: Unauthorized
     */
    this.router.get("/me", authenticate, this.wrap(this.getCurrentUser));

    /**
     * @openapi
     * /api/auth/me:
     *   delete:
     *     summary: Delete the current user account
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Account deleted successfully
     *       401:
     *         description: Unauthorized
     */
    this.router.delete("/me", authenticate, this.wrap(this.deleteCurrentUser));

    /**
     * @openapi
     * /api/auth/me:
     *   patch:
     *     summary: Update the current user's name and/or email
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateProfileDTO'
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    this.router.patch("/me", authenticate, this.wrap(this.updateProfile));

    /**
     * @openapi
     * /api/auth/me/password:
     *   post:
     *     summary: Change the current user's password
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ChangePasswordDTO'
     *     responses:
     *       200:
     *         description: Password changed successfully
     *       400:
     *         description: Bad request (e.g. incorrect current password)
     *       401:
     *         description: Unauthorized
     */
    this.router.post("/me/password", authenticate, this.wrap(this.changePassword));
  }

  private async login(req: Request, res: Response) {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);

    res.json(result);
  }

  private async refreshToken(req: Request, res: Response) {
    const dto = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshToken(dto.refreshToken);

    res.json(result);
  }

  private async logout(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const result = await authService.logout(userId);

    res.json(result);
  }

  private async getCurrentUser(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);

    res.json(user);
  }

  private async deleteCurrentUser(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const result = await authService.deleteCurrentUser(userId);

    res.json(result);
  }

  private async updateProfile(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const dto = updateProfileSchema.parse(req.body);
    const result = await authService.updateProfile(userId, dto);

    res.json(result);
  }

  private async changePassword(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const dto = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(userId, dto.currentPassword, dto.newPassword);

    res.json(result);
  }

  private async register(req: Request, res: Response) {
    const dto = registerSchema.parse(req.body);

    const user = await userService.createUser(dto.email, dto.password, dto.name);

    res.status(201).json({
      message: "Registration received. Check your email for a verification link.",
      email: user.email,
    });
  }

  private async verifyEmail(req: Request, res: Response) {
    const dto = verifyEmailSchema.parse(req.body);
    const result = await authService.verifyEmail(dto.token);

    res.json(result);
  }

  private async resendVerification(req: Request, res: Response) {
    const dto = resendVerificationSchema.parse(req.body);
    const result = await authService.resendVerification(dto.email);

    res.json(result);
  }

  private async forgotPassword(req: Request, res: Response) {
    const dto = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(dto.email);

    res.json(result);
  }

  private async resetPassword(req: Request, res: Response) {
    const dto = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(dto.token, dto.newPassword);

    res.json(result);
  }
}

export const authController = new AuthController();
