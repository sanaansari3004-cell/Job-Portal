import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const COOKIE_NAME = "ch_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    secret(),
    { expiresIn: COOKIE_MAX_AGE }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, secret()) as SessionUser;
    return { id: payload.id, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(user: SessionUser) {
  const token = signToken(user);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

/** Fresh user record from DB (in case role/name changed since the cookie was issued). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true },
  });
}
