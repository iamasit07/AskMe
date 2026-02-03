import { Router, type RequestHandler } from "express";
import {
  createChatPage,
  deleteChatPage,
  getChatPage,
  listChatPages,
  updateChatPageTitle,
} from "../controllers/chatPage.controller.js";

const ChatPageRouter = Router();

ChatPageRouter.get("/", listChatPages as unknown as RequestHandler);
ChatPageRouter.get("/:chatPageId", getChatPage as unknown as RequestHandler);
ChatPageRouter.post("/", createChatPage as unknown as RequestHandler);
ChatPageRouter.put(
  "/:chatPageId",
  updateChatPageTitle as unknown as RequestHandler,
);
ChatPageRouter.delete(
  "/:chatPageId",
  deleteChatPage as unknown as RequestHandler,
);

export default ChatPageRouter;
