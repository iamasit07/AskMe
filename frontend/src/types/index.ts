export interface Workspace {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  chatPages?: ChatPage[];
}

export interface ChatPage {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  chatPageId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
