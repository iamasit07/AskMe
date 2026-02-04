import { useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface StreamMessage {
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ToolCallInfo {
  name: string;
  input?: unknown;
  output?: unknown;
  status: "running" | "completed";
}

interface UseStreamingChatReturn {
  sendMessage: (
    content: string,
    previousMessages: StreamMessage[],
  ) => Promise<string>;
  streamingMessage: string;
  isStreaming: boolean;
  toolCalls: ToolCallInfo[];
  error: string | null;
  clearError: () => void;
}

export const useStreamingChat = (
  chatBlockId: string | null,
): UseStreamingChatReturn => {
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCallInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      content: string,
      previousMessages: StreamMessage[],
    ): Promise<string> => {
      if (!chatBlockId) {
        setError("No chat block selected");
        return "";
      }

      setIsStreaming(true);
      setStreamingMessage("");
      setToolCalls([]);
      setError(null);

      try {
        const messages = [...previousMessages, { role: "user", content }];

        const response = await fetch(`${API_URL}/api/chat/${chatBlockId}/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // This sends cookies with the request
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullMessage = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]" || !data) {
                continue;
              }

              try {
                const event = JSON.parse(data);

                switch (event.type) {
                  case "token":
                    if (typeof event.data === "string") {
                      fullMessage += event.data;
                      setStreamingMessage(fullMessage);
                    }
                    break;

                  case "tool_start": {
                    const toolStart = event.data as {
                      toolName: string;
                      input: unknown;
                    };
                    setToolCalls((prev) => [
                      ...prev,
                      {
                        name: toolStart.toolName,
                        input: toolStart.input,
                        status: "running",
                      },
                    ]);
                    break;
                  }

                  case "tool_end": {
                    const toolEnd = event.data as {
                      toolName: string;
                      output: unknown;
                    };
                    setToolCalls((prev) =>
                      prev.map((t) =>
                        t.name === toolEnd.toolName && t.status === "running"
                          ? {
                              ...t,
                              output: toolEnd.output,
                              status: "completed" as const,
                            }
                          : t,
                      ),
                    );
                    break;
                  }

                  case "done":
                    setIsStreaming(false);
                    return fullMessage;

                  case "error": {
                    const errorData = event.data as { message: string };
                    throw new Error(errorData.message);
                  }
                }
              } catch (parseError) {
                // Ignore JSON parse errors for incomplete data
                if (!(parseError instanceof SyntaxError)) {
                  throw parseError;
                }
              }
            }
          }
        }

        setIsStreaming(false);
        return fullMessage;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Streaming failed";
        setError(errorMessage);
        setIsStreaming(false);
        setStreamingMessage("");
        return "";
      }
    },
    [chatBlockId],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    streamingMessage,
    isStreaming,
    toolCalls,
    error,
    clearError,
  };
};
