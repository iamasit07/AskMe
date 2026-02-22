import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.middleware.js";
import { addDocumentToWorkspace } from "../services/pinecone.service.js";

// Add document to workspace
export const addDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    const { text, title } = req.body;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!id) {
      throw new AppError("Workspace ID is required", 400);
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new AppError("Document text is required", 400);
    }

    // Check ownership
    const existingWorkspace = await prisma.workspace.findFirst({
      where: { id, userId },
    });

    if (!existingWorkspace) {
      throw new AppError("Workspace not found", 404);
    }

    await addDocumentToWorkspace(id, text, title);

    res.status(200).json({ message: "Document added successfully" });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const workspaces = await prisma.workspace.findMany({
      where: { userId },
      include: {
        chatPages: {
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(workspaces);
  } catch (error) {
    next(error);
  }
};

// Get single workspace by ID
export const getWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!id) {
      throw new AppError("Workspace ID is required", 400);
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        chatPages: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!workspace) {
      throw new AppError("Workspace not found", 404);
    }

    res.json(workspace);
  } catch (error) {
    next(error);
  }
};

// Create new workspace
export const createWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new AppError("Workspace name is required", 400);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        userId,
      },
      include: {
        chatPages: true,
      },
    });

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
};

// Update workspace
export const updateWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    const { name } = req.body;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!id) {
      throw new AppError("Workspace ID is required", 400);
    }

    // Check ownership
    const existingWorkspace = await prisma.workspace.findFirst({
      where: { id, userId },
    });

    if (!existingWorkspace) {
      throw new AppError("Workspace not found", 404);
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
      },
      include: {
        chatPages: true,
      },
    });

    res.json(workspace);
  } catch (error) {
    next(error);
  }
};

// Delete workspace
export const deleteWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!id) {
      throw new AppError("Workspace ID is required", 400);
    }

    // Check ownership
    const existingWorkspace = await prisma.workspace.findFirst({
      where: { id, userId },
    });

    if (!existingWorkspace) {
      throw new AppError("Workspace not found", 404);
    }

    // Delete workspace (cascades to chatPages and messages)
    await prisma.workspace.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
