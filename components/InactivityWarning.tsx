"use client";
import { useInactivityLock } from "@/contexts/InactivityLockContext";
import { useSession } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

export default function InactivityWarning() {
  const { data: session, status } = useSession();
  const { showWarning, warningCountdown, dismissWarning } = useInactivityLock();

  // Only show for authenticated users
  if (status !== "authenticated" || !session) return null;
  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-green-800/50">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Still There?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Hey, we're just checking to make sure you're still actively using the platform.
          </p>

          {/* Countdown */}
          <div className="mb-6">
            <div className="text-6xl font-bold text-bpi-primary dark:text-bpi-secondary mb-2">
              {warningCountdown}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              seconds until screen locks
            </p>
          </div>

          {/* Button */}
          <Button
            onClick={dismissWarning}
            size="lg"
            className="w-full bg-gradient-to-r from-bpi-primary to-bpi-secondary hover:opacity-90 text-white font-semibold"
          >
            Yes, I'm Still Here!
          </Button>
        </div>
      </div>
    </div>
  );
}
