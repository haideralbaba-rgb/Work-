"use server";

import { db } from "@/db";
import { contentProjects, scripts, type Script } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { generateScript, type GeneratedScript, type ScriptParams } from "@/lib/ai";
import { getSnapshot, logActivity } from "@/lib/metrics";
import { todayKey } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function generateScriptAction(
  params: ScriptParams
): Promise<{ ok?: boolean; error?: string; script?: GeneratedScript }> {
  const user = await requireUser();
  if (!params.topic.trim() && params.type !== "journey") {
    // topic optional for journey; required otherwise for relevance
  }
  const snap = await getSnapshot(user.id);
  const script = await generateScript(params, snap);
  await logActivity(user.id, "script", `ولّد سكربتًا: ${script.title || params.topic}`, { type: params.type, mode: params.mode });
  return { ok: true, script };
}

export type ScriptInput = {
  id?: string;
  title: string;
  type: string;
  mode: string;
  language: string;
  topic: string;
  hook: string;
  story: string;
  conflict: string;
  insight: string;
  visualDirection: string;
  shotList: string[];
  voiceover: string;
  ending: string;
  caption: string;
  cta: string;
  commercial: Script["commercial"];
  status: string;
};

export async function saveScript(input: ScriptInput): Promise<{ ok?: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  if (!input.title.trim()) return { error: "عنوان السكربت مطلوب." };
  const payload = {
    title: input.title.trim(),
    type: input.type,
    mode: input.mode,
    language: input.language,
    topic: input.topic,
    hook: input.hook,
    story: input.story,
    conflict: input.conflict,
    insight: input.insight,
    visualDirection: input.visualDirection,
    shotList: input.shotList.filter(Boolean),
    voiceover: input.voiceover,
    ending: input.ending,
    caption: input.caption,
    cta: input.cta,
    commercial: input.commercial ?? {},
    status: ["draft", "saved", "published"].includes(input.status) ? input.status : "draft",
    updatedAt: new Date(),
  };
  if (input.id) {
    await db.update(scripts).set(payload).where(and(eq(scripts.id, input.id), eq(scripts.userId, user.id)));
    revalidatePath("/", "layout");
    return { ok: true, id: input.id };
  }
  const [row] = await db.insert(scripts).values({ userId: user.id, ...payload }).returning();
  await logActivity(user.id, "script", `حفظ سكربتًا: ${payload.title}`);
  revalidatePath("/", "layout");
  return { ok: true, id: row.id };
}

export async function duplicateScript(id: string): Promise<{ ok?: boolean; error?: string; id?: string }> {
  const user = await requireUser();
  const rows = await db.select().from(scripts).where(and(eq(scripts.id, id), eq(scripts.userId, user.id))).limit(1);
  const s = rows[0];
  if (!s) return { error: "السكربت غير موجود." };
  const { id: _id, createdAt: _c, updatedAt: _u, userId: _usr, ...rest } = s;
  const [row] = await db
    .insert(scripts)
    .values({ ...rest, userId: user.id, title: `${s.title} — نسخة`, status: "draft" })
    .returning();
  revalidatePath("/", "layout");
  return { ok: true, id: row.id };
}

export async function deleteScript(id: string): Promise<{ ok?: boolean }> {
  const user = await requireUser();
  await db.delete(scripts).where(and(eq(scripts.id, id), eq(scripts.userId, user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function publishScript(id: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const rows = await db.select().from(scripts).where(and(eq(scripts.id, id), eq(scripts.userId, user.id))).limit(1);
  const s = rows[0];
  if (!s) return { error: "السكربت غير موجود." };
  await db.update(scripts).set({ status: "published", updatedAt: new Date() }).where(eq(scripts.id, id));
  const platform = s.type === "tiktok" ? "tiktok" : s.type === "short" ? "youtube" : "instagram";
  await db.insert(contentProjects).values({
    userId: user.id,
    title: s.title,
    scriptId: s.id,
    platform,
    status: "published",
    publishedAt: todayKey(),
  });
  await logActivity(user.id, "content", `نشر محتوى: ${s.title}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function listScripts(userId: string) {
  return db.select().from(scripts).where(eq(scripts.userId, userId)).orderBy(desc(scripts.updatedAt));
}
