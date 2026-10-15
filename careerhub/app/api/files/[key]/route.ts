import { prisma } from "@/lib/db";
import { requireUser, error } from "@/lib/api";
import { storage } from "@/lib/storage";
import { NextResponse } from "next/server";

/**
 * Download a stored file (resumes). Allowed when:
 * - the file belongs to the signed-in candidate's own profile, or
 * - the signed-in user is a recruiter/admin for a job the file owner applied to, or
 * - the signed-in user is an admin.
 */
export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const key = decodeURIComponent(params.key);
  const owner = await prisma.profile.findFirst({ where: { resumeKey: key }, select: { userId: true, resumeName: true } });
  if (!owner) return error("File not found", 404);

  let allowed = owner.userId === user.id || user.role === "ADMIN";
  if (!allowed && user.role === "RECRUITER") {
    const applied = await prisma.application.findFirst({
      where: { candidateId: owner.userId, job: { recruiterId: user.id } },
      select: { id: true },
    });
    allowed = !!applied;
  }
  if (!allowed) return error("Forbidden", 403);

  const file = await storage.download(key);
  if (!file) return error("File not found", 404);

  const filename = owner.resumeName || file.originalName;
  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Content-Length": String(file.buffer.length),
    },
  });
}
