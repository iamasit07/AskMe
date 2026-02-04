import { Router, type RequestHandler } from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspace.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  mongoIdSchema,
} from "../lib/validations.js";

import { z } from "zod";

const WorkspaceRouter = Router();

// All workspace routes require authentication
WorkspaceRouter.use(authMiddleware as RequestHandler);

WorkspaceRouter.get("/", getWorkspaces as unknown as RequestHandler);
WorkspaceRouter.get(
  "/:id",
  validateParams(z.object({ id: mongoIdSchema })) as RequestHandler,
  getWorkspace as unknown as RequestHandler,
);
WorkspaceRouter.post(
  "/",
  validateBody(createWorkspaceSchema) as RequestHandler,
  createWorkspace as unknown as RequestHandler,
);
WorkspaceRouter.put(
  "/:id",
  validateParams(z.object({ id: mongoIdSchema })) as RequestHandler,
  validateBody(updateWorkspaceSchema) as RequestHandler,
  updateWorkspace as unknown as RequestHandler,
);
WorkspaceRouter.delete(
  "/:id",
  validateParams(z.object({ id: mongoIdSchema })) as RequestHandler,
  deleteWorkspace as unknown as RequestHandler,
);

export default WorkspaceRouter;
