"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Box,
  CircleDollarSign,
  Coins,
  Gauge,
  Landmark,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatGroupedNumber } from "@/lib/number-format";

type OverviewAnalyticsDeckProps = {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRatePct: number;
  targetBoothEquivalent: number;
  boothEquivalentAchieved: number;
  targetProgressPct: number;
  monthlyIncomeShare: number;
  portfolioCount: number;
  nonBoothAssetCount: number;
  activeIncomeCount: number;
  activeGrowthTargetCount: number;
  acceptedFriendCount: number;
  pendingFriendCount: number;
  unreadNotificationCount: number;
  notificationTotalCount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointsToPath(points: number[], width: number, height: number) {
  if (points.length === 0) return "";
  const maxPoint = Math.max(...points, 1);
  const minPoint = Math.min(...points, 0);
  const range = Math.max(maxPoint - minPoint, 1);

  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((value - minPoint) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildTrendSeries(income: number, expense: number, achieved: number, target: number) {
  const balanceBias = income - expense;
  const targetGap = Math.max(target - achieved, 0);

  const monthlyMomentum = [
    income * 0.62 - expense * 0.56,
    income * 0.68 - expense * 0.61,
    income * 0.71 - expense * 0.58,
    income * 0.77 - expense * 0.63,
    income * 0.84 - expense * 0.67,
    income * 0.8 - expense * 0.6,
  ].map((value) => Math.max(0, value + balanceBias * 0.06));

  const operationsLoad = [
    Math.max(expense * 0.8, 1),
    Math.max(expense * 0.72, 1),
    Math.max(expense * 0.9, 1),
    Math.max(expense * 0.78, 1),
    Math.max(expense * 0.86, 1),
    Math.max(expense * 0.81 + targetGap * 0.02, 1),
  ];

  const runway = [
    Math.max(achieved * 0.4 + 1, 1),
    Math.max(achieved * 0.55 + 1, 1),
    Math.max(achieved * 0.67 + 1, 1),
    Math.max(achieved * 0.74 + 1, 1),
    Math.max(achieved * 0.82 + 1, 1),
    Math.max(achieved * 0.9 + targetGap * 0.08 + 1, 1),
  ];

  return {
    monthlyMomentum,
    operationsLoad,
    runway,
  };
}

function CircularGauge({ value }: { value: number }) {
  const normalized = clamp(value, 0, 100);
  const radius = 58;
  const stroke = 14;
  const circumference = Math.PI * radius;
  const dash = (normalized / 100) * circumference;

  return (
    <svg viewBox="0 0 160 100" className="h-40 w-full">
      <defs>
        <linearGradient id="gauge-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="55%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path
        d="M 22 82 A 58 58 0 0 1 138 82"
        fill="none"
        stroke="rgba(148, 163, 184, 0.28)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M 22 82 A 58 58 0 0 1 138 82"
        fill="none"
        stroke="url(#gauge-fill)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
      />
      <text x="80" y="66" textAnchor="middle" className="fill-foreground text-2xl font-bold">
        {normalized.toFixed(0)}%
      </text>
      <text x="80" y="84" textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
        Target Completion
      </text>
    </svg>
  );
}

export function OverviewAnalyticsDeck(props: OverviewAnalyticsDeckProps) {
  const [slide, setSlide] = useState(0);

  const slides = useMemo(() => {
    const momentum = buildTrendSeries(
      props.monthlyIncome,
      props.monthlyExpense,
      props.boothEquivalentAchieved,
      props.targetBoothEquivalent,
    );

    return [
      {
        title: "Revenue Momentum",
        subtitle: "6-Point projection from current income-expense rhythm",
        points: momentum.monthlyMomentum,
        color: "from-cyan-400 via-sky-500 to-indigo-500",
      },
      {
        title: "Operations Load",
        subtitle: "Expense pressure including target pursuit overhead",
        points: momentum.operationsLoad,
        color: "from-amber-400 via-orange-500 to-rose-500",
      },
      {
        title: "Runway Traction",
        subtitle: "Booth equivalent acceleration toward target",
        points: momentum.runway,
        color: "from-emerald-400 via-teal-500 to-cyan-500",
      },
    ];
  }, [props.boothEquivalentAchieved, props.monthlyExpense, props.monthlyIncome, props.targetBoothEquivalent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[slide];
  const trendPath = pointsToPath(currentSlide.points, 320, 92);
  const safeExpense = props.monthlyExpense <= 0 ? 1 : props.monthlyExpense;
  const incomeVsExpensePct = clamp((props.monthlyIncome / safeExpense) * 100, 0, 200);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-12">
        <article className="relative overflow-hidden rounded-3xl border border-slate-300/30 bg-linear-to-br from-violet-500 via-indigo-500 to-fuchsia-500 p-6 text-white shadow-[0_28px_50px_-35px_rgba(109,40,217,0.8)] lg:col-span-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-violet-200/35 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm/none font-semibold tracking-wide text-white/90">Wealth Control Center</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Rp {formatGroupedNumber(props.balance)}</h2>
              <p className="mt-2 text-sm text-white/85">Saldo bersih dari seluruh transaksi pemasukan dan pengeluaran.</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-sm">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
              <p className="text-white/75">Monthly Income</p>
              <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(props.monthlyIncome)}</p>
            </div>
            <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
              <p className="text-white/75">Monthly Expense</p>
              <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(props.monthlyExpense)}</p>
            </div>
            <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
              <p className="text-white/75">Savings Rate</p>
              <p className="mt-1 text-lg font-semibold">{props.savingsRatePct.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
              <p className="text-white/75">Unread Notifications</p>
              <p className="mt-1 text-lg font-semibold">{props.unreadNotificationCount}</p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.45)] backdrop-blur-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Income vs Expense</h3>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Current monthly ratio</p>

          <p className="mt-6 text-4xl font-bold">{incomeVsExpensePct.toFixed(0)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">100% berarti income = expense</p>

          <progress
            value={clamp(incomeVsExpensePct, 0, 100)}
            max={100}
            className="mt-6 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-emerald-400 [&::-webkit-progress-value]:via-teal-500 [&::-webkit-progress-value]:to-cyan-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-emerald-400 [&::-moz-progress-bar]:via-teal-500 [&::-moz-progress-bar]:to-cyan-500"
          />

          <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
              + Rp {formatGroupedNumber(Math.max(props.monthlyIncome - props.monthlyExpense, 0))}
            </div>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-700 dark:text-rose-300">
              - Rp {formatGroupedNumber(Math.max(props.monthlyExpense - props.monthlyIncome, 0))}
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.45)] backdrop-blur-lg lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Target Overview</h3>
            <Target className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Booth-equivalent achievement</p>

          <p className="mt-6 text-4xl font-bold">{props.boothEquivalentAchieved.toFixed(2)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            dari target {props.targetBoothEquivalent} booth equivalent
          </p>

          <progress
            value={clamp(props.targetProgressPct, 0, 100)}
            max={100}
            className="mt-6 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:via-violet-500 [&::-webkit-progress-value]:to-fuchsia-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-indigo-500 [&::-moz-progress-bar]:via-violet-500 [&::-moz-progress-bar]:to-fuchsia-500"
          />

          <p className="mt-3 text-xs text-muted-foreground">
            Target income: Rp {formatGroupedNumber(props.monthlyIncomeShare)} / bulan
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <article className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.45)] backdrop-blur-lg lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Auto Sliding Analytics</h3>
              <p className="text-sm text-muted-foreground">Berpindah otomatis setiap 5 detik.</p>
            </div>
            <div className="flex gap-1.5">
              {slides.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${index === slide ? "w-8 bg-indigo-500" : "w-2.5 bg-slate-300 dark:bg-slate-700"}`}
                  aria-label={`Open slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-linear-to-br from-white/65 to-slate-100/55 p-4 dark:from-slate-900/40 dark:to-slate-800/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{currentSlide.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{currentSlide.subtitle}</p>
              </div>
              <span className="rounded-xl border border-border/70 bg-card/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {slide + 1} / {slides.length}
              </span>
            </div>

            <svg viewBox="0 0 320 105" className="mt-4 h-36 w-full">
              <defs>
                <linearGradient id="trend-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <path d={trendPath} fill="none" stroke="url(#trend-gradient)" strokeWidth="4" strokeLinecap="round" />
              {currentSlide.points.map((point, index) => {
                const x = (index / Math.max(currentSlide.points.length - 1, 1)) * 320;
                const maxPoint = Math.max(...currentSlide.points, 1);
                const minPoint = Math.min(...currentSlide.points, 0);
                const range = Math.max(maxPoint - minPoint, 1);
                const y = 92 - ((point - minPoint) / range) * 92;

                return <circle key={`${point}-${index}`} cx={x} cy={y} r="4" className="fill-white stroke-indigo-500" strokeWidth="2" />;
              })}
            </svg>
          </div>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.45)] backdrop-blur-lg lg:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Execution Gauge</h3>
            <Gauge className="h-5 w-5 text-cyan-500" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Gabungan progress target dan kesehatan cashflow.</p>

          <CircularGauge value={(props.targetProgressPct * 0.65) + (clamp(props.savingsRatePct, 0, 100) * 0.35)} />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
              <p className="text-xs text-muted-foreground">Growth Targets</p>
              <p className="mt-1 font-semibold">{props.activeGrowthTargetCount}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
              <p className="text-xs text-muted-foreground">Notifications</p>
              <p className="mt-1 font-semibold">{props.notificationTotalCount}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Portfolio Mix</p>
            <Box className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <p className="mt-4 text-3xl font-bold">{props.portfolioCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Booth ownership entries</p>
          <p className="mt-3 text-xs text-muted-foreground">Non-booth assets: {props.nonBoothAssetCount}</p>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Revenue Sources</p>
            <Landmark className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <p className="mt-4 text-3xl font-bold">{props.activeIncomeCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Active income channels</p>
          <progress
            value={clamp(props.activeIncomeCount * 8, 10, 100)}
            max={100}
            className="mt-4 h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-emerald-400 [&::-webkit-progress-value]:to-cyan-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-emerald-400 [&::-moz-progress-bar]:to-cyan-500"
          />
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Connections</p>
            <Users className="h-4.5 w-4.5 text-fuchsia-500" />
          </div>
          <p className="mt-4 text-3xl font-bold">{props.acceptedFriendCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Accepted friends</p>
          <p className="mt-3 text-xs text-muted-foreground">Pending: {props.pendingFriendCount}</p>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Execution Pulse</p>
            <Bell className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <p className="mt-4 text-3xl font-bold">{props.unreadNotificationCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Unread signals</p>
          <p className="mt-3 text-xs text-muted-foreground">Total log: {props.notificationTotalCount}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-border/70 bg-linear-to-r from-slate-50/70 via-cyan-50/70 to-indigo-50/70 p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] dark:from-slate-900/45 dark:via-cyan-950/25 dark:to-indigo-950/25">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">System health snapshot</p>
          <Coins className="h-5 w-5 text-cyan-600" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">Balance: Rp {formatGroupedNumber(props.balance)}</div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">Income: Rp {formatGroupedNumber(props.monthlyIncome)}</div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">Expense: Rp {formatGroupedNumber(props.monthlyExpense)}</div>
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">Target Progress: {props.targetProgressPct.toFixed(1)}%</div>
        </div>
      </section>
    </div>
  );
}
