import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import { ChatInterface } from "@/components/chat/chatInterface";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import useWorkspaces from "@/hooks/useWorkspaces";
import { useChatPages } from "@/hooks/useChatPages";
import { useSelection } from "@/context/SelectionContext";
import type { Workspace } from "@/types";
import { MessageSquare, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const {
    selectedWorkspaceId,
    selectedChatPageId,
    selectWorkspace,
    selectChatPage,
  } = useSelection();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  // Derive the workspace object from ID - defaults to first workspace
  const selectedWorkspace = selectedWorkspaceId
    ? (workspaces.find((w) => w.id === selectedWorkspaceId) ?? null)
    : (workspaces[0] ?? null);

  // Effect to select first workspace if none selected and workspaces exist
  const { createChatPage } = useChatPages(selectedWorkspace?.id || null);

  const handleNewChat = async () => {
    if (!selectedWorkspace) return;

    try {
      const newChat = await createChatPage("New Chat");
      if (newChat) {
        selectChatPage(newChat);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const handleWorkspaceCreated = (workspace: Workspace) => {
    selectWorkspace(workspace);
  };

  return (
    <>
      <DashboardLayout>
        {/* Main Content */}
        <div className="h-full flex flex-col">
          {!selectedWorkspace ? (
            // No workspace selected - show create button
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-6">
                  <Sparkles className="h-8 w-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Welcome to AI Chat
                </h2>
                <p className="text-gray-400 mb-6">
                  {workspacesLoading
                    ? "Loading your workspaces..."
                    : "Create a workspace to organize your AI conversations."}
                </p>
                {!workspacesLoading && workspaces.length === 0 && (
                  <Button
                    onClick={() => setShowCreateWorkspace(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Workspace
                  </Button>
                )}
              </div>
            </div>
          ) : !selectedChatPageId ? (
            // Workspace selected but no chat
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-6">
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Start a Conversation
                </h2>
                <p className="text-gray-400 mb-6">
                  Click the button below or use the sidebar to start chatting
                  with AI in{" "}
                  <span className="text-blue-400">
                    {selectedWorkspace.name}
                  </span>
                </p>
                <Button
                  onClick={handleNewChat}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          ) : (
            <ChatInterface chatPageId={selectedChatPageId} />
          )}
        </div>
      </DashboardLayout>

      <CreateWorkspaceDialog
        open={showCreateWorkspace}
        onOpenChange={setShowCreateWorkspace}
        onSuccess={handleWorkspaceCreated}
      />
    </>
  );
}
