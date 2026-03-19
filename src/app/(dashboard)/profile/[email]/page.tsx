import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Box, Target, Users, UserRound } from "lucide-react";
import { getActiveUserEmail } from "@/lib/active-user";
import { getPublicProfileByEmail } from "@/actions/collaboration";
import { formatGroupedNumber } from "@/lib/number-format";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { email: encodedEmail } = await params;
  const sp = await searchParams;

  const viewerEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );

  const profileEmail = decodeURIComponent(encodedEmail);

  let profile: Awaited<ReturnType<typeof getPublicProfileByEmail>>;
  try {
    profile = await getPublicProfileByEmail({
      profileEmail,
      viewerEmail,
    });
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between gap-3">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to My Profile
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Relationship: {profile.relationship}
        </span>
      </div>

      <section className="surface-card overflow-hidden p-0">
        <div className="relative h-28 bg-linear-to-r from-indigo-300/45 via-sky-300/35 to-emerald-300/35 dark:from-indigo-900/35 dark:via-sky-900/25 dark:to-emerald-900/25" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
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
              <p className="text-sm text-muted-foreground">{profile.profileUser.email}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {profile.profileUser.bio || "Pengguna ini belum menambahkan bio."}
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
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-indigo-500" /> Recent Connections</h2>
          <div className="space-y-3">
            {profile.recentConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada koneksi yang ditampilkan.</p>
            ) : (
              profile.recentConnections.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
                  <p className="text-sm font-semibold">{item.friend.displayName}</p>
                  <p className="text-xs text-muted-foreground">{item.friend.email}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-amber-500" /> Growth Targets</h2>
          <div className="space-y-3">
            {profile.growthTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada growth target yang dipublikasikan.</p>
            ) : (
              profile.growthTargets.map((item) => {
                const pct = item.targetValue > 0 ? Math.min(100, (item.currentValue / item.targetValue) * 100) : 0;
                return (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs font-bold text-muted-foreground">{pct.toFixed(0)}%</p>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-sky-500" style={{ width: `${pct}%` }} />
                    </div>
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
          {profile.portfolio.slice(0, 9).map((item) => (
            <div key={item.ownershipId} className="surface-card-soft p-4">
              <p className="text-sm font-semibold">{item.boothName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Capital: Rp {formatGroupedNumber(item.capitalAmount)}</p>
              <p className="text-xs text-muted-foreground">Share: {item.revenueSharePct.toFixed(1)}%</p>
            </div>
          ))}
          {profile.portfolio.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data booth untuk ditampilkan.</p>
          ) : null}
        </div>
      </section>

      {profile.relationship === "NONE" ? (
        <div className="surface-card-soft flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <UserRound className="h-5 w-5" />
          Anda belum terhubung dengan user ini. Kirim permintaan koneksi dari halaman settings.
        </div>
      ) : null}
    </div>
  );
}
