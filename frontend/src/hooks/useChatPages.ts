import { useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import type { ChatPage } from "../types/index";
import { toast } from "sonner";

export const useChatPages = (workspaceId: string | null) => {
  const [chatPages, setChatPages] = useState<ChatPage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChatPages = useCallback(async () => {
    if (!workspaceId) {
      setChatPages([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get(
        `/api/chat-pages/workspace/${workspaceId}`,
      );
      setChatPages(data.chats || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchChatPages();
  }, [fetchChatPages]);

  const createChatPage = useCallback(async (title: string) => {
    if (!workspaceId) return;
    try {
      const { data } = await api.post(
        `/api/chat-pages/workspace/${workspaceId}`,
        { title }
      );
      setChatPages((prev) => [data.chatPage, ...prev]);
      return data.chatPage;
    } catch (err) {
      toast.error("Failed to create chat");
      throw err;
    }
  }, [workspaceId]);

  const deleteChatPage = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/chat-pages/${id}`);
      setChatPages((prev) => prev.filter((c) => c.id !== id));
      toast.success("Chat deleted");
    } catch (err) {
      toast.error("Failed to delete chat");
      throw err;
    }
  }, []);

  const updateChatPageTitle = useCallback(async (id: string, title: string) => {
    try {
      const { data } = await api.put(`/api/chat-pages/${id}`, { title });
      setChatPages((prev) =>
        prev.map((c) => (c.id === id ? data.chatPage : c))
      );
    } catch (err) {
      toast.error("Failed to update chat");
      throw err;
    }
  }, []);

  return {
    chatPages,
    loading,
    createChatPage,
    deleteChatPage,
    updateChatPageTitle,
    refresh: fetchChatPages,
  };
};
