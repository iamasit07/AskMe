import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Workspace, ChatPage } from "../types/index";

interface SelectionContextType {
  selectedWorkspaceId: string | null;
  selectedChatPageId: string | null;
  selectWorkspace: (workspace: Workspace | null) => void;
  selectChatPage: (chatPage: ChatPage | null) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined
);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedChatPageId, setSelectedChatPageId] = useState<string | null>(null);

  const selectWorkspace = useCallback((workspace: Workspace | null) => {
    setSelectedWorkspaceId(workspace?.id ?? null);
    setSelectedChatPageId(null); // Reset chat when workspace changes
  }, []);

  const selectChatPage = useCallback((chatPage: ChatPage | null) => {
    setSelectedChatPageId(chatPage?.id ?? null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedWorkspaceId(null);
    setSelectedChatPageId(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedWorkspaceId,
      selectedChatPageId,
      selectWorkspace,
      selectChatPage,
      clearSelection,
    }),
    [selectedWorkspaceId, selectedChatPageId, selectWorkspace, selectChatPage, clearSelection]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}

export default SelectionContext;
