import { useState } from "react";
import { ChevronDown, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useWorkspaces from "@/hooks/useWorkspaces";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import type { Workspace } from "@/types/index";

import { useSelection } from "@/context/SelectionContext";

export function WorkspaceSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { workspaces, loading, refresh } = useWorkspaces();
  const { selectedWorkspaceId, selectWorkspace } = useSelection();

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId) || null;

  const handleWorkspaceCreated = async (workspace: Workspace) => {
    await refresh();
    selectWorkspace(workspace);
  };

  if (loading) {
    return (
      <div className="p-3 border-b border-gray-700">
        <Skeleton className="h-10 w-full bg-gray-700" />
      </div>
    );
  }

  return (
    <>
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-between text-left font-normal bg-gray-700/50 hover:bg-gray-700 text-white border border-gray-600"
          >
            <span className="flex items-center gap-2 truncate">
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-400" />
              <span className="truncate">
                {selectedWorkspace?.name || "Select Workspace"}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </Button>

          {isOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
              {workspaces.length === 0 ? (
                <div className="p-3 text-sm text-gray-400 text-center">
                  No workspaces yet
                </div>
              ) : (
                workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      selectWorkspace(workspace);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 ${
                      selectedWorkspace?.id === workspace.id
                        ? "bg-gray-700 text-blue-400"
                        : "text-gray-200"
                    }`}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate">{workspace.name}</span>
                    {workspace.chatPages && workspace.chatPages.length > 0 && (
                      <span className="ml-auto text-xs text-gray-500">
                        {workspace.chatPages.length} chats
                      </span>
                    )}
                  </button>
                ))
              )}

              <div className="border-t border-gray-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleWorkspaceCreated}
      />
    </>
  );
}
