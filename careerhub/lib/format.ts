/** Formats an INR annual salary band, e.g. "₹8–12 LPA". */
export function salaryBand(min: number | null, max: number | null): string {
  const lpa = (n: number) => (n >= 100000 ? `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} LPA` : `₹${n.toLocaleString("en-IN")}`);
  if (min != null && max != null) return `₹${lpa(min).replace(" LPA", "")}–${lpa(max)}`;
  if (min != null) return `${lpa(min)}+`;
  if (max != null) return `Up to ${lpa(max)}`;
  return "Not disclosed";
}

export const STAGES = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"] as const;

export const STAGE_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export const CATEGORIES = ["Engineering", "Design", "Marketing", "Data", "Operations"] as const;
