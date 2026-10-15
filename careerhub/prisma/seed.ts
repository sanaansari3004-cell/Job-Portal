/**
 * CareerHub seed — fills the gazette with demo data.
 *
 * Run:  npx prisma db seed   (or: npm run db:seed)
 *
 * Creates:
 *  - 1 admin, 2 recruiters, 8 candidates (all password: password123)
 *  - 25 jobs across Engineering / Design / Marketing / Data / Operations
 *  - ~24 applications spread across every pipeline stage
 *  - a tiny generated PDF résumé for 5 candidates (via the storage adapter)
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { storage } from "../lib/storage";

const prisma = new PrismaClient();
const LAKH = 100000;

function tinyPdf(name: string): Buffer {
  // Minimal syntactically-valid PDF — good enough as a demo résumé file.
  const text = `BT /F1 18 Tf 72 720 Td (Resume - ${name}) Tj ET`;
  const pdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ${text.length}>>stream\n${text}\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

interface JobSeed {
  title: string; company: string; location: string; jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  category: string; experience: string; salaryMin: number | null; salaryMax: number | null;
  description: string; requirements: string;
}

const JOBS: JobSeed[] = [
  // ---- Engineering (7) ----
  { title: "Frontend Developer (React)", company: "Zephyr Fintech", location: "Bengaluru", jobType: "FULL_TIME", category: "Engineering", experience: "0-2 years", salaryMin: 8 * LAKH, salaryMax: 14 * LAKH, description: "Build customer-facing dashboards for our lending platform used by 2M+ borrowers. You'll own features end-to-end with a small product squad.", requirements: "React, TypeScript, Tailwind CSS. Familiarity with REST APIs and basic testing (Jest/Vitest)." },
  { title: "Backend Developer (Node.js)", company: "KiranaKart", location: "Mumbai", jobType: "FULL_TIME", category: "Engineering", experience: "2-5 years", salaryMin: 14 * LAKH, salaryMax: 22 * LAKH, description: "Design order-management services handling 50k orders/day across 400+ dark stores. High ownership, on-call rotation with the team.", requirements: "Node.js, Express/NestJS, PostgreSQL, Redis. Experience with message queues preferred." },
  { title: "DevOps Engineer", company: "CloudSetu", location: "Remote", jobType: "FULL_TIME", category: "Engineering", experience: "2-5 years", salaryMin: 16 * LAKH, salaryMax: 26 * LAKH, description: "Keep 120+ microservices healthy across AWS ap-south-1. You'll drive our migration to GitOps and cut deploy times.", requirements: "AWS, Docker, Kubernetes, Terraform, CI/CD (GitHub Actions). Scripting in Bash/Python." },
  { title: "Mobile Developer (Flutter)", company: "FitSathi", location: "Hyderabad", jobType: "FULL_TIME", category: "Engineering", experience: "0-2 years", salaryMin: 7 * LAKH, salaryMax: 12 * LAKH, description: "Ship features for a fitness app with 800k MAU. Work closely with designers on buttery 60fps animations.", requirements: "Flutter/Dart, state management (Riverpod/Bloc), publishing to Play Store." },
  { title: "QA Automation Intern", company: "Zephyr Fintech", location: "Bengaluru", jobType: "INTERNSHIP", category: "Engineering", experience: "Fresher", salaryMin: 25000 * 12, salaryMax: 30000 * 12, description: "6-month internship: write Playwright suites for our payments flow, learn CI from the DevOps desk. PPO possible.", requirements: "Basic JS/TS, curiosity about testing. Playwright/Selenium a plus." },
  { title: "Site Reliability Engineer (Contract)", company: "DataDhaaga", location: "Remote", jobType: "CONTRACT", category: "Engineering", experience: "5+ years", salaryMin: 28 * LAKH, salaryMax: 40 * LAKH, description: "12-month contract: harden our data platform's reliability (99.95% SLO), chaos drills, incident reviews.", requirements: "Kubernetes at scale, Prometheus/Grafana, incident management experience." },
  { title: "Full-Stack Developer (MERN)", company: "PadhaiPlus", location: "Delhi NCR", jobType: "FULL_TIME", category: "Engineering", experience: "0-2 years", salaryMin: 6 * LAKH, salaryMax: 10 * LAKH, description: "Build learning tools for 1M+ students preparing for competitive exams. Small team, big surface area.", requirements: "MongoDB, Express, React, Node. JWT auth and REST fundamentals." },
  // ---- Design (5) ----
  { title: "Product Designer (UI/UX)", company: "Zephyr Fintech", location: "Bengaluru", jobType: "FULL_TIME", category: "Design", experience: "2-5 years", salaryMin: 12 * LAKH, salaryMax: 20 * LAKH, description: "Own design for onboarding and KYC flows. You'll run research with real borrowers across Tier-2/3 India.", requirements: "Figma mastery, portfolio of shipped mobile work, basic prototyping." },
  { title: "Visual Designer", company: "Namma Foods", location: "Mumbai", jobType: "FULL_TIME", category: "Design", experience: "0-2 years", salaryMin: 6 * LAKH, salaryMax: 10 * LAKH, description: "Brand and packaging design for a D2C snacks startup. Thumbnails, OOH, the works.", requirements: "Illustrator, Photoshop, strong typography sense. Portfolio required." },
  { title: "Motion Designer (Part-time)", company: "ReelKaro", location: "Remote", jobType: "PART_TIME", category: "Design", experience: "2-5 years", salaryMin: 5 * LAKH, salaryMax: 9 * LAKH, description: "20 hrs/week: short-form ad creatives and product explainers for D2C brands.", requirements: "After Effects, Premiere. Fast turnaround, Hindi+English captions." },
  { title: "UX Researcher", company: "KiranaKart", location: "Bengaluru", jobType: "FULL_TIME", category: "Design", experience: "2-5 years", salaryMin: 14 * LAKH, salaryMax: 22 * LAKH, description: "Lead diary studies and usability tests with kirana store owners; turn findings into product bets.", requirements: "Mixed-methods research, stakeholder storytelling, Hindi fluency." },
  { title: "Design Intern", company: "FitSathi", location: "Hyderabad", jobType: "INTERNSHIP", category: "Design", experience: "Fresher", salaryMin: 20000 * 12, salaryMax: 25000 * 12, description: "3-month internship with the product design team. Real screens ship to the app.", requirements: "Figma basics, eagerness to learn. Students welcome." },
  // ---- Marketing (5) ----
  { title: "Performance Marketing Manager", company: "Namma Foods", location: "Mumbai", jobType: "FULL_TIME", category: "Marketing", experience: "2-5 years", salaryMin: 10 * LAKH, salaryMax: 18 * LAKH, description: "Own ₹2Cr/month Meta+Google spend. CAC is your heartbeat metric.", requirements: "Hands-on Meta/Google ads, attribution basics, strong Excel." },
  { title: "Content Strategist (Hindi)", company: "PadhaiPlus", location: "Delhi NCR", jobType: "FULL_TIME", category: "Marketing", experience: "0-2 years", salaryMin: 5 * LAKH, salaryMax: 9 * LAKH, description: "Write and plan Hindi-first content for exam aspirants: YouTube scripts, blogs, push notifications.", requirements: "Excellent Hindi writing, basic SEO, familiarity with edtech." },
  { title: "SEO Specialist", company: "DataDhaaga", location: "Remote", jobType: "FULL_TIME", category: "Marketing", experience: "2-5 years", salaryMin: 9 * LAKH, salaryMax: 15 * LAKH, description: "Grow organic from 40k to 200k sessions/month for our data blog and docs.", requirements: "Technical SEO, content briefs, Ahrefs/Semrush." },
  { title: "Social Media Manager", company: "ReelKaro", location: "Bengaluru", jobType: "FULL_TIME", category: "Marketing", experience: "0-2 years", salaryMin: 6 * LAKH, salaryMax: 11 * LAKH, description: "Run Instagram + YouTube Shorts for 10 D2C brands. Memes are a growth channel here.", requirements: "Native short-form instincts, basic editing, trend-spotting." },
  { title: "Email Marketing Intern", company: "KiranaKart", location: "Mumbai", jobType: "INTERNSHIP", category: "Marketing", experience: "Fresher", salaryMin: 18000 * 12, salaryMax: 22000 * 12, description: "Learn lifecycle marketing: write and QA 3 campaigns/week, analyse open rates.", requirements: "Good written English, basic HTML a plus." },
  // ---- Data (4) ----
  { title: "Data Analyst", company: "Zephyr Fintech", location: "Bengaluru", jobType: "FULL_TIME", category: "Data", experience: "0-2 years", salaryMin: 9 * LAKH, salaryMax: 15 * LAKH, description: "Answer business questions with SQL + dbt. You'll sit with the risk team on credit models.", requirements: "SQL (strong), Python/pandas, dbt or similar. Fintech interest." },
  { title: "Machine Learning Engineer", company: "DataDhaaga", location: "Remote", jobType: "FULL_TIME", category: "Data", experience: "2-5 years", salaryMin: 20 * LAKH, salaryMax: 34 * LAKH, description: "Productionise fraud-detection models: feature stores, drift monitoring, A/B rollouts.", requirements: "Python, scikit-learn/PyTorch, MLflow, cloud deployment." },
  { title: "Analytics Engineer", company: "KiranaKart", location: "Hyderabad", jobType: "FULL_TIME", category: "Data", experience: "2-5 years", salaryMin: 15 * LAKH, salaryMax: 24 * LAKH, description: "Build the semantic layer 60 analysts query daily. dbt + BigQuery.", requirements: "dbt, SQL modelling, BigQuery/Snowflake." },
  { title: "Data Science Intern", company: "FitSathi", location: "Remote", jobType: "INTERNSHIP", category: "Data", experience: "Fresher", salaryMin: 25000 * 12, salaryMax: 35000 * 12, description: "Churn modelling on workout data with the ML team. Mentored, real datasets.", requirements: "Python, pandas, basic ML coursework." },
  // ---- Operations (4) ----
  { title: "Operations Manager", company: "KiranaKart", location: "Pune", jobType: "FULL_TIME", category: "Operations", experience: "2-5 years", salaryMin: 10 * LAKH, salaryMax: 16 * LAKH, description: "Run last-mile operations for 30 dark stores in West Pune. P&L ownership.", requirements: "Ops/logistics experience, Hindi + Marathi a plus, Excel strong." },
  { title: "Customer Success Associate", company: "PadhaiPlus", location: "Delhi NCR", jobType: "FULL_TIME", category: "Operations", experience: "Fresher", salaryMin: 4 * LAKH, salaryMax: 6 * LAKH, description: "Help students and parents get the most from the app. Hindi + English required.", requirements: "Empathy, clear communication, comfort with CRM tools." },
  { title: "Supply Chain Analyst (Contract)", company: "Namma Foods", location: "Chennai", jobType: "CONTRACT", category: "Operations", experience: "2-5 years", salaryMin: 12 * LAKH, salaryMax: 18 * LAKH, description: "9-month contract: demand planning across 3 factories and 2000+ retail points.", requirements: "Demand planning, advanced Excel, ERP familiarity." },
  { title: "HR Generalist", company: "CloudSetu", location: "Remote", jobType: "FULL_TIME", category: "Operations", experience: "0-2 years", salaryMin: 6 * LAKH, salaryMax: 9 * LAKH, description: "Own onboarding and engagement for a 90-person remote team across India.", requirements: "People-first mindset, HR fundamentals, great writing." },
];

const CANDIDATES = [
  { name: "Aarav Sharma", email: "candidate@careerhub.local", headline: "Full-Stack Developer · React, Node, PostgreSQL", location: "Bengaluru", skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"], experience: "SDE Intern @ PadhaiPlus (6 mo): built admin dashboards, cut page load 40%.\nFreelance: 3 client sites in Next.js.", education: "BTech Computer Science, Quantum University, Roorkee (2027)\nCGPA 7.3/10" },
  { name: "Diya Patel", email: "diya.p@careerhub.local", headline: "Product Designer · Figma, Design Systems", location: "Mumbai", skills: ["Figma", "Design Systems", "Prototyping", "User Research"], experience: "Design Intern @ FitSathi (4 mo): redesigned onboarding, +18% completion.\nFreelance brand work for 2 D2C startups.", education: "BDes Communication Design, MIT Institute of Design (2026)" },
  { name: "Rohan Verma", email: "rohan.v@careerhub.local", headline: "Backend Engineer · Node.js, PostgreSQL, Redis", location: "Hyderabad", skills: ["Node.js", "PostgreSQL", "Redis", "Docker", "AWS"], experience: "Backend Intern @ KiranaKart (6 mo): order APIs, Redis caching.\nOpen-source: 40+ PRs to Express ecosystem.", education: "BTech CSE, IIIT Hyderabad (2026)" },
  { name: "Sneha Iyer", email: "sneha.i@careerhub.local", headline: "Data Analyst · SQL, Python, dbt", location: "Chennai", skills: ["SQL", "Python", "pandas", "dbt", "Tableau"], experience: "Analytics Intern @ Zephyr Fintech (5 mo): risk dashboards in Metabase.\nKaggle: top 8% in 2 tabular competitions.", education: "BSc Statistics, Loyola College (2026)" },
  { name: "Kabir Singh", email: "kabir.s@careerhub.local", headline: "Performance Marketer · Meta & Google Ads", location: "Delhi NCR", skills: ["Meta Ads", "Google Ads", "GA4", "Copywriting"], experience: "Growth Intern @ Namma Foods (6 mo): managed ₹15L/mo spend, CAC -22%.\nRan college fest marketing (50k reach).", education: "BBA Marketing, Delhi University (2026)" },
  { name: "Ananya Rao", email: "ananya.r@careerhub.local", headline: "ML Engineer · PyTorch, MLOps", location: "Remote", skills: ["Python", "PyTorch", "scikit-learn", "MLflow", "Docker"], experience: "ML Intern @ DataDhaaga (6 mo): fraud model v2, precision +6pts.\nPublished 1 workshop paper on drift detection.", education: "MTech AI, IIIT Bangalore (2027)" },
  { name: "Vikram Nair", email: "vikram.n@careerhub.local", headline: "DevOps Engineer · Kubernetes, Terraform", location: "Pune", skills: ["Kubernetes", "Terraform", "AWS", "GitHub Actions", "Prometheus"], experience: "DevOps Intern @ CloudSetu (6 mo): GitOps migration, deploy time -60%.\nCKA certified.", education: "BTech IT, Pune University (2026)" },
  { name: "Ishita Bose", email: "ishita.b@careerhub.local", headline: "Fresher · MERN stack, eager to learn", location: "Kolkata", skills: ["JavaScript", "React", "MongoDB", "Express"], experience: "Built 4 full-stack projects in college, including an AI meeting summarizer.\nHackathons: 2 finalist finishes.", education: "BTech CSE, Jadavpur University (2027)" },
];

const COVER_NOTES = [
  "Hi — I've been following {company}'s work and this role matches my recent projects closely. Would love to discuss.",
  "Dear hiring desk: 2 years building exactly this kind of product. My portfolio is linked in my profile. Thanks for considering!",
  "Excited about this opening — my internship work maps directly to the requirements. Happy to share code samples.",
  "Hello! I'm a quick learner with strong fundamentals in this stack and I'd love to contribute from day one.",
];

const RECRUITER_NOTES = [
  "Strong fundamentals; ask about the internship project in detail.",
  "Good culture fit. Portfolio shows real shipped work.",
  "Decent take-home; probe system design depth in round 2.",
];

async function main() {
  console.log("Seeding CareerHub…");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Clean slate
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Admin + recruiters
  const admin = await prisma.user.create({
    data: { name: "Gazette Admin", email: "admin@careerhub.local", passwordHash, role: Role.ADMIN },
  });
  const recruiter1 = await prisma.user.create({
    data: { name: "Meera Krishnan", email: "recruiter@careerhub.local", passwordHash, role: Role.RECRUITER },
  });
  const recruiter2 = await prisma.user.create({
    data: { name: "Arjun Malhotra", email: "recruiter2@careerhub.local", passwordHash, role: Role.RECRUITER },
  });
  console.log(`admin: ${admin.email}, recruiters: ${recruiter1.email}, ${recruiter2.email}`);

  // Candidates with profiles + demo résumés
  const candidates = [];
  for (let i = 0; i < CANDIDATES.length; i++) {
    const c = CANDIDATES[i];
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        passwordHash,
        role: Role.CANDIDATE,
        profile: {
          create: {
            headline: c.headline,
            location: c.location,
            skills: c.skills,
            experience: c.experience,
            education: c.education,
          },
        },
      },
      include: { profile: true },
    });
    // Résumé for the first 5 candidates, stored via the storage adapter (local disk by default)
    if (i < 5 && user.profile) {
      const pdf = tinyPdf(c.name);
      const stored = await storage.upload(pdf, { originalName: `${c.name.replace(/\s+/g, "_")}_Resume.pdf`, mimeType: "application/pdf" });
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: { resumeKey: stored.key, resumeName: stored.originalName },
      });
    }
    candidates.push(user);
  }
  console.log(`${candidates.length} candidates created`);

  // Jobs — alternate between the two recruiters
  const jobs = [];
  for (let i = 0; i < JOBS.length; i++) {
    const j = JOBS[i];
    const job = await prisma.job.create({
      data: {
        title: j.title,
        company: j.company,
        location: j.location,
        jobType: j.jobType as never,
        category: j.category,
        experience: j.experience,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        description: j.description,
        requirements: j.requirements,
        status: i === JOBS.length - 1 ? "CLOSED" : "OPEN",
        recruiterId: i % 2 === 0 ? recruiter1.id : recruiter2.id,
        createdAt: new Date(Date.now() - (JOBS.length - i) * 36 * 60 * 60 * 1000),
      },
    });
    jobs.push(job);
  }
  console.log(`${jobs.length} jobs created`);

  // Applications spread across pipeline stages
  const stages = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED", "APPLIED", "SHORTLISTED", "APPLIED"] as const;
  let appCount = 0;
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    // each candidate applies to 3 jobs: deterministic spread
    const targets = [jobs[(i * 3) % jobs.length], jobs[(i * 3 + 7) % jobs.length], jobs[(i * 3 + 13) % jobs.length]];
    for (let k = 0; k < targets.length; k++) {
      const stage = stages[(i + k) % stages.length];
      await prisma.application.create({
        data: {
          jobId: targets[k].id,
          candidateId: cand.id,
          coverNote: COVER_NOTES[(i + k) % COVER_NOTES.length].replace("{company}", targets[k].company),
          stage: stage as never,
          notes: stage !== "APPLIED" ? RECRUITER_NOTES[(i + k) % RECRUITER_NOTES.length] : null,
          createdAt: new Date(Date.now() - (appCount + 1) * 20 * 60 * 60 * 1000),
        },
      });
      appCount++;
    }
  }
  console.log(`${appCount} applications created across all stages`);
  console.log("Done. Demo logins (password: password123): candidate@careerhub.local, recruiter@careerhub.local, admin@careerhub.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
