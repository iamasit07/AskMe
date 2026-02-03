import { Router, type RequestHandler } from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "../controllers/workspace.controller.js";
import type { Workspace } from "@prisma/client";

const WorkspaceRouter = Router();

WorkspaceRouter.get("/", listWorkspaces as unknown as RequestHandler);
WorkspaceRouter.get("/:workspaceId", getWorkspace as unknown as RequestHandler);
WorkspaceRouter.post("/", createWorkspace as unknown as RequestHandler);
WorkspaceRouter.put(
  "/:workspaceId",
  updateWorkspace as unknown as RequestHandler,
);
WorkspaceRouter.delete(
  "/:workspaceId",
  deleteWorkspace as unknown as RequestHandler,
);

export default WorkspaceRouter;
