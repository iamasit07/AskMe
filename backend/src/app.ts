import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { notFoundHandler } from "./middleware/errorHandler.middleware.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import WorkspaceRouters from "./routes/workspace.routes.js";
import ChatPageRouter from "./routes/chatPage.routes.js";
import MessageRouter from "./routes/message.routes.js";
import StreamingRouter from "./routes/streaming.routes.js";
import path from "path";

dotenv.config();

const app: Express = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

console.log("[APP] CORS origin:", corsOptions.origin);

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is working and healthy",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", WorkspaceRouters);
app.use("/api/chat-pages", ChatPageRouter);
app.use("/api/chat-pages/:chatPageId/messages", MessageRouter);
app.use("/api/chat", StreamingRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
