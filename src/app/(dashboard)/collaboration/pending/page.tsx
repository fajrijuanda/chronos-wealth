import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getActiveUserEmail } from "@/lib/active-user";
import { getUserConnectionDirectoryByEmail } from "@/actions/collaboration";
import { RespondFriendshipActions } from "../RespondFriendshipActions";

export const dynamic = "force-dynamic";

export default async function CollaborationPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );

  const { directory } = await getUserConnectionDirectoryByEmail(activeEmail);

  const pendingIncoming = directory.filter(
    (entry) => entry.relationship === "PENDING_IN" && entry.friendshipId,
  );
  const pendingOutgoing = directory.filter((entry) => entry.relationship === "PENDING_OUT");

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Requests</h1>
          <p className="text-muted-foreground">
            Review permintaan koneksi masuk dan pantau status request yang masih menunggu.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/collaboration/connections">Manage Connections</Link>
        </Button>
      </div>

      <section className="surface-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Incoming</h2>
          <Badge variant="outline">{pendingIncoming.length} requests</Badge>
        </div>

        <div className="space-y-3">
          {pendingIncoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada request masuk saat ini.</p>
          ) : (
            pendingIncoming.map((item) => (
              <div
                key={item.user.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{item.user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{item.user.email}</p>
                </div>
                {item.friendshipId ? (
                  <RespondFriendshipActions
                    friendshipId={item.friendshipId}
                    friendName={item.user.displayName}
                  />
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="surface-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Outgoing</h2>
          <Badge variant="outline">{pendingOutgoing.length} requests</Badge>
        </div>

        <div className="space-y-3">
          {pendingOutgoing.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada request keluar saat ini.</p>
          ) : (
            pendingOutgoing.map((item) => (
              <div
                key={item.user.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/40 p-4"
              >
                <div>
                  <p className="font-semibold">{item.user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{item.user.email}</p>
                </div>
                <Badge variant="outline">Waiting response</Badge>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
