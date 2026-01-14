"use client";
import { useState } from "react";
import { useInactivityLock } from "@/contexts/InactivityLockContext";
import { useSession } from "next-auth/react";
import { api } from "@/client/trpc";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Image from "next/image";

export default function LockScreen() {
  const { data: session, status } = useSession();
  const { isLocked, unlock } = useInactivityLock();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const verifyPasswordMutation = api.auth.verifyPassword.useMutation();

  // Only show for authenticated users
  if (status !== "authenticated" || !session) return null;
  if (!isLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsUnlocking(true);

    try {
      const result = await verifyPasswordMutation.mutateAsync({ password });

      if (result.success) {
        setPassword("");
        unlock();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setPassword("");
    } finally {
      setIsUnlocking(false);
    }
  };

  const user = session?.user as any;
  const firstName = user?.firstname || user?.name?.split(' ')[0] || "User";
  const lastName = user?.lastname || user?.name?.split(' ')[1] || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const avatarUrl = user?.image || user?.profilePic || "/img/default-avatar.svg";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-black/50" />

      {/* Lock Screen Card */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>

          {/* User Avatar */}
          <div className="relative w-24 h-24 mb-4">
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              className="rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/img/default-avatar.svg";
              }}
            />
          </div>

          {/* User Name */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {fullName}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">
            Screen locked due to inactivity
          </p>

          {/* Unlock Form */}
          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your password to unlock
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 text-center text-lg tracking-wider"
                autoFocus
                disabled={isUnlocking}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Unlock Button */}
            <Button
              type="submit"
              disabled={isUnlocking}
              className="w-full h-12 bg-gradient-to-r from-bpi-primary to-bpi-secondary hover:opacity-90 text-white font-semibold text-lg"
            >
              {isUnlocking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Unlock Screen
                </>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
            For your security, your session has been locked after 60 seconds of inactivity
          </p>
        </div>
      </div>
    </div>
  );
}
