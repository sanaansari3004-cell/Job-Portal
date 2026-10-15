import { STAGE_LABEL } from "@/lib/format";

const STYLES: Record<string, string> = {
  APPLIED: "bg-paper-deep text-ink border-ink/30",
  SHORTLISTED: "bg-amber-100 text-amber-900 border-amber-300",
  INTERVIEW: "bg-blue-100 text-blue-900 border-blue-300",
  HIRED: "bg-green-100 text-green-900 border-green-400",
  REJECTED: "bg-oxblood/10 text-oxblood border-oxblood/30",
};

export default function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className={`inline-block border px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.14em] ${STYLES[stage] ?? STYLES.APPLIED}`}
    >
      {STAGE_LABEL[stage] ?? stage}
    </span>
  );
}
