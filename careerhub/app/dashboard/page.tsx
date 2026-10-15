import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardIndex() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "RECRUITER") redirect("/dashboard/recruiter");
  redirect("/dashboard/candidate");
}
