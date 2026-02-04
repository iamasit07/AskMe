import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { Workspace } from "@/types/index";
import useWorkspaces from "@/hooks/useWorkspaces";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (workspace: Workspace) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createWorkspace } = useWorkspaces();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[CreateWorkspace] Creating workspace:", name.trim());
      const workspace = await createWorkspace(name.trim());
      console.log("[CreateWorkspace] Success:", workspace);
      setName("");
      onOpenChange(false);
      onSuccess?.(workspace);
    } catch (err) {
      console.error("[CreateWorkspace] Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create workspace",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create Workspace</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new workspace to organize your AI conversations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">
                Workspace Name
              </Label>
              <Input
                id="name"
                placeholder="My Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
