import { useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatPages } from "@/hooks/useChatPages";
import useWorkspaces from "@/hooks/useWorkspaces";
import type { ChatPage } from "@/types";
import { CreateChatDialog } from "@/components/chat/CreateChatDialog";
import { useSelection } from "@/context/SelectionContext";

export const ChatPageList = () => {
  const { selectedWorkspaceId, selectedChatPageId, selectChatPage } = useSelection();
  const { chatPages, loading, deleteChatPage, refresh: refreshChats } = useChatPages(selectedWorkspaceId);
  const { refresh: refreshWorkspaces } = useWorkspaces();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent, chatPageId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      await deleteChatPage(chatPageId);
      refreshWorkspaces();
      refreshChats();
    }
  };

  const handleCreateSuccess = (chatPage: ChatPage) => {
    selectChatPage(chatPage);
    refreshWorkspaces();
    refreshChats();
  };

  if (!selectedWorkspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500 text-center">
          Select a workspace to view chats
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-3 space-y-2">
        <Skeleton className="h-8 w-full bg-gray-700" />
        <Skeleton className="h-12 w-full bg-gray-700" />
        <Skeleton className="h-12 w-full bg-gray-700" />
        <Skeleton className="h-12 w-full bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-3 space-y-1">
          {chatPages.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No chats yet. Create one to get started!
            </div>
          ) : (
            chatPages.map((chatPage) => (
              <div
                key={chatPage.id}
                role="button"
                tabIndex={0}
                onClick={() => selectChatPage(chatPage)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    selectChatPage(chatPage);
                  }
                }}
                className={`w-full group p-3 rounded-lg text-left transition-colors flex items-start gap-3 cursor-pointer ${
                  selectedChatPageId === chatPage.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{chatPage.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(() => {
                      const count = chatPage._count?.messages || 0;
                      return count > 90 ? "90+ messages" : `${count} messages`;
                    })()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, chatPage.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <CreateChatDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        workspaceId={selectedWorkspaceId}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
