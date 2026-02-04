import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import WorkspaceRouters from "./routes/workspace.routes.js";
import ChatPageRouter from "./routes/chatPage.routes.js";
import MessageRouter from "./routes/message.routes.js";

const app = express();
dotenv.config();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/api/workspaces", WorkspaceRouters);
app.use("/api/messages", ChatPageRouter);
app.use("api/:chatPageId/messages", MessageRouter);

const PORT = process.env.PORT || 5000;

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
