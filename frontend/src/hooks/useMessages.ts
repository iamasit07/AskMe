import { useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import type { Message } from "../types/index";

export function useMessages(chatBlockId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!chatBlockId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get(`/api/chat-pages/${chatBlockId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  }, [chatBlockId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = useCallback(
    (message: Partial<Message> & { role: string; content: string }) => {
      setMessages((prev) => [...prev, message as Message]);
    },
    []
  );

  const addOptimisticMessage = useCallback(
    (role: "user" | "assistant", content: string = "") => {
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        role,
        content,
        chatPageId: chatBlockId || "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      return optimisticMessage;
    },
    [chatBlockId]
  );

  const updateLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const newPrev = [...prev];
      const lastMsg = newPrev[newPrev.length - 1];
      if (lastMsg.role === "assistant") {
        newPrev[newPrev.length - 1] = { ...lastMsg, content };
      }
      return newPrev;
    });
  }, []);

  return {
    messages,
    loading,
    addMessage,
    addOptimisticMessage,
    updateLastMessage,
    refresh: fetchMessages,
  };
}
