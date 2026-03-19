import Link from "next/link";
import { Users, Box, Target, ArrowRight, Mail } from "lucide-react";
import { getActiveUserEmail } from "@/lib/active-user";
import { getPublicProfileByEmail } from "@/actions/collaboration";
import { formatGroupedNumber } from "@/lib/number-format";

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

  return (
    <div className="space-y-8 pb-10">
      <section className="surface-card overflow-hidden p-0">
        <div className="relative h-32 bg-linear-to-r from-sky-300/45 via-indigo-300/40 to-fuchsia-300/40 dark:from-sky-800/40 dark:via-indigo-800/35 dark:to-fuchsia-800/30" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {profile.profileUser.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profileUser.profilePhotoUrl}
                  alt={profile.profileUser.displayName}
                  className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg dark:border-slate-900"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-linear-to-br from-[#7981e0] to-[#9ca1f2] text-2xl font-bold text-white shadow-lg dark:border-slate-900">
                  {(profile.profileUser.displayName.trim().charAt(0) || "U").toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-3xl font-bold tracking-tight">{profile.profileUser.displayName}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {profile.profileUser.email}
                </p>
              </div>
            </div>

            <Link href="/profile/edit" className="go-chip">
              Edit My Profile
            </Link>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {profile.profileUser.bio || "Belum ada bio. Tambahkan deskripsi singkat tentang fokus finansial Anda dari halaman edit profile."}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Friends</p>
          <p className="mt-1 text-2xl font-bold">{profile.connectedCount}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio Booth</p>
          <p className="mt-1 text-2xl font-bold">{profile.portfolioCount}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Booth Target</p>
          <p className="mt-1 text-2xl font-bold">{profile.boothTarget.targetBoothEquivalent}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Target Income</p>
          <p className="mt-1 text-lg font-bold">Rp {formatGroupedNumber(profile.boothTarget.targetIncome)}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-indigo-500" /> Recent Connections</h2>
            <Link href="/settings?tab=connections" className="text-xs font-semibold text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {profile.recentConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada koneksi.</p>
            ) : (
              profile.recentConnections.map((item) => (
                <Link
                  key={item.id}
                  href={`/profile/${encodeURIComponent(item.friend.email)}`}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/50 px-4 py-3 transition-colors hover:bg-card"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.friend.displayName}</p>
                    <p className="text-xs text-muted-foreground">{item.friend.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-amber-500" /> Growth Targets</h2>
            <Link href="/targets" className="text-xs font-semibold text-primary hover:underline">Open Targets</Link>
          </div>
          <div className="space-y-3">
            {profile.growthTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada growth target tambahan. Tambahkan dari halaman targets.</p>
            ) : (
              profile.growthTargets.map((item) => {
                const pct = item.targetValue > 0 ? Math.min(100, (item.currentValue / item.targetValue) * 100) : 0;
                return (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs font-bold text-muted-foreground">{pct.toFixed(0)}%</p>
                    </div>
                    <progress
                      value={pct}
                      max={100}
                      className="mb-2 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:to-sky-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-indigo-500 [&::-moz-progress-bar]:to-sky-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatGroupedNumber(item.currentValue)} / {formatGroupedNumber(item.targetValue)} {item.unit}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Box className="h-5 w-5 text-emerald-500" /> Booth Portfolio Snapshot</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {profile.portfolio.slice(0, 6).map((item) => (
            <div key={item.ownershipId} className="surface-card-soft p-4">
              <p className="text-sm font-semibold">{item.boothName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Capital: Rp {formatGroupedNumber(item.capitalAmount)}</p>
              <p className="text-xs text-muted-foreground">Share: {item.revenueSharePct.toFixed(1)}%</p>
            </div>
          ))}
          {profile.portfolio.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada booth di portofolio.</p> : null}
        </div>
      </section>
    </div>
  );
}
