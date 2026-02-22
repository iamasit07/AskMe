import "./App.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";
import { DashboardPage } from "./pages/dashboard";
import { ProfilePage } from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { SelectionProvider } from "./context/SelectionContext";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <SelectionProvider>
                      <DashboardPage />
                    </SelectionProvider>
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <SelectionProvider>
                      <ProfilePage />
                    </SelectionProvider>
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
