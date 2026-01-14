/**
 * Admin Authentication & Authorization Utilities
 * Provides role-based access control for admin operations
 */

import type { Session } from "next-auth";

export type UserRole = "user" | "admin" | "super_admin";

interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: AdminUser | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === "admin" || user.role === "super_admin";
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AdminUser | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === "super_admin";
}

/**
 * Require admin role - throws error if not admin
 * Use in tRPC procedures to protect admin endpoints
 */
export function requireAdmin(ctx: { session: Session | null }) {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED - Please log in");
  }

  const user = ctx.session.user as AdminUser;
  
  if (!isAdmin(user)) {
    throw new Error("FORBIDDEN - Admin access required");
  }

  return user;
}

/**
 * Require super admin role - throws error if not super admin
 * Use for highly sensitive operations (user deletion, system settings, etc.)
 */
export function requireSuperAdmin(ctx: { session: Session | null }) {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED - Please log in");
  }

  const user = ctx.session.user as AdminUser;
  
  if (!isSuperAdmin(user)) {
    throw new Error("FORBIDDEN - Super admin access required");
  }

  return user;
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): UserRole {
  if (!session?.user) return "user";
  
  const user = session.user as AdminUser;
  const role = user.role || "user";
  
  return role as UserRole;
}

/**
 * Check if current session has admin access
 */
export function hasAdminAccess(session: Session | null): boolean {
  const role = getUserRole(session);
  return role === "admin" || role === "super_admin";
}
