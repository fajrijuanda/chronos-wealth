import Link from "next/link";

const quickLinks = [
  { href: "/assets", label: "Assets" },
  { href: "/income", label: "Income" },
  { href: "/simulation", label: "Simulation" },
];

export function DashboardHeroStrip() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/55 bg-linear-to-r from-[#7f87e8] via-[#8e96ef] to-[#7f87e8] p-5 text-white shadow-[0_30px_60px_-40px_rgba(65,72,146,0.95)] ring-1 ring-white/45 dark:border-white/15 dark:ring-white/10">
      <div className="pointer-events-none absolute -right-16 -top-12 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute left-[45%] top-6 h-20 w-48 rounded-3xl bg-white/22 blur-sm" />

      <div className="relative z-10 grid gap-5 md:grid-cols-[1fr_360px] md:items-center">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
            Chronos
            <br />
            Connect
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/85 md:text-base">
            Rangkai strategi aset, income, dan target dalam satu ruang finansial yang terhubung.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="go-chip">
                GO! {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden h-28 rounded-[1.6rem] border border-white/45 bg-white/24 shadow-inner backdrop-blur-sm md:block" />
      </div>
    </section>
  );
}
