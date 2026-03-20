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
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <section className="surface-card overflow-hidden p-0 relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/70 via-cyan-500/70 to-emerald-500/70"></div>
        <div className="relative h-32 bg-linear-to-135 from-indigo-500/20 via-cyan-500/15 to-emerald-500/20 dark:from-indigo-900/40 dark:via-cyan-900/30 dark:to-emerald-900/30">
          <div className="absolute -right-20 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/10 to-transparent blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-400/10 to-transparent blur-3xl" />
        </div>

        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Left: Avatar + Info */}
            <div className="flex gap-4 sm:items-center">
              {profile.profileUser.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profileUser.profilePhotoUrl}
                  alt={profile.profileUser.displayName}
                  className="-mt-16 h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-xl dark:border-slate-900"
                />
              ) : (
                <div className="-mt-16 flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-linear-to-br from-indigo-500 to-cyan-500 text-4xl font-bold text-white shadow-xl dark:border-slate-900">
                  {(profile.profileUser.displayName.trim().charAt(0) || "U").toUpperCase()}
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{profile.profileUser.displayName}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> Financial Strategist
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Link href="/profile/edit" className="go-chip">Edit Profile</Link>
              <Link href="/settings" className="go-chip">Account Settings</Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
            <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {profile.profileUser.email}</span>
            <span className="hidden before:content-['•'] before:mx-2 sm:inline" />
            <span>Joined {formatJakartaDateTime(profile.profileUser.createdAt)}</span>
          </div>

          {/* Bio Section */}
          {profile.profileUser.bio && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {profile.profileUser.bio}
            </p>
          )}
        </div>
      </section>

      {/* Key Metrics - 4 Items 1 Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface-card group relative overflow-hidden p-5 transition-all hover:shadow-lg">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl transition-all group-hover:scale-125" />
          <div className="relative">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Active Connections</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{profile.connectedCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Partner terkoneksi</p>
          </div>
        </div>

        <div className="surface-card group relative overflow-hidden p-5 transition-all hover:shadow-lg">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-2xl transition-all group-hover:scale-125" />
          <div className="relative">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Portfolio Booth</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{profile.portfolioCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Asset aktif</p>
          </div>
        </div>

        <div className="surface-card group relative overflow-hidden p-5 transition-all hover:shadow-lg">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl transition-all group-hover:scale-125" />
          <div className="relative">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Booth Equivalent</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{profile.boothTarget.targetBoothEquivalent}</p>
            <p className="mt-1 text-xs text-muted-foreground">Target</p>
          </div>
        </div>

        <div className="surface-card group relative overflow-hidden p-5 transition-all hover:shadow-lg">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-2xl transition-all group-hover:scale-125" />
          <div className="relative">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Target Monthly Income</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Rp {formatGroupedNumber(profile.boothTarget.targetIncome)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Income goal</p>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border/40">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams & Focus</TabsTrigger>
          <TabsTrigger value="projects">Portfolio</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - About */}
            <div className="lg:col-span-1">
              <article className="surface-card p-5 h-full">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5 text-indigo-500" /> About
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="font-semibold text-right">{profile.profileUser.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold text-right text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Role</span>
                    <span className="font-semibold text-right">Investor</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Globe className="h-4 w-4" /> Country</span>
                    <span className="font-semibold text-right">Indonesia</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Languages className="h-4 w-4" /> Language</span>
                    <span className="font-semibold text-right">Bahasa</span>
                  </div>
                </div>
              </article>
            </div>

            {/* Right Column - Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Card */}
              <article className="surface-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <ChartNoAxesCombined className="h-5 w-5 text-sky-500" /> Performance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-900/10 p-4 border border-indigo-200/50 dark:border-indigo-800/50">
                    <p className="text-xs uppercase tracking-wide font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Monthly Income Share</p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">Rp {formatGroupedNumber(profile.boothTarget.monthlyIncomeShare)}</p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-900/10 p-4 border border-cyan-200/50 dark:border-cyan-800/50">
                    <p className="text-xs uppercase tracking-wide font-semibold text-cyan-700 dark:text-cyan-300 mb-1">Achieved Equivalent</p>
                    <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{profile.boothTarget.boothEquivalentAchieved.toFixed(2)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Target Completion</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{completionPct.toFixed(1)}%</p>
                  </div>
                  <progress value={completionPct} max={100} className="mb-3 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:to-cyan-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-indigo-500 [&::-moz-progress-bar]:to-cyan-500" />
                  <p className="text-xs text-muted-foreground">Target income Rp {formatGroupedNumber(profile.boothTarget.targetIncome)} dari {profile.boothTarget.targetBoothEquivalent} booth equivalent</p>
                </div>
              </article>

              {/* Timeline */}
              <article className="surface-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Clock3 className="h-5 w-5 text-amber-500" /> Recent Activity
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No activity yet</p>
                  ) : (
                    timeline.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className="flex gap-3 rounded-xl border border-border/60 bg-card/50 p-3 hover:bg-card transition-colors">
                          <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${item.tone}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground/75">{formatJakartaDateTime(item.date)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>
            </div>
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <article className="surface-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <LayoutList className="h-5 w-5 text-violet-500" /> Teams & Focus Areas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-900/20 p-4 hover:shadow-md transition-shadow">
                <p className="font-semibold text-slate-900 dark:text-white">Booth Growth</p>
                <p className="text-xs text-muted-foreground mt-1">{profile.portfolioCount} active asset fokus ekspansi booth</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-cyan-50 to-transparent dark:from-cyan-900/20 p-4 hover:shadow-md transition-shadow">
                <p className="font-semibold text-slate-900 dark:text-white">Capital Optimization</p>
                <p className="text-xs text-muted-foreground mt-1">{profile.growthTargets.length} growth goals aktif</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/20 p-4 hover:shadow-md transition-shadow">
                <p className="font-semibold text-slate-900 dark:text-white">Network Kolaborasi</p>
                <p className="text-xs text-muted-foreground mt-1">{profile.connectedCount} partner terkoneksi</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/20 p-4 hover:shadow-md transition-shadow">
                <p className="font-semibold text-slate-900 dark:text-white">Income Expansion</p>
                <p className="text-xs text-muted-foreground mt-1">Progress {completionPct.toFixed(1)}% dari roadmap</p>
              </div>
            </div>
          </article>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="projects" className="space-y-6">
          <article className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <FolderKanban className="h-5 w-5 text-indigo-500" /> Portfolio Booth
              </h3>
              <Link href="/assets" className="text-xs font-semibold text-primary hover:underline transition-colors">View all →</Link>
            </div>

            {/* Portfolio Table */}
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Project</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold text-right">Capital</th>
                    <th className="px-4 py-3 font-semibold text-right">Share</th>
                    <th className="px-4 py-3 font-semibold text-right">Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {profile.portfolio.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No booth in portfolio yet
                      </td>
                    </tr>
                  ) : (
                    profile.portfolio.slice(0, 8).map((item) => (
                      <tr key={item.ownershipId} className="bg-card/50 hover:bg-card/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{item.boothName}</td>
                        <td className="px-4 py-3">{item.packageType}</td>
                        <td className="px-4 py-3 text-right">Rp {formatGroupedNumber(item.capitalAmount)}</td>
                        <td className="px-4 py-3 text-right">{item.revenueSharePct.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">Rp {formatGroupedNumber(item.expectedMonthlyIncome)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Growth Targets */}
            {profile.growthTargets.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.growthTargets.slice(0, 3).map((item) => {
                  const pct = item.targetValue > 0 ? Math.min(100, (item.currentValue / item.targetValue) * 100) : 0;
                  return (
                    <div key={item.id} className="rounded-xl border border-border/60 bg-card/50 p-4 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatGroupedNumber(item.currentValue)} / {formatGroupedNumber(item.targetValue)} {item.unit}</p>
                      <progress value={pct} max={100} className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:to-cyan-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-indigo-500 [&::-moz-progress-bar]:to-cyan-500" />
                      <p className="mt-2 text-[11px] text-muted-foreground/75">{pct.toFixed(0)}% complete</p>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <article className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5 text-emerald-500" /> Connections ({profile.connectedCount})
              </h3>
              <Link href="/collaboration/connections" className="text-xs font-semibold text-primary hover:underline transition-colors">Manage →</Link>
            </div>
            <div className="space-y-3">
              {profile.recentConnections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-8 text-center">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No connections yet</p>
                </div>
              ) : (
                profile.recentConnections.map((item) => (
                  <Link
                    key={item.id}
                    href={`/profile/${encodeURIComponent(item.friend.email)}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-all hover:bg-card hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.friend.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.friend.email}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary ml-3 flex-shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </article>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <section className="surface-card-soft flex items-start gap-3 p-4 text-sm text-muted-foreground rounded-xl border border-border/40">
        <Wallet className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p>Profil komprehensif Anda menampilkan performa asset, growth targets, dan jaringan kolaborasi untuk monitoring finansial yang terstruktur.</p>
      </section>
    </div>
  );
}
