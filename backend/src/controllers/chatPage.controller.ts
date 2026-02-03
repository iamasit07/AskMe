import type { Response } from "express";
import prisma from "../lib/prisma.js";
import type { AuthenticatedRequest, ChatPage } from "../types/index.js";

export const listChatPages = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const workspaceId = req.params.workspaceId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({ message: "Invalid workspace ID" });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: userId,
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const chats: ChatPage[] = await prisma.chatPage.findMany({
      where: { workspaceId: workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return res.status(200).json({ workspace, chats });
  } catch (error) {
    console.error("Error fetching chat page data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatPage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const chatPageId = req.params.chatPageId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatPageId || typeof chatPageId !== "string") {
      return res.status(400).json({ message: "Chat page ID is required" });
    }

    const chatPage = await prisma.chatPage.findFirst({
      where: {
        id: chatPageId,
      },
      include: {
        workspace: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chatPage) {
      return res.status(404).json({ message: "Chat page not found" });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: chatPage.workspaceId,
        userId: userId,
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    return res.status(200).json({ chatPage });
  } catch (error) {
    console.error("Error fetching chat page details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createChatPage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const workspaceId = req.params.workspaceId;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({ message: "Workspace ID is required" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: userId,
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (title && typeof title === "string" && title.trim().length > 100) {
      return res
        .status(400)
        .json({ message: "Title must be less than 100 characters" });
    }

    const newChatPage = await prisma.chatPage.create({
      data: {
        title: title.trim(),
        workspaceId: workspaceId,
      },
    });

    return res.status(201).json({ chatPage: newChatPage });
  } catch (error) {
    console.error("Error creating chat page:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateChatPageTitle = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const chatPageId = req.params.chatPageId;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatPageId || typeof chatPageId !== "string") {
      return res.status(400).json({ message: "Chat page ID is required" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (title && typeof title === "string" && title.trim().length > 100) {
      return res
        .status(400)
        .json({ message: "Title must be less than 100 characters" });
    }

    const chatPage = await prisma.chatPage.findFirst({
      where: {
        id: chatPageId,
      },
    });

    if (!chatPage) {
      return res.status(404).json({ message: "Chat page not found" });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: chatPage.workspaceId,
        userId: userId,
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const updatedChatPage = await prisma.chatPage.update({
      where: { id: chatPageId },
      data: { title: title.trim(), updatedAt: new Date() },
    });

    return res.status(200).json({ chatPage: updatedChatPage });
  } catch (error) {
    console.error("Error updating chat page title:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChatPage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const chatPageId = req.params.chatPageId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatPageId || typeof chatPageId !== "string") {
      return res.status(400).json({ message: "Chat page ID is required" });
    }

    const chatPage = await prisma.chatPage.findFirst({
      where: {
        id: chatPageId,
      },
    });

    if (!chatPage) {
      return res.status(404).json({ message: "Chat page not found" });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: chatPage.workspaceId,
        userId: userId,
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    await prisma.chatPage.delete({
      where: { id: chatPageId },
    });

    return res.status(200).json({ message: "Chat page deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat page:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
