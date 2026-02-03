import type { User } from "@prisma/client";
import type { Request } from "express";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  id: string;
  email: string;
  user: UserInfo;
}

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatPage {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  chatPageId: string;
  createdAt: Date;
  updatedAt: Date;
}

export 