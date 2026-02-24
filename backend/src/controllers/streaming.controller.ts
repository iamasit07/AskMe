import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.middleware.js";
import {
  convertToLangChainMessages,
  getChatAgent,
  type SSEEvent,
} from "../services/agent.service.js";

export const streamChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  const chatPageId = req.params.chatPageId as string;
  const messageContent = req.body;

  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }

  if (!chatPageId) {
    return next(new AppError("Chat page ID is required", 400));
  }

  if (
    !messageContent ||
    !Array.isArray(messageContent) ||
    messageContent.length === 0
  ) {
    return next(new AppError("Message content is required", 400));
  }

  try {
    const chatPage = await prisma.chatPage.findFirst({
      where: {
        id: chatPageId,
      },
      include: {
        workspace: true,
      },
    });

    if (!chatPage) {
      return next(new AppError("Chat page not found", 404));
    }

    if (chatPage.workspace.userId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    // Save user message to database
    const lastMessage = messageContent[messageContent.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      await prisma.message.create({
        data: {
          chatPageId: chatPageId,
          content: lastMessage.content,
          role: lastMessage.role,
        },
      });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sendEvent = (event: SSEEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const agentMessages = convertToLangChainMessages(messageContent);

    const agent = await getChatAgent(chatPage.workspace.id);
    let fullContent = "";
    const toolCalls: Array<{ name: string; args: unknown; result?: string }> =
      [];

    try {
      for await (const event of agent.stream(agentMessages)) {
        sendEvent(event);

        if (event.type === "token" && typeof event.data === "string") {
          fullContent += event.data;
        }

        if (event.type === "tool_start") {
          const toolData = event.data as { toolName: string; input: unknown };
          toolCalls.push({ name: toolData.toolName, args: toolData.input });
        }

        if (event.type === "tool_end") {
          const toolData = event.data as { toolName: string; output: unknown };
          const toolCall = toolCalls.find(
            (tc) => tc.name === toolData.toolName && !tc.result,
          );
          if (toolCall) {
            toolCall.result = JSON.stringify(toolData.output);
          }
        }
      }

      // Save assistant response to database
      if (fullContent.trim().length > 0) {
        await prisma.message.create({
          data: {
            chatPageId: chatPageId,
            content: fullContent,
            role: "assistant",
            metadata:
              toolCalls.length > 0
                ? { toolCalls: JSON.parse(JSON.stringify(toolCalls)) }
                : {},
          },
        });
      }

      // Update chatPage timestamp
      await prisma.chatPage.update({
        where: { id: chatPageId },
        data: { updatedAt: new Date() },
      });

      sendEvent({ type: "done", data: { success: true } });
    } catch (error) {
      console.error("Error during agent streaming:", error);
      sendEvent({
        type: "error",
        data: {
          message:
            error instanceof Error ? error.message : "Streaming error occurred",
        },
      });
    }

    res.end();
  } catch (error) {
    console.error("Error in streamChat:", error);

    if (!res.headersSent) {
      next(error);
    } else {
      res.write(
        `data: ${JSON.stringify({ type: "error", data: { message: "Internal server error" } })}\n\n`,
      );
      res.end();
    }
  }
};

export const completeChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  const chatPageId = req.params.chatPageId as string;
  const messageContent = req.body;

  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }

  if (!chatPageId) {
    return next(new AppError("Chat page ID is required", 400));
  }

  if (
    !messageContent ||
    !Array.isArray(messageContent) ||
    messageContent.length === 0
  ) {
    return next(new AppError("Message content is required", 400));
  }

  try {
    const chatPage = await prisma.chatPage.findFirst({
      where: {
        id: chatPageId,
      },
      include: {
        workspace: true,
      },
    });

    if (!chatPage) {
      return next(new AppError("Chat page not found", 404));
    }

    if (chatPage.workspace.userId !== userId) {
      return next(new AppError("Forbidden", 403));
    }

    // Save user message
    const lastUserMessage = messageContent[messageContent.length - 1];
    const userContent = lastUserMessage?.content || "";

    await prisma.message.create({
      data: {
        chatPageId: chatPageId,
        content: userContent,
        role: "user",
      },
    });

    const agentMessages = convertToLangChainMessages(messageContent);
    const agent = await getChatAgent(chatPage.workspace.id);
    const resultMessages = await agent.invoke(agentMessages);

    // Extract text content from the last AI message
    const lastMessage = resultMessages[resultMessages.length - 1];
    const content = typeof lastMessage?.content === 'string' 
      ? lastMessage.content 
      : JSON.stringify(lastMessage?.content || '');

    const assistantMessage = await prisma.message.create({
      data: {
        chatPageId: chatPageId,
        content: content,
        role: "assistant",
      },
    });

    await prisma.chatPage.update({
      where: { id: chatPageId },
      data: { updatedAt: new Date() },
    });

    res.status(200).json({ message: assistantMessage });
  } catch (error) {
    next(error);
  }
};
