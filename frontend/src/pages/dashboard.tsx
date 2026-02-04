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
    : null;

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
            workspaces.length === 0 ? (
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
                  {!workspacesLoading && (
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
            ) : (
              // Workspaces exist but none selected - show recent list
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Select a Workspace
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {workspaces.slice(0, 5).map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => selectWorkspace(workspace)}
                        className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-blue-500/50 transition-all group flex flex-col items-center text-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                          <Sparkles className="h-6 w-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-200 truncate max-w-[200px]">
                            {workspace.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {workspace.chatPages?.length || 0} chats
                          </p>
                        </div>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setShowCreateWorkspace(true)}
                      className="p-6 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all group flex flex-col items-center text-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                        <Plus className="h-6 w-6 text-gray-500 group-hover:text-gray-300 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-400 group-hover:text-gray-200 transition-colors">
                          Create New
                        </h3>
                        <p className="text-xs text-gray-600">
                          Add a new workspace
                        </p>
                      </div>
                    </button>
                  </div>
                  {/* Removed separate button container since it's now in the grid */}
                </div>
              </div>
            )
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
