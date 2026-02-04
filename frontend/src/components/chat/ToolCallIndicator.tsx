import { Search, Loader2, CheckCircle } from "lucide-react";
import type { ToolCallInfo } from "@/hooks/useStreamingChat";

interface ToolCallIndicatorProps {
  toolCalls: ToolCallInfo[];
}

export const ToolCallIndicator = ({ toolCalls }: ToolCallIndicatorProps) => {
  if (toolCalls.length === 0) return null;

  return (
    <div className="space-y-2 mb-3">
      {toolCalls.map((tool, index) => (
        <div
          key={`${tool.name}-${index}`}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg text-sm"
        >
          {tool.status === "running" ? (
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
          )}

          {tool.name === "tavily_search_results_json" ||
          tool.name === "web_search" ? (
            <>
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-300">
                {tool.status === "running" ? "Searching: " : "Searched: "}
                <span className="text-blue-400">
                  {getSearchQuery(tool.input)}
                </span>
              </span>
            </>
          ) : (
            <span className="text-gray-300">
              {tool.status === "running" ? "Running " : "Completed "}
              <span className="text-blue-400">{tool.name}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const getSearchQuery = (input: unknown): string => {
  if (!input) return "...";

  if (typeof input === "string") {
    return input.slice(0, 50) + (input.length > 50 ? "..." : "");
  }

  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    const query = obj.query || obj.search_query || obj.q || "";
    if (typeof query === "string") {
      return query.slice(0, 50) + (query.length > 50 ? "..." : "");
    }
  }

  return "...";
};
