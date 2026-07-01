import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { authService } from "../service/auth.service";
import { loginSchema, refreshTokenSchema, registerSchema } from "../schema/auth.schema";
import { authenticate, AuthRequest } from "../../../middleware/auth.middleware";
import { userService } from "../../user/service/user.service";
import { signAccessToken, signRefreshToken } from "../../common/auth/jwt";
import { isSystemAdminEmail } from "../../../utils/auth/system-admin.utils";

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
     *     summary: Register a new user and log them in
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
    this.router.post("/register", this.wrap(this.register));

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

  private async register(req: Request, res: Response) {
    const dto = registerSchema.parse(req.body);

    const user = await userService.createUser(dto.email, dto.password, dto.name);
    const payload = { sub: user._id.toString(), role: user.role };

    res.status(201).json({
      message: "Registration completed successfully.",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: isSystemAdminEmail(user.email) ? "admin" : user.role,
      },
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    });
  }
}

export const authController = new AuthController();
