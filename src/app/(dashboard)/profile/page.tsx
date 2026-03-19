import {
  getUserConnectionDirectoryByEmail,
  respondFriendRequest,
  sendFriendRequestByEmail,
  updateUserProfileByEmail,
} from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { redirect } from "next/navigation";
import { UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";

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
  const tab = typeof sp.tab === "string" && sp.tab === "connect" ? "connect" : "account";

  const { currentUser, directory } = await getUserConnectionDirectoryByEmail(activeEmail);

  async function saveProfile(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "");
    const displayName = String(formData.get("displayName") ?? "");
    const profilePhotoUrl = String(formData.get("profilePhotoUrl") ?? "");
    const bio = String(formData.get("bio") ?? "");

    await updateUserProfileByEmail({
      email,
      displayName,
      profilePhotoUrl: profilePhotoUrl || null,
      bio: bio || null,
    });

    redirect("/profile?tab=account&ok=profile-saved");
  }

  async function connectUser(formData: FormData) {
    "use server";

    const requesterEmail = String(formData.get("requesterEmail") ?? "");
    const addresseeEmail = String(formData.get("addresseeEmail") ?? "");

    await sendFriendRequestByEmail({ requesterEmail, addresseeEmail });
    redirect("/profile?tab=connect&ok=request-sent");
  }

  async function respondConnection(formData: FormData) {
    "use server";

    const friendshipId = String(formData.get("friendshipId") ?? "");
    const actionRaw = String(formData.get("action") ?? "reject");
    const action = actionRaw === "accept" ? "accept" : "reject";

    await respondFriendRequest(friendshipId, action);
    redirect(`/profile?tab=connect&ok=${action === "accept" ? "accepted" : "rejected"}`);
  }

  const acceptedCount = directory.filter((entry) => entry.relationship === "ACCEPTED").length;
  const pendingInCount = directory.filter((entry) => entry.relationship === "PENDING_IN").length;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola info akun, foto profil, dan koneksi user untuk kebutuhan kolaborasi.
          </p>
        </div>
      </div>

      <div className="inline-flex rounded-2xl border border-slate-200 dark:border-slate-800 p-1 bg-white/70 dark:bg-slate-900/60">
        <a
          href="/profile?tab=account"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === "account"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Account
        </a>
        <a
          href="/profile?tab=connect"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === "connect"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Connect
        </a>
      </div>

      {tab === "account" ? (
        <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm max-w-3xl">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <UserRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-bold text-lg">Account Settings</h2>
          </div>

          <form action={saveProfile} className="space-y-4">
            <input type="hidden" name="email" value={currentUser.email} />

            <div className="space-y-2">
              <label htmlFor="profile-display-name" className="text-sm font-medium">Display Name</label>
              <input
                id="profile-display-name"
                name="displayName"
                defaultValue={currentUser.displayName}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-photo-url" className="text-sm font-medium">Photo URL (Opsional)</label>
              <input
                id="profile-photo-url"
                name="profilePhotoUrl"
                type="url"
                defaultValue={currentUser.profilePhotoUrl ?? ""}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-bio" className="text-sm font-medium">Bio (Opsional)</label>
              <textarea
                id="profile-bio"
                name="bio"
                rows={4}
                defaultValue={currentUser.bio ?? ""}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              />
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              Save Profile
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              size="sm"
              title="Connected"
              value={String(acceptedCount)}
              tone="collab"
            />
            <MetricCard
              size="sm"
              title="Pending to You"
              value={String(pendingInCount)}
              tone="goal"
            />
            <MetricCard
              size="sm"
              title="Your Email"
              value={currentUser.email}
              tone="projection"
            />
          </div>

          <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-bold text-lg">Connect Users</h2>
            </div>

            <div className="space-y-3">
              {directory.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada user lain yang bisa dihubungkan.</p>
              ) : (
                directory.map((entry) => (
                  <div key={entry.user.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{entry.user.displayName}</p>
                      <p className="text-xs text-slate-500">{entry.user.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.relationship === "NONE" ? (
                        <form action={connectUser}>
                          <input type="hidden" name="requesterEmail" value={currentUser.email} />
                          <input type="hidden" name="addresseeEmail" value={entry.user.email} />
                          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Connect</Button>
                        </form>
                      ) : null}

                      {entry.relationship === "PENDING_OUT" ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Approval</Badge>
                      ) : null}

                      {entry.relationship === "PENDING_IN" && entry.friendshipId ? (
                        <>
                          <form action={respondConnection}>
                            <input type="hidden" name="friendshipId" value={entry.friendshipId} />
                            <input type="hidden" name="action" value="accept" />
                            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Accept</Button>
                          </form>
                          <form action={respondConnection}>
                            <input type="hidden" name="friendshipId" value={entry.friendshipId} />
                            <input type="hidden" name="action" value="reject" />
                            <Button type="submit" size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">Reject</Button>
                          </form>
                        </>
                      ) : null}

                      {entry.relationship === "ACCEPTED" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
                      ) : null}

                      {entry.relationship === "REJECTED" ? (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Rejected</Badge>
                      ) : null}

                      {entry.relationship === "BLOCKED" ? (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Blocked</Badge>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
