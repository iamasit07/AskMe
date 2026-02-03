import type { Response } from "express";
import prisma from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const listWorkspaces = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const workspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chatPages: true },
        },
      },
    });

    res.status(200).json(workspaces);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getWorkspace = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user.id;
    const workspaceId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({ message: "Invalid workspace ID" });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
      include: {
        chatPages: {
          orderBy: { updatedAt: "desc" },
          include: {
            _count: { select: { messages: true } },
          },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.status(200).json(workspace);
  } catch (error) {
    console.error("Error fetching workspace:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createWorkspace = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    if (!name && typeof name !== "string" && name.trim().length === 0) {
      return res.status(400).json({ message: "Invalid workspace name" });
    }

    const newWorkspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        userId,
      },
    });

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateWorkspace = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user.id;
    const workspaceId = req.params.id;
    const { name } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({ message: "Invalid workspace ID" });
    }

    if (!name && typeof name !== "string" && name.trim().length === 0) {
      return res.status(400).json({ message: "Invalid workspace name" });
    }

    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: name.trim(),
        updatedAt: new Date(),
      },
    });

    res.status(200).json(workspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteWorkspace = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user.id;
    const workspaceId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({ message: "Invalid workspace ID" });
    }

    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting workspace:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
