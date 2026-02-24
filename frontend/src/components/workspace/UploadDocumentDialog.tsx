import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import type { Workspace } from "@/types/index";
import { toast } from "sonner";

interface UploadDocumentDialogProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadDocument: (workspaceId: string, file: File) => Promise<void>;
}

export function UploadDocumentDialog({ workspace, open, onOpenChange, uploadDocument }: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      await uploadDocument(workspace.id, file);
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <form onSubmit={handleUpload}>
          <DialogHeader>
            <DialogTitle>Upload Document to {workspace?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                File
              </Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="col-span-3 bg-gray-700 border-gray-600 text-white file:text-white file:bg-gray-600 file:border-0 hover:file:bg-gray-500 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Supported formats: PDF, JPG, PNG, WebP (Max 5MB)
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading || !file}>
              {isUploading ? "Uploading..." : "Upload"}
              <Upload className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
