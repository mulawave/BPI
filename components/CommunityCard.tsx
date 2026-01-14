"use client";

import React from "react";
import { Card } from "./ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/styles/utils";

export type CardState = "locked" | "in-progress" | "active" | "new";

interface CommunityCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  state: CardState;
  progress?: number; // 0-100 for in-progress state
  badge?: string; // e.g., "NEW", "3 Updates", "Ready to Harvest"
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function CommunityCard({
  title,
  description,
  icon: Icon,
  state,
  progress,
  badge,
  onClick,
  className,
  children,
}: CommunityCardProps) {
  const stateStyles = {
    locked: {
      card: "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 opacity-75",
      icon: "text-gray-400 dark:text-gray-600",
      title: "text-gray-600 dark:text-gray-400",
      description: "text-gray-500 dark:text-gray-500",
    },
    "in-progress": {
      card: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700",
      icon: "text-yellow-600 dark:text-yellow-400",
      title: "text-yellow-900 dark:text-yellow-100",
      description: "text-yellow-700 dark:text-yellow-300",
    },
    active: {
      card: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-700 hover:shadow-lg hover:scale-[1.02]",
      icon: "text-green-600 dark:text-green-400",
      title: "text-green-900 dark:text-green-100",
      description: "text-green-700 dark:text-green-300",
    },
    new: {
      card: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-300 dark:border-blue-700 hover:shadow-lg hover:scale-[1.02] animate-pulse",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-900 dark:text-blue-100",
      description: "text-blue-700 dark:text-blue-300",
    },
  };

  const currentStyles = stateStyles[state];
  const isInteractive = state === "active" || state === "new" || state === "in-progress";

  return (
    <Card
      className={cn(
        "relative p-6 transition-all duration-200 cursor-pointer",
        currentStyles.card,
        isInteractive && "hover:shadow-lg hover:scale-[1.02]",
        state === "locked" && "cursor-not-allowed",
        className
      )}
      onClick={state !== "locked" ? onClick : undefined}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-3 right-3">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            state === "new" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            state === "in-progress" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            state === "active" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            state === "locked" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          )}>
            {badge}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full mb-4",
        state === "locked" && "bg-gray-200 dark:bg-gray-800",
        state === "in-progress" && "bg-yellow-100 dark:bg-yellow-900/50",
        state === "active" && "bg-green-100 dark:bg-green-900/50",
        state === "new" && "bg-blue-100 dark:bg-blue-900/50"
      )}>
        <Icon className={cn("h-6 w-6", currentStyles.icon)} />
      </div>

      {/* Lock overlay for locked state */}
      {state === "locked" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg
            className="h-8 w-8 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <h3 className={cn("text-lg font-semibold", currentStyles.title)}>
          {title}
        </h3>
        <p className={cn("text-sm", currentStyles.description)}>
          {description}
        </p>

        {/* Progress bar for in-progress state */}
        {state === "in-progress" && progress !== undefined && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                Progress
              </span>
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-yellow-200 dark:bg-yellow-900/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Custom children content */}
        {children && (
          <div className="pt-2">
            {children}
          </div>
        )}
      </div>

      {/* CTA indicator */}
      {isInteractive && (
        <div className="mt-4 flex items-center justify-between">
          <span className={cn(
            "text-sm font-medium",
            state === "active" && "text-green-700 dark:text-green-300",
            state === "new" && "text-blue-700 dark:text-blue-300",
            state === "in-progress" && "text-yellow-700 dark:text-yellow-300"
          )}>
            {state === "in-progress" && "Continue"}
            {state === "active" && "Access Now"}
            {state === "new" && "Explore"}
          </span>
          <svg
            className={cn(
              "h-5 w-5",
              state === "active" && "text-green-600 dark:text-green-400",
              state === "new" && "text-blue-600 dark:text-blue-400",
              state === "in-progress" && "text-yellow-600 dark:text-yellow-400"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}

      {/* Locked state message */}
      {state === "locked" && (
        <div className="mt-4">
          <button
            className="w-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View Requirements
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      )}
    </Card>
  );
}
