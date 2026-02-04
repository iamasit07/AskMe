import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import api from "../lib/axios";
import type { Workspace } from "../types/index";
import { toast } from "sonner";

export interface WorkspaceContextType {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  updateWorkspace: (id: string, name: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/workspaces");
      setWorkspaces(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const createWorkspace = async (name: string): Promise<Workspace> => {
    try {
      const { data } = await api.post("/api/workspaces", { name });
      setWorkspaces((prev) => [data, ...prev]);
      toast.success("Workspace created");
      return data;
    } catch (err) {
      toast.error("Failed to create workspace");
      throw err;
    }
  };

  const updateWorkspace = async (
    id: string,
    name: string,
  ): Promise<Workspace> => {
    try {
      const { data } = await api.put(`/api/workspaces/${id}`, {name});
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? data : w)));
      toast.success("Workspace renamed");
      return data;
    } catch (err) {
      toast.error("Failed to rename workspace");
      throw err;
    }
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/workspaces/${id}`);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      toast.success("Workspace deleted");
    } catch (err) {
      toast.error("Failed to delete workspace");
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      workspaces,
      loading,
      error,
      refresh: fetchWorkspaces,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
    }),
    [workspaces, loading, error, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceContext;
