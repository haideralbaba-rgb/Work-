"use server";

import { db } from "@/db";
import { dailyMissions, roadmapTasks, tasks } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { logActivity, notify } from "@/lib/metrics";
import { ensureTodayMission } from "@/lib/missions";
import { revalidatePath } from "next/cache";
import { todayKey } from "@/lib/utils";

async function ownTask(userId: string, taskId: string) {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function ensureMissionAction(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await ensureTodayMission(user.id);
  revalidatePath("/mission");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setTaskStatus(taskId: string, status: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!["pending", "in_progress", "paused", "done"].includes(status)) return { error: "حالة غير صالحة." };
  const task = await ownTask(user.id, taskId);
  if (!task) return { error: "المهمة غير موجودة." };
  await db
    .update(tasks)
    .set({ status, completedAt: status === "done" ? new Date() : null })
    .where(eq(tasks.id, taskId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function completeTask(
  taskId: string,
  resultNote: string
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const task = await ownTask(user.id, taskId);
  if (!task) return { error: "المهمة غير موجودة." };

  await db
    .update(tasks)
    .set({ status: "done", completedAt: new Date(), resultNote: resultNote.trim() })
    .where(eq(tasks.id, taskId));

  if (task.roadmapTaskId) {
    await db
      .update(roadmapTasks)
      .set({ status: "done", completedAt: new Date(), evidence: resultNote.trim() })
      .where(eq(roadmapTasks.id, task.roadmapTaskId));
  }

  await logActivity(user.id, "task", `أنجز مهمة: ${task.title}`);

  // mission completion check
  if (task.missionId) {
    const rest = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.missionId, task.missionId), ne(tasks.status, "done")));
    if (rest.length === 0) {
      await db.update(dailyMissions).set({ status: "completed" }).where(eq(dailyMissions.id, task.missionId));
      await notify(user.id, "mission", "اكتملت مهمة اليوم", "أنجزت كل مهام مهمة اليوم. سجّل النتيجة الفعلية.");
      await logActivity(user.id, "mission", "أكمل مهمة اليوم بالكامل");
    } else if (task.kind === "primary") {
      await db.update(dailyMissions).set({ status: "completed" }).where(eq(dailyMissions.id, task.missionId));
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addTaskNote(taskId: string, notes: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const task = await ownTask(user.id, taskId);
  if (!task) return { error: "المهمة غير موجودة." };
  await db.update(tasks).set({ notes: notes.trim() }).where(eq(tasks.id, taskId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const task = await ownTask(user.id, taskId);
  if (!task) return { error: "المهمة غير موجودة." };
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createManualTask(input: {
  title: string;
  estMinutes: number;
  dueDate: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!input.title.trim()) return { error: "عنوان المهمة مطلوب." };
  await db.insert(tasks).values({
    userId: user.id,
    title: input.title.trim(),
    estMinutes: Math.max(5, input.estMinutes || 30),
    dueDate: input.dueDate || todayKey(),
    kind: "supporting",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setRoadmapTaskStatus(
  rtId: string,
  status: string,
  evidence: string
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!["pending", "in_progress", "done"].includes(status)) return { error: "حالة غير صالحة." };
  const rows = await db
    .select()
    .from(roadmapTasks)
    .where(and(eq(roadmapTasks.id, rtId), eq(roadmapTasks.userId, user.id)))
    .limit(1);
  const rt = rows[0];
  if (!rt) return { error: "المهمة غير موجودة." };
  await db
    .update(roadmapTasks)
    .set({
      status,
      evidence: status === "done" ? evidence.trim() || rt.evidence : rt.evidence,
      completedAt: status === "done" ? new Date() : null,
    })
    .where(eq(roadmapTasks.id, rtId));
  if (status === "done") {
    await logActivity(user.id, "roadmap", `أنجز مهمة خارطة الطريق: ${rt.titleAr}`);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
