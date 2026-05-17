import { Request, Response } from "express";

import { BaseController } from "../../common/base/base.controller";
import { authService } from "../service/auth.service";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from "../schema/auth.schema";
import { userService } from "../../user/service/user.service";
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
  }

  protected routes(): void {
    /**
     * @openapi
     * /api/authentications/login:
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
      * /api/authentications/register:
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
      * /api/authentications/refresh:
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
      * /api/authentications/logout:
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
      * /api/authentications/me:
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

  private async register(req: Request, res: Response) {
    const dto = registerSchema.parse(req.body);
    // Change it to an event that gets fired, the user module then acts on that event
    const user = await userService.createUser(dto.email, dto.password, dto.name);

    res.status(201).json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  }
}

export const authController = new AuthController();
