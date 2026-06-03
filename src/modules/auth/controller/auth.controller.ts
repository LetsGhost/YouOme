import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { authService } from "../service/auth.service";
import {
  loginSchema,
  resendVerificationSchema,
  refreshTokenSchema,
  registerSchema,
  verifyEmailSchema,
} from "../schema/auth.schema";
import { eventBus } from "../../common/messaging/event-bus";
import { UserRegistrationRequestedEvent } from "../../user/events/user-registration-requested.event";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";

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
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerification = this.resendVerification.bind(this);
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
    this.router.post("/login", this.login);

    /**
     * @openapi
      * /api/auth/register:
     *   post:
     *     summary: Register a new user (no auto-login)
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserDTO'
     *     responses:
     *       201:
     *         description: User created
     *       400:
     *         description: Bad request
     */
    this.router.post("/register", this.register);

    /**
     * @openapi
     * /api/auth/verify-email:
     *   post:
     *     summary: Verify a user's email address
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
     *         description: Invalid or expired verification code
     */
    this.router.post("/verify-email", this.verifyEmail);

    /**
     * @openapi
     * /api/auth/resend-verification:
     *   post:
     *     summary: Resend the email verification code
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ResendVerificationDTO'
     *     responses:
     *       200:
     *         description: Verification code resent successfully
     *       400:
     *         description: Invalid request or code recently sent
     */
    this.router.post("/resend-verification", this.resendVerification);

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
    this.router.post("/refresh", this.refreshToken);

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
    this.router.post("/logout", authenticate, this.logout);

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
    this.router.get("/me", authenticate, this.getCurrentUser);
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
    const result = await authService.logout();

    res.json(result);
  }

  private async getCurrentUser(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);

    res.json(user);
  }

  private async verifyEmail(req: Request, res: Response) {
    const dto = verifyEmailSchema.parse(req.body);
    const result = await authService.verifyEmail(dto);

    res.json(result);
  }

  private async resendVerification(req: Request, res: Response) {
    const dto = resendVerificationSchema.parse(req.body);
    const result = await authService.resendVerificationCode(dto);

    res.json(result);
  }

  private async register(req: Request, res: Response) {
    const dto = registerSchema.parse(req.body);

    // Publish event - user module will handle user creation
    const event = new UserRegistrationRequestedEvent(dto.email, {
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
    await eventBus.publish(event);

    res.status(201).json({
      message: "Registration request received. Check your email for a verification code.",
      email: dto.email,
      verificationRequired: true,
    });
  }
}

export const authController = new AuthController();
