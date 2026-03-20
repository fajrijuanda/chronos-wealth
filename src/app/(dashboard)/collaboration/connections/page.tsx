import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getActiveUserEmail } from "@/lib/active-user";
import {
  getUserConnectionDirectoryByEmail,
  respondFriendRequest,
  sendFriendRequestByEmail,
} from "@/actions/collaboration";

export const dynamic = "force-dynamic";

export default async function CollaborationConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );

  const { currentUser, directory } = await getUserConnectionDirectoryByEmail(activeEmail);

  const accepted = directory.filter((entry) => entry.relationship === "ACCEPTED");
  const pendingIn = directory.filter((entry) => entry.relationship === "PENDING_IN");
  const pendingOut = directory.filter((entry) => entry.relationship === "PENDING_OUT");

  async function connectUser(formData: FormData) {
    "use server";

    const requesterEmail = String(formData.get("requesterEmail") ?? "");
    const addresseeEmail = String(formData.get("addresseeEmail") ?? "");

    await sendFriendRequestByEmail({ requesterEmail, addresseeEmail });
    redirect("/collaboration/connections?ok=request-sent");
  }

  async function respondConnection(formData: FormData) {
    "use server";

    const friendshipId = String(formData.get("friendshipId") ?? "");
    const actionRaw = String(formData.get("action") ?? "reject");
    const action = actionRaw === "accept" ? "accept" : "reject";

    await respondFriendRequest(friendshipId, action);
    redirect(`/collaboration/connections?ok=${action}`);
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground">
            Kelola relasi partner untuk kolaborasi, proposal booth, dan simulasi bersama.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/collaboration/pending">Open Pending</Link>
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Connected</p>
          <p className="mt-1 text-2xl font-bold">{accepted.length}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Incoming</p>
          <p className="mt-1 text-2xl font-bold">{pendingIn.length}</p>
        </div>
        <div className="surface-card-soft p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Outgoing</p>
          <p className="mt-1 text-2xl font-bold">{pendingOut.length}</p>
        </div>
      </section>

      <section className="surface-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">User Directory</h2>
          <span className="text-xs text-muted-foreground">Send connection requests</span>
        </div>

        <div className="space-y-3">
          {directory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada user lain yang tersedia.</p>
          ) : (
            directory.map((entry) => (
              <div
                key={entry.user.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/profile/${encodeURIComponent(entry.user.email)}`}
                    className="font-semibold hover:underline"
                  >
                    {entry.user.displayName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {entry.relationship === "NONE" ? (
                    <form action={connectUser}>
                      <input type="hidden" name="requesterEmail" value={currentUser.email} />
                      <input type="hidden" name="addresseeEmail" value={entry.user.email} />
                      <Button type="submit" size="sm">Connect</Button>
                    </form>
                  ) : null}

                  {entry.relationship === "PENDING_OUT" ? (
                    <Badge variant="outline">Pending Approval</Badge>
                  ) : null}

                  {entry.relationship === "PENDING_IN" && entry.friendshipId ? (
                    <>
                      <form action={respondConnection}>
                        <input type="hidden" name="friendshipId" value={entry.friendshipId} />
                        <input type="hidden" name="action" value="accept" />
                        <Button type="submit" size="sm">Accept</Button>
                      </form>
                      <form action={respondConnection}>
                        <input type="hidden" name="friendshipId" value={entry.friendshipId} />
                        <input type="hidden" name="action" value="reject" />
                        <Button type="submit" size="sm" variant="outline">Reject</Button>
                      </form>
                    </>
                  ) : null}

                  {entry.relationship === "ACCEPTED" ? (
                    <Badge variant="outline">Connected</Badge>
                  ) : null}

                  {entry.relationship === "REJECTED" ? (
                    <Badge variant="outline">Rejected</Badge>
                  ) : null}

                  {entry.relationship === "BLOCKED" ? (
                    <Badge variant="outline">Blocked</Badge>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
