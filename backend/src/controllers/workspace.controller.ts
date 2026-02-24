import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.middleware.js";
import { addDocumentToWorkspace } from "../services/pinecone.service.js";
import * as pdfParseModule from "pdf-parse";
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

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

// Upload document (PDF/Image)
export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    const file = req.file;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    if (!id) {
      throw new AppError("Workspace ID is required", 400);
    }

    if (!file) {
      throw new AppError("File is required", 400);
    }

    // Check ownership
    const existingWorkspace = await prisma.workspace.findFirst({
      where: { id, userId },
    });

    if (!existingWorkspace) {
      throw new AppError("Workspace not found", 404);
    }

    let extractedText = "";

    if (file.mimetype === "application/pdf") {
      const data = await pdfParse(file.buffer);
      extractedText = data.text;
    } else if (file.mimetype.startsWith("image/")) {
      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-pro",
        maxOutputTokens: 2048,
        apiKey: process.env.GEMINI_API_KEY as string,
      });

      const imageBase64 = file.buffer.toString("base64");
      const result = await llm.invoke([
        {
          role: "user",
          content: [
            { type: "text", text: "Please extract all text from this image accurately. Do not add conversational filler, just the exact text found in the image." },
            { type: "image_url", image_url: { url: `data:${file.mimetype};base64,${imageBase64}` } }
          ]
        }
      ]);
      extractedText = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
    } else {
      throw new AppError("Unsupported file type", 400);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new AppError("Could not extract any text from the file", 400);
    }

    await addDocumentToWorkspace(id, extractedText, file.originalname);

    res.status(200).json({ message: "File processed and added successfully", originalName: file.originalname });
  } catch (error) {
    next(error);
  }
};
