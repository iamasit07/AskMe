import { useState } from "react";
import { ChevronDown, Plus, FolderOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useWorkspaces from "@/hooks/useWorkspaces";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { EditWorkspaceDialog } from "./EditWorkspaceDialog";
import type { Workspace } from "@/types/index";

import { useSelection } from "@/context/SelectionContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  
  const { workspaces, loading, refresh, updateWorkspace, deleteWorkspace } = useWorkspaces();
  const { selectedWorkspaceId, selectWorkspace } = useSelection();

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId) || null;

  const handleWorkspaceCreated = async (workspace: Workspace) => {
    await refresh();
    selectWorkspace(workspace);
  };

  const handleWorkspaceUpdated = async (workspace: Workspace) => {
    await refresh();
    if (selectedWorkspaceId === workspace.id) {
      selectWorkspace(workspace);
    }
  };

  const handleDelete = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this workspace? All chats will be lost.")) {
      await deleteWorkspace(workspaceId);
      if (selectedWorkspaceId === workspaceId) {
        selectWorkspace(null);
      }
    }
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
                  <div
                    key={workspace.id}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center justify-between group ${
                      selectedWorkspace?.id === workspace.id
                        ? "bg-gray-700 text-blue-400"
                        : "text-gray-200"
                    }`}
                  >
                    <button
                      className="flex-1 flex items-center gap-2 truncate text-left"
                      onClick={() => {
                        selectWorkspace(workspace);
                        setIsOpen(false);
                      }}
                    >
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{workspace.name}</span>
                    </button>
                    
                    <div className="flex items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-gray-600 text-gray-400">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 bg-gray-800 border-gray-700 text-gray-200">
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingWorkspace(workspace);
                                    }}
                                    className="cursor-pointer focus:bg-gray-700 focus:text-white"
                                >
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    <span>Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={(e) => handleDelete(e, workspace.id)}
                                    className="cursor-pointer text-red-400 focus:bg-red-900/30 focus:text-red-300"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
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
      
      <EditWorkspaceDialog 
        workspace={editingWorkspace}
        open={!!editingWorkspace}
        onOpenChange={(open) => !open && setEditingWorkspace(null)}
        onSuccess={handleWorkspaceUpdated}
        updateWorkspace={updateWorkspace}
      />
    </>
  );
}
