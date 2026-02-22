import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Loader2, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/axios";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const userInitials =
    (user?.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : user?.email?.split("@")[0]?.slice(0, 2)?.toUpperCase()) || "U";

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name === user?.name) return;
    
    try {
      setSavingName(true);
      setSavedName(false);
      await api.put("/api/auth/me", { name });
      setSavedName(true);
      setTimeout(() => setSavedName(false), 3000);
      window.location.reload(); // Refresh to update context
    } catch (error) {
      console.error("Failed to update name", error);
      alert("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side image type validation
    if (!file.type.startsWith("image/")) {
      alert("Please upload only image files.");
      return;
    }

    // Client-side 5MB size validation
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploadingAvatar(true);
      await api.put("/api/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      window.location.reload(); // Refresh to show new avatar
    } catch (error) {
      console.error("Failed to upload avatar", error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="h-8 w-8 text-blue-400" />
            Profile Settings
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your account details and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center shadow-lg backdrop-blur-sm">
              <div className="relative group mx-auto w-32 h-32 mb-4">
                <Avatar className="w-full h-full border-4 border-gray-700 shadow-xl">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      className="aspect-square h-full w-full object-cover" 
                      alt="Avatar" 
                    />
                  ) : (
                    <AvatarFallback className="bg-blue-600 text-white text-3xl">
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <label 
                  htmlFor="profile-avatar-upload" 
                  className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <>
                      <User className="h-8 w-8 text-white mb-1" />
                      <span className="text-xs text-white font-medium">Change Image</span>
                    </>
                  )}
                </label>
                <input 
                  id="profile-avatar-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </div>
              <h2 className="text-xl font-semibold text-white truncate px-2">{user?.name}</h2>
              <p className="text-sm text-gray-400 truncate mt-1">{user?.email}</p>
              
              <div className="mt-8 pt-6 border-t border-gray-700">
                <Button 
                  onClick={logout}
                  variant="destructive" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg backdrop-blur-sm">
              <h3 className="text-lg font-medium text-white mb-4">Personal Information</h3>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Display Name</Label>
                  <div className="flex gap-3">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-500"
                    />
                    <Button 
                      type="submit" 
                      disabled={savingName || name === user?.name || !name.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                    >
                      {savingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : savedName ? (
                        <><Check className="h-4 w-4 mr-2" /> Saved</>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-900/80 border-gray-700 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your email address cannot be changed.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
