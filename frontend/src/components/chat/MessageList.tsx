import { useRef, useEffect, memo } from "react";
import { User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types/index";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export const MessageList = memo(({
  messages,
  isLoading = false,
}: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <MessageSkeleton isUser={false} />
        <MessageSkeleton isUser={true} />
        <MessageSkeleton isUser={false} />
      </div>
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="divide-y divide-gray-800">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
      <div ref={bottomRef} />
    </ScrollArea>
  );
});

interface MessageItemProps {
  message: Message;
}

const MessageItem = ({ message }: MessageItemProps) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex gap-3 px-4 py-4 ${isUser ? "bg-gray-800/30" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={
            isUser
              ? "bg-blue-600 text-white"
              : "bg-linear-to-br from-purple-600 to-blue-600 text-white"
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">
            {isUser ? "You" : isAssistant ? "AI Assistant" : message.role}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div className="text-gray-200 min-w-0">
          {isAssistant ? (
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageSkeleton = ({ isUser }: { isUser: boolean }) => {
  return (
    <div className={`flex gap-3 px-4 py-4 ${isUser ? "bg-gray-800/30" : ""}`}>
      <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24 bg-gray-700" />
        <Skeleton
          className={`h-16 ${isUser ? "w-1/2" : "w-3/4"} bg-gray-700`}
        />
      </div>
    </div>
  );
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
