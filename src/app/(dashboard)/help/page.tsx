import Link from "next/link";
import { Button } from "@/components/ui/button";

const quickGuides = [
  {
    title: "Setup Profile",
    description:
      "Lengkapi display name, bio, dan foto profil agar partner collaboration mudah mengenali akun Anda.",
    href: "/profile/edit",
    cta: "Open Profile Edit",
  },
  {
    title: "Manage Connection",
    description:
      "Cari partner baru, kirim request, lalu review incoming request dari menu Collaboration.",
    href: "/collaboration/connections",
    cta: "Open Connections",
  },
  {
    title: "Review Pending",
    description:
      "Pantau request yang belum diproses dan terima/tolak agar workflow kolaborasi tetap rapi.",
    href: "/collaboration/pending",
    cta: "Open Pending",
  },
  {
    title: "Tune Settings",
    description:
      "Sesuaikan finance profile, target goals, dan session security dari halaman settings dropdown.",
    href: "/settings",
    cta: "Open Settings",
  },
  {
    title: "Run Simulation",
    description:
      "Gunakan data income, asset, dan target untuk memproyeksikan progress finansial bulanan.",
    href: "/simulation",
    cta: "Open Simulation",
  },
  {
    title: "Track Portfolio",
    description:
      "Kelola asset dan income untuk menjaga kualitas data dashboard dan hasil simulasi.",
    href: "/assets",
    cta: "Open Assets",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="text-muted-foreground">
          Panduan cepat penggunaan Chronos Wealth untuk aktivitas harian dan kolaborasi tim.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickGuides.map((guide) => (
          <article key={guide.title} className="surface-card p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{guide.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{guide.description}</p>
            </div>
            <Button asChild variant="outline" className="w-full rounded-2xl">
              <Link href={guide.href}>{guide.cta}</Link>
            </Button>
          </article>
        ))}
      </section>

      <section className="surface-card-soft p-4 text-sm text-muted-foreground">
        Jika Anda menemukan data tidak sinkron, refresh halaman terkait lalu ulangi aksi dari menu sidebar.
      </section>
    </div>
  );
}
