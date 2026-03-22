import React, { useEffect } from "react";

interface AlertBadgeProps {
  type: "success" | "failed" | "warning";
  message: string;
  onClose: () => void;
  duration?: number;
}

const COLORS = {
  success: "bg-green-600 text-white",
  failed: "bg-red-600 text-white",
  warning: "bg-orange-500 text-white",
};

export const AlertBadge: React.FC<AlertBadgeProps> = ({ type, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`relative flex items-center px-6 py-4 rounded-xl shadow-lg min-w-[320px] max-w-xs ${COLORS[type]} animate-fade-in-up`}
      style={{ marginTop: 16, marginRight: 24 }}
    >
      <span className="flex-1 text-base font-medium pr-6">{message}</span>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full border border-white text-white hover:bg-white/10 transition"
        aria-label="Close alert"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L11 11M11 3L3 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};
