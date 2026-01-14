"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface InactivityLockContextType {
  isLocked: boolean;
  showWarning: boolean;
  warningCountdown: number;
  resetInactivity: () => void;
  unlock: () => void;
  dismissWarning: () => void;
}

const InactivityLockContext = createContext<InactivityLockContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30000; // 30 seconds
const WARNING_COUNTDOWN = 30; // 30 seconds countdown

export function InactivityLockProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isLocked, setIsLocked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(WARNING_COUNTDOWN);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    setInactivityTimer(null);
    setCountdownInterval(null);
  }, [inactivityTimer, countdownInterval]);

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true);
    setWarningCountdown(WARNING_COUNTDOWN);

    const interval = setInterval(() => {
      setWarningCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowWarning(false);
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownInterval(interval);
  }, []);

  const resetInactivity = useCallback(() => {
    // Don't reset if locked or user not authenticated
    if (isLocked || status !== "authenticated") return;

    clearTimers();

    // Start new inactivity timer
    const timer = setTimeout(() => {
      startWarningCountdown();
    }, INACTIVITY_TIMEOUT);

    setInactivityTimer(timer);
  }, [isLocked, status, clearTimers, startWarningCountdown]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    setWarningCountdown(WARNING_COUNTDOWN);
    clearTimers();
    resetInactivity();
  }, [clearTimers, resetInactivity]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    setShowWarning(false);
    setWarningCountdown(WARNING_COUNTDOWN);
    clearTimers();
    resetInactivity();
  }, [clearTimers, resetInactivity]);

  useEffect(() => {
    // Only initialize lock system for authenticated users
    if (status !== "authenticated") {
      clearTimers();
      setIsLocked(false);
      setShowWarning(false);
      return;
    }

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (!showWarning && !isLocked) {
        resetInactivity();
      }
    };

    // Add listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetInactivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [status, showWarning, isLocked, resetInactivity, clearTimers]);

  return (
    <InactivityLockContext.Provider
      value={{
        isLocked,
        showWarning,
        warningCountdown,
        resetInactivity,
        unlock,
        dismissWarning,
      }}
    >
      {children}
    </InactivityLockContext.Provider>
  );
}

export function useInactivityLock() {
  const context = useContext(InactivityLockContext);
  if (!context) {
    throw new Error("useInactivityLock must be used within InactivityLockProvider");
  }
  return context;
}
