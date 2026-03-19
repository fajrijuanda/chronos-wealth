import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveUserEmail } from "@/lib/active-user";
import { updateUserProfileByEmail } from "@/actions/collaboration";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );

  const user = await prisma.appUser.findUnique({
    where: { email: activeEmail },
    select: {
      email: true,
      displayName: true,
      profilePhotoUrl: true,
      bio: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  async function saveProfile(formData: FormData) {
    "use server";

    await updateUserProfileByEmail({
      email: activeEmail,
      displayName: String(formData.get("displayName") ?? ""),
      profilePhotoUrl: String(formData.get("profilePhotoUrl") ?? "") || null,
      bio: String(formData.get("bio") ?? "") || null,
    });

    redirect("/profile?ok=saved");
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Edit Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola identitas publik yang dilihat user lain.</p>
        </div>

        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>
      </div>

      <section className="surface-card max-w-3xl p-6">
        <form action={saveProfile} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="profile-edit-display-name" className="text-sm font-medium">Display Name</label>
            <input
              id="profile-edit-display-name"
              name="displayName"
              type="text"
              required
              defaultValue={user.displayName}
              className="w-full rounded-2xl border border-input bg-white/70 px-4 py-2.5 dark:bg-slate-900/35"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-edit-photo-url" className="text-sm font-medium">Photo URL</label>
            <input
              id="profile-edit-photo-url"
              name="profilePhotoUrl"
              type="url"
              placeholder="https://..."
              defaultValue={user.profilePhotoUrl ?? ""}
              className="w-full rounded-2xl border border-input bg-white/70 px-4 py-2.5 dark:bg-slate-900/35"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-edit-bio" className="text-sm font-medium">Bio</label>
            <textarea
              id="profile-edit-bio"
              name="bio"
              rows={5}
              placeholder="Cerita singkat tentang fokus finansial Anda"
              defaultValue={user.bio ?? ""}
              className="w-full rounded-2xl border border-input bg-white/70 px-4 py-2.5 dark:bg-slate-900/35"
            />
          </div>

          <Button type="submit" className="inline-flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Profile
          </Button>
        </form>
      </section>
    </div>
  );
}
