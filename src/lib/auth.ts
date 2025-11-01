import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export type UserRole = "ADMIN" | "TECH" | "STANDARD";

export interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
}

const COOKIE_NAME = "auth-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function setSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const expires = new Date();
  expires.setTime(expires.getTime() + SESSION_DURATION * 1000);
  
  cookieStore.set(COOKIE_NAME, JSON.stringify(user), {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  
  if (!session?.value) return null;
  
  try {
    return JSON.parse(session.value) as SessionUser;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    STANDARD: 1,
    TECH: 2,
    ADMIN: 3,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Check if user can access transactions (only ADMIN)
export function canAccessTransactions(role: UserRole): boolean {
  return role === "ADMIN";
}

// Check if user can access import/export (ADMIN and TECH)
export function canAccessImportExport(role: UserRole): boolean {
  return role === "ADMIN" || role === "TECH";
}

