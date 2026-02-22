import { Router, type RequestHandler } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { signupSchema, loginSchema } from "../lib/validations.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const router = Router();

router.post(
  "/signup",
  validateBody(signupSchema) as RequestHandler,
  authController.signup as RequestHandler,
);
router.post(
  "/login",
  validateBody(loginSchema) as RequestHandler,
  authController.login as RequestHandler,
);
router.post("/logout", authController.logout as RequestHandler);
router.post("/refresh", authController.refresh as RequestHandler);
router.get(
  "/me",
  authMiddleware as RequestHandler,
  authController.getMe as RequestHandler,
);
router.post("/google", authController.googleAuth as RequestHandler);
router.put(
  "/me/avatar",
  authMiddleware as RequestHandler,
  uploadAvatar.single("avatar") as RequestHandler,
  authController.updateAvatar as unknown as RequestHandler,
);
router.put(
  "/me",
  authMiddleware as RequestHandler,
  authController.updateProfile as RequestHandler,
);

export default router;
