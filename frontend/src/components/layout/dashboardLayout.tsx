import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkspaceSelector } from "@/components/workspace/WorkspaceSelector";
import { ChatPageList } from "@/components/workspace/ChatPageList";
import { MessageSquare, Menu, X, Settings, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelection } from "@/context/SelectionContext";
import useWorkspaces from "@/hooks/useWorkspaces";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({
  children,
}: DashboardLayoutProps) => {
  const { user } = useAuth();
  const { selectedWorkspaceId } = useSelection();
  const { workspaces } = useWorkspaces();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId) || null;

  const userInitials =
    (user?.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : user?.email?.split("@")[0]?.slice(0, 2)?.toUpperCase()) || "U";

  return (
    <div className="h-screen lg:h-dvh overflow-hidden bg-gray-900 flex">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-gray-800/50 border-r border-gray-700 backdrop-blur-sm
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${sidebarOpen ? "lg:w-72" : "lg:w-0 lg:overflow-hidden"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <MessageSquare className="h-6 w-6 text-blue-400 shrink-0" />
            <span className="font-bold text-lg text-white truncate">AI Chat</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-700 shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Workspace Selector */}
        <WorkspaceSelector />

        {/* Chat Pages List */}
        <ChatPageList />

        {/* User Section */}
        <div className="mt-auto p-3 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-800 transition-colors group">
              <Avatar className="h-8 w-8 group-hover:ring-2 ring-blue-500 transition-all">
                {user?.avatar ? (
                  <img src={user.avatar} className="aspect-square h-full w-full object-cover" alt="Avatar" />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white group-hover:text-blue-400 transition-colors truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">View Profile</p>
              </div>
              <Settings className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm flex items-center px-4 gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileMenuOpen(true);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {location.pathname !== "/dashboard" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white hover:bg-gray-700 mr-2"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="flex-1">
            {selectedWorkspace && (
              <h1 className="text-sm font-medium text-gray-200 truncate">
                {selectedWorkspace.name}
              </h1>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};
