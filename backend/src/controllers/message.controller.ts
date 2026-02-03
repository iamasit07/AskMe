import type { Response } from "express";
import prisma from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const listMessages = async (
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
      return res.status(400).json({ message: "chatPageId is required" });
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
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatPageId: chatPageId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error listing messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const chatPageId = req.params.chatPageId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatPageId || typeof chatPageId !== "string") {
      return res.status(400).json({ message: "chatPageId is required" });
    }

    const message = await prisma.chatPage.findFirst({
      where: {
        id: chatPageId,
      },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: message.workspaceId,
        userId: userId,
      },
    });

    if (!workspace) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(message);
  } catch (error) {
    console.error("Error getting message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createMessage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const chatPageId = req.params.chatPageId;
    const { content, role } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatPageId || typeof chatPageId !== "string") {
      return res.status(400).json({ message: "chatPageId is required" });
    }

    if (!role || typeof role !== "string") {
      return res
        .status(400)
        .json({ message: "role is required and must be a string" });
    }

    if (!content || typeof content !== "string") {
      return res
        .status(400)
        .json({ message: "content is required and must be a string" });
    }

    const validRole = ["user", "assistant", "system"];
    if (!validRole.includes(role)) {
      return res.status(400).json({
        message: `role must be one of the following: ${validRole.join(", ")}`,
      });
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
      return res.status(403).json({ message: "Forbidden" });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        role,
        chatPageId: chatPageId,
      },
    });

    await prisma.chatPage.update({
      where: {
        id: chatPageId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const messageId = req.params.messageId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!messageId || typeof messageId !== "string") {
      return res.status(400).json({ message: "messageId is required" });
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
      },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const chatPage = await prisma.chatPage.findFirst({
      where: {
        id: message.chatPageId,
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
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.message.delete({
      where: {
        id: messageId,
      },
    });

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
