import { useContext } from "react";
import WorkspaceContext from "../context/WorkspaceContext";
import type { WorkspaceContextType } from "../context/WorkspaceContext";

const useWorkspaces = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider",
    );
  }
  return context;
};

export default useWorkspaces;
