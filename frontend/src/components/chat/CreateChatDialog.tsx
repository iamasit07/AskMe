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
import { useChatPages } from "@/hooks/useChatPages";
import type { ChatPage } from "@/types/index";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess?: (chatPage: ChatPage) => void;
}

export function CreateChatDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: CreateChatDialogProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createChatPage } = useChatPages(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const chatTitle = title.trim() || "New Chat";

    setIsSubmitting(true);
    try {
      const chatPage = await createChatPage(chatTitle);
      setTitle("");
      onOpenChange(false);
      onSuccess?.(chatPage);
    } catch (err) {
      console.error("[CreateChat] Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create chat",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">New Chat</DialogTitle>
          <DialogDescription className="text-gray-400">
            Start a new conversation.
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
              <Label htmlFor="title" className="text-gray-200">
                Chat Title
              </Label>
              <Input
                id="title"
                placeholder="New Chat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
