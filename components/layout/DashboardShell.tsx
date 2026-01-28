"use client";

import { ReactNode } from "react";
import { Session } from "next-auth";
import DashboardContent from "../DashboardContent";

interface DashboardShellProps {
  session: Session;
  children: ReactNode;
}

/**
 * Shared dashboard shell that wraps arbitrary page content inside the
 * dashboard chrome (header, sidebar, footer, profile panel, etc.).
 */
export default function DashboardShell({ session, children }: DashboardShellProps) {
  return <DashboardContent session={session} customContent={children} />;
}
