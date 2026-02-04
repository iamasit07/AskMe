import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { StreamingMessage } from "./StreamingMessage";
import { useMessages } from "@/hooks/useMessages";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import type { StreamMessage } from "@/hooks/useStreamingChat";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface ChatInterfaceProps {
  chatPageId: string;
}

export const ChatInterface = ({ chatPageId }: ChatInterfaceProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading: messagesLoading,
    addMessage,
  } = useMessages(chatPageId);

  const {
    sendMessage,
    streamingMessage,
    isStreaming,
    toolCalls,
    error,
    clearError,
  } = useStreamingChat(chatPageId);

  // Auto-scroll when streaming
  useEffect(() => {
    if (isStreaming || streamingMessage) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isStreaming, streamingMessage]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error("Error", {
        description: error,
      });
      clearError();
    }
  }, [error, clearError]);

  const handleSend = async (content: string) => {
    addMessage({
      role: "user",
      content,
    });

    // Prepare previous messages for context
    const previousMessages: StreamMessage[] = messages.map(
      (m: StreamMessage) => ({
        role: m.role,
        content: m.content,
        metadata: m.metadata,
      }),
    );

    try {
      // Send and stream response
      const response = await sendMessage(content, previousMessages);

      // Manually add the response to local state to avoid extracting full message list
      if (response) {
        addMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: response,
          chatPageId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      toast.error("Failed to send message", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  if (messagesLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <MessageList messages={[]} isLoading={true} />
        </div>
        <MessageInput onSend={handleSend} disabled={true} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isStreaming ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md p-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Start the conversation
              </h3>
              <p className="text-sm text-gray-400">
                Ask anything! I can search the web for current information.
              </p>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />

            {/* Streaming Message */}
            {isStreaming && (
              <StreamingMessage
                content={streamingMessage}
                toolCalls={toolCalls}
                isStreaming={true}
              />
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <MessageInput
        onSend={handleSend}
        disabled={isStreaming}
        placeholder={
          isStreaming ? "AI is responding..." : "Type your message..."
        }
      />
    </div>
  );
};
