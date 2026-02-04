import { memo } from "react";
import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ToolCallIndicator } from "./ToolCallIndicator";
import type { ToolCallInfo } from "@/hooks/useStreamingChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StreamingMessageProps {
  content: string;
  toolCalls: ToolCallInfo[];
  isStreaming: boolean;
}

export const StreamingMessage = memo(({
  content,
  toolCalls,
  isStreaming,
}: StreamingMessageProps) => {
  const showThinking = isStreaming && !content && toolCalls.length === 0;

  return (
    <div className="flex gap-3 px-4 py-4">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-linear-to-br from-purple-600 to-blue-600 text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">
            AI Assistant
          </span>
        </div>

        {/* Tool Calls */}
        <ToolCallIndicator toolCalls={toolCalls} />

        {/* Message Content */}
        <div className="text-gray-200 min-w-0">
          {showThinking ? (
            <div className="flex items-center gap-2 text-gray-400">
              <span>Thinking</span>
              <span className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          ) : content ? (
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});
