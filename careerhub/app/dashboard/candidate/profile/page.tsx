import ProfileEditor from "@/components/ProfileEditor";

export default function ProfilePage() {
  return (
    <div>
      <p className="kicker mb-2">Candidate desk</p>
      <h1 className="font-display text-4xl font-black tracking-tight">Profile &amp; résumé</h1>
      <p className="dateline mt-2">This is what recruiters read alongside your applications</p>
      <div className="mt-6">
        <ProfileEditor />
      </div>
    </div>
  );
}
