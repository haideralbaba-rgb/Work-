"use server";

import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type AuthResult = { ok?: boolean; error?: string; next?: string };

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) return { error: "أدخل البريد الإلكتروني وكلمة المرور." };
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return { error: "بيانات الدخول غير صحيحة." };
  }
  await createSession(user.id);
  const p = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  return { ok: true, next: p[0]?.onboardingCompleted ? "/dashboard" : "/onboarding" };
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name) return { error: "أدخل اسمك." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "بريد إلكتروني غير صالح." };
  if (input.password.length < 6) return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return { error: "هذا البريد مسجّل مسبقًا. سجّل الدخول بدلًا من ذلك." };
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: hashPassword(input.password) })
    .returning();
  await db.insert(profiles).values({ userId: user.id });
  await createSession(user.id);
  return { ok: true, next: "/onboarding" };
}

export async function signOut(): Promise<void> {
  await destroySession();
}
