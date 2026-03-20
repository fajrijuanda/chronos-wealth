import Link from "next/link";
import {
  Users,
  Target,
  ArrowRight,
  Mail,
  ShieldCheck,
  User,
  Globe,
  Languages,
  BriefcaseBusiness,
  LayoutList,
  Clock3,
  Handshake,
  Wallet,
  ChartNoAxesCombined,
  FolderKanban,
} from "lucide-react";
import { getActiveUserEmail } from "@/lib/active-user";
import { getPublicProfileByEmail } from "@/actions/collaboration";
import { formatGroupedNumber } from "@/lib/number-format";
import { formatJakartaDateTime } from "@/lib/date-format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );

  const profile = await getPublicProfileByEmail({
    profileEmail: activeEmail,
    viewerEmail: activeEmail,
  });

  const tabRaw = typeof sp.tab === "string" ? sp.tab : "overview";
  const initialTab =
    tabRaw === "overview" ||
    tabRaw === "teams" ||
    tabRaw === "projects" ||
    tabRaw === "connections"
      ? tabRaw
      : "overview";

  const completionPct = profile.boothTarget.targetIncome > 0
    ? Math.min(100, (profile.boothTarget.monthlyIncomeShare / profile.boothTarget.targetIncome) * 100)
    : 0;

  const timeline = [
    ...profile.growthTargets.map((item) => ({
      id: `target-${item.id}`,
      date: item.createdAt,
      title: "Growth target dibuat",
      description: `${item.title} (${formatGroupedNumber(item.currentValue)} / ${formatGroupedNumber(item.targetValue)} ${item.unit})`,
      icon: Target,
      tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    })),
    ...profile.recentConnections.map((item) => ({
      id: `connection-${item.id}`,
      date: item.createdAt,
      title: `Status koneksi: ${item.status}`,
      description: `Terhubung dengan ${item.friend.displayName}`,
      icon: Handshake,
      tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    })),
    {
      id: "profile-updated",
      date: profile.profileUser.updatedAt,
      title: "Profil diperbarui",
      description: "Perubahan data akun dan preferensi profil.",
      icon: User,
      tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 pb-10">
      <section className="surface-card overflow-hidden p-0">
        <div className="relative h-40 bg-linear-to-r from-[#85a2ff]/50 via-[#8ed8f8]/40 to-[#9ce4bb]/45 dark:from-indigo-900/45 dark:via-cyan-900/35 dark:to-emerald-900/35">
          <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-white/25 blur-xl" />
          <div className="absolute left-[34%] top-10 h-16 w-16 rounded-2xl bg-white/20 blur-lg" />
        </div>

        <div className="px-6 pb-6">
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              {profile.profileUser.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profileUser.profilePhotoUrl}
                  alt={profile.profileUser.displayName}
                  className="-mt-12 h-24 w-24 rounded-3xl border-4 border-white object-cover shadow-lg dark:border-slate-900"
                />
              ) : (
                <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-linear-to-br from-[#5f86ff] to-[#76ccff] text-3xl font-bold text-white shadow-lg dark:border-slate-900">
                  {(profile.profileUser.displayName.trim().charAt(0) || "U").toUpperCase()}
                </div>
              )}

              <div className="rounded-2xl bg-background/85 px-3 py-2 backdrop-blur-sm sm:px-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{profile.profileUser.displayName}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <Mail className="h-4 w-4" /> {profile.profileUser.email}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Joined: {formatJakartaDateTime(profile.profileUser.createdAt)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-300">
                    <BriefcaseBusiness className="h-3 w-3" /> Financial Strategist
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:pt-1 xl:justify-end">
              <Link href="/profile/edit" className="go-chip">Edit Profile</Link>
              <Link href="/settings" className="go-chip">Account Settings</Link>
              <Link href="/targets" className="go-chip">Open Targets</Link>
            </div>
          </div>

          <p className="mt-5 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            {profile.profileUser.bio || "Belum ada bio. Tambahkan deskripsi singkat tentang fokus finansial, strategi investasi, dan milestone utama Anda dari halaman edit profile."}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Connections</p>
          <p className="mt-1 text-2xl font-bold">{profile.connectedCount}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio Booth</p>
          <p className="mt-1 text-2xl font-bold">{profile.portfolioCount}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Target Booth Eq.</p>
          <p className="mt-1 text-2xl font-bold">{profile.boothTarget.targetBoothEquivalent}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Target Income</p>
          <p className="mt-1 text-lg font-bold">Rp {formatGroupedNumber(profile.boothTarget.targetIncome)}</p>
        </div>
      </section>

      <Tabs defaultValue={initialTab} className="space-y-5">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Profile</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-4">
              <article className="surface-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><User className="h-5 w-5 text-indigo-500" /> About</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2"><span className="text-muted-foreground">Full Name</span><span className="font-semibold">{profile.profileUser.displayName}</span></div>
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2"><span className="text-muted-foreground">Status</span><span className="font-semibold">Active</span></div>
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2"><span className="text-muted-foreground">Role</span><span className="font-semibold">Investor</span></div>
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2"><span className="inline-flex items-center gap-1 text-muted-foreground"><Globe className="h-4 w-4" /> Country</span><span className="font-semibold">Indonesia</span></div>
                  <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-muted-foreground"><Languages className="h-4 w-4" /> Language</span><span className="font-semibold">Bahasa Indonesia</span></div>
                </div>
              </article>
            </div>

            <div className="space-y-6 xl:col-span-8">
              <article className="surface-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ChartNoAxesCombined className="h-5 w-5 text-sky-500" /> Overview Progress</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-card/50 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Income Share</p><p className="mt-1 text-xl font-bold">Rp {formatGroupedNumber(profile.boothTarget.monthlyIncomeShare)}</p></div>
                  <div className="rounded-2xl border border-border/70 bg-card/50 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Booth Equivalent Achieved</p><p className="mt-1 text-xl font-bold">{profile.boothTarget.boothEquivalentAchieved.toFixed(2)}</p></div>
                </div>
                <div className="mt-4 rounded-2xl border border-border/70 bg-card/50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm"><p className="font-semibold">Target completion</p><p className="font-bold text-muted-foreground">{completionPct.toFixed(1)}%</p></div>
                  <progress value={completionPct} max={100} className="mb-2 h-2.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:to-sky-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-indigo-500 [&::-moz-progress-bar]:to-sky-500" />
                  <p className="text-xs text-muted-foreground">Target income Rp {formatGroupedNumber(profile.boothTarget.targetIncome)} dari target {profile.boothTarget.targetBoothEquivalent} booth equivalent.</p>
                </div>
              </article>

              <article className="surface-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Clock3 className="h-5 w-5 text-amber-500" /> Activity Timeline</h2>
                <div className="space-y-4">
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada aktivitas yang tercatat.</p>
                  ) : (
                    timeline.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/50 px-3 py-3">
                          <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${item.tone}`}><Icon className="h-4 w-4" /></span>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{item.title}</p><p className="text-[11px] font-semibold text-muted-foreground">{formatJakartaDateTime(item.date)}</p></div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <article className="surface-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><LayoutList className="h-5 w-5 text-violet-500" /> Teams & Focus</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-card/50 px-3 py-2"><p className="font-semibold">Booth Growth Squad</p><p className="text-xs text-muted-foreground">{profile.portfolioCount} asset aktif • fokus ekspansi booth</p></div>
              <div className="rounded-xl border border-border/70 bg-card/50 px-3 py-2"><p className="font-semibold">Capital Optimization</p><p className="text-xs text-muted-foreground">{profile.growthTargets.length} growth goals aktif</p></div>
              <div className="rounded-xl border border-border/70 bg-card/50 px-3 py-2"><p className="font-semibold">Collaborative Network</p><p className="text-xs text-muted-foreground">{profile.connectedCount} partner terkoneksi</p></div>
              <div className="rounded-xl border border-border/70 bg-card/50 px-3 py-2"><p className="font-semibold">Income Expansion Lab</p><p className="text-xs text-muted-foreground">Target progress {completionPct.toFixed(1)}% dari roadmap finansial</p></div>
            </div>
          </article>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <article className="surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><FolderKanban className="h-5 w-5 text-indigo-500" /> Project List (Portfolio Booth)</h2>
              <Link href="/assets" className="text-xs font-semibold text-primary hover:underline">Open assets</Link>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr><th className="px-3 py-2">Project</th><th className="px-3 py-2">Plan</th><th className="px-3 py-2">Capital</th><th className="px-3 py-2">Share</th><th className="px-3 py-2">Projected Income</th></tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {profile.portfolio.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">Belum ada booth pada portfolio.</td></tr>
                  ) : (
                    profile.portfolio.slice(0, 8).map((item) => (
                      <tr key={item.ownershipId} className="bg-card/50"><td className="px-3 py-2.5 font-semibold">{item.boothName}</td><td className="px-3 py-2.5">{item.packageType}</td><td className="px-3 py-2.5">Rp {formatGroupedNumber(item.capitalAmount)}</td><td className="px-3 py-2.5">{item.revenueSharePct.toFixed(1)}%</td><td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400">Rp {formatGroupedNumber(item.expectedMonthlyIncome)}</td></tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profile.growthTargets.slice(0, 3).map((item) => {
                const pct = item.targetValue > 0 ? Math.min(100, (item.currentValue / item.targetValue) * 100) : 0;
                return (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-card/50 p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatGroupedNumber(item.currentValue)} / {formatGroupedNumber(item.targetValue)} {item.unit}</p>
                    <progress value={pct} max={100} className="mt-2 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:to-sky-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-indigo-500 [&::-moz-progress-bar]:to-sky-500" />
                  </div>
                );
              })}
            </div>
          </article>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <article className="surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-emerald-500" /> Connections</h2>
              <Link href="/profile?tab=connections" className="text-xs font-semibold text-primary hover:underline">Manage</Link>
            </div>
            <div className="space-y-3">
              {profile.recentConnections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada koneksi.</p>
              ) : (
                profile.recentConnections.map((item) => (
                  <Link key={item.id} href={`/profile/${encodeURIComponent(item.friend.email)}`} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/50 px-3 py-2.5 transition-colors hover:bg-card">
                    <div>
                      <p className="text-sm font-semibold">{item.friend.displayName}</p>
                      <p className="text-xs text-muted-foreground">{item.friend.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Profile <ArrowRight className="h-3.5 w-3.5" /></span>
                  </Link>
                ))
              )}
            </div>
          </article>
        </TabsContent>
      </Tabs>

      <section className="surface-card-soft flex flex-wrap items-center gap-3 p-4 text-sm text-muted-foreground">
        <Wallet className="h-5 w-5" /> Profil ini menampilkan performa asset, goals, dan koneksi kolaborasi Anda secara menyeluruh agar monitoring finansial lebih terstruktur.
      </section>
    </div>
  );
}
