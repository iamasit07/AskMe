import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import {
  getMessages,
  listMessages,
  createMessage,
  deleteMessage,
} from "../controllers/message.controller.js";

const MessageRouter = Router();

MessageRouter.get("/", listMessages as unknown as RequestHandler);
MessageRouter.get("/:chatPageId", getMessages as unknown as RequestHandler);
MessageRouter.post("/", createMessage as unknown as RequestHandler);
MessageRouter.delete(
  "/:chatPageId",
  deleteMessage as unknown as RequestHandler,
);

export default MessageRouter;
