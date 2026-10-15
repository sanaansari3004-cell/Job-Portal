import { prisma } from "@/lib/db";
import { requireUser, json, error } from "@/lib/api";
import { storage, isPdf, RESUME_MAX_BYTES, STORAGE_DRIVER_NAME } from "@/lib/storage";
import { NextResponse } from "next/server";

/** POST multipart/form-data with a "resume" file field (PDF only, ≤ 5 MB). */
export async function POST(req: Request) {
  const user = await requireUser(["CANDIDATE"]);
  if (user instanceof NextResponse) return user;

  const form = await req.formData().catch(() => null);
  const file = form?.get("resume");
  if (!file || !(file instanceof File)) return error("No resume file attached", 400);
  if (file.size > RESUME_MAX_BYTES) return error("Resume must be 5 MB or smaller", 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const looksPdf = isPdf(buffer) || file.type === "application/pdf";
  const nameOk = /\.pdf$/i.test(file.name);
  if (!looksPdf || !nameOk) return error("Only PDF files are accepted", 400);

  // Delete the previous resume so uploads/ doesn't accumulate orphan files.
  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing?.resumeKey) {
    await storage.delete(existing.resumeKey).catch(() => {});
  }

  const stored = await storage.upload(buffer, { originalName: file.name, mimeType: "application/pdf" });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, resumeKey: stored.key, resumeName: stored.originalName },
    update: { resumeKey: stored.key, resumeName: stored.originalName },
  });

  return json({
    resume: { key: stored.key, name: stored.originalName, size: stored.size, driver: STORAGE_DRIVER_NAME },
  });
}
