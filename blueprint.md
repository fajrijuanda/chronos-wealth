# Blueprint: Wealth Management Dashboard

**Version:** 1.0.0
**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn UI, PostgreSQL (Prisma ORM), Recharts.
**UI/UX Theme:** Modern, Clean, Glassmorphism accents (Dark Mode ready).

---

## 1. Arsitektur Database (Prisma Schema)

Desain skema ini memisahkan antara pendapatan berulang (*recurring* seperti gaji dan bagi hasil gerobak) dengan pendapatan satu kali (*one-time* seperti proyek web), lengkap dengan tanggal pencairannya.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Manajemen Sumber Pemasukan
model IncomeSource {
  id              String   @id @default(cuid())
  name            String   // cth: "Booth 01 - 50", "Gaji IT", "SaaS POS Langganan"
  category        CategoryType // BOOTH, SAAS, SALARY, PROJECT, COMMISSION
  amount          Float
  isRecurring     Boolean  @default(true)
  payoutDate      Int?     // Tanggal cair (1-31) untuk recurring
  expectedDate    DateTime? // Tanggal cair spesifik untuk one-time project
  isActive        Boolean  @default(true)
  transactions    Transaction[]
}

// Pencatatan Transaksi Real-time
model Transaction {
  id              String   @id @default(cuid())
  type            TxType   // INCOME, EXPENSE
  amount          Float
  date            DateTime @default(now())
  description     String
  sourceId        String?
  source          IncomeSource? @relation(fields: [sourceId], references: [id])
  expenseCategory String?  // LIFESTYLE, SKINCARE, EDUCATION, ASSET
}

// Sistem Peringatan & Batas Pengeluaran
model BudgetLimit {
  id              String   @id @default(cuid())
  category        String   @unique // LIFESTYLE, FOOD, SKINCARE
  maxLimit        Float
  warningThreshold Float   // cth: 80% dari maxLimit
}

// Alokasi Target & Tabungan
model SavingGoal {
  id              String   @id @default(cuid())
  name            String   // cth: "DP Rumah Valerian", "S2 Korea", "Beli Kendaraan"
  targetAmount    Float
  currentAmount   Float    @default(0)
  deadline        DateTime
  priority        Int      // 1 (Highest) to 5 (Lowest)
}

enum CategoryType { BOOTH, SAAS, SALARY, PROJECT, COMMISSION }
enum TxType { INCOME, EXPENSE }
```

## 2. Struktur Direktori (Next.js App Router)

Menerapkan *clean architecture* untuk memisahkan UI, logika bisnis, dan akses database.

**Plaintext**

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── overview/page.tsx       # Dashboard utama (Total Saldo)
│   │   ├── income/page.tsx         # Detail Booth, Komisi, Project
│   │   ├── expenses/page.tsx       # Tracker & Warning Budget
│   │   ├── targets/page.tsx        # Alokasi S2, Rumah, dll
│   │   └── simulation/page.tsx     # Filter kalender prediktif
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts    # Jika pakai tRPC (opsional) atau REST API
│   │   └── cron/route.ts           # Auto-insert income berdasarkan payoutDate
├── components/
│   ├── ui/                         # Komponen Shadcn UI murni (Button, Card, dll)
│   ├── widgets/                    # Komponen rakitan (IncomeChart, BudgetWarning)
│   └── simulation/                 # Logic kalkulator prediksi saldo
├── lib/
│   ├── prisma.ts                   # Database client
│   └── utils.ts                    # Helper (format Rupiah, date fns)
└── actions/                        # Next.js Server Actions (Mutasi Data)
    ├── transaction.ts
    └── simulation.ts
```

## 3. Desain UI & Shadcn Components Terpilih

Tema UI menggunakan warna dasar netral (`zinc-950` untuk  *dark mode* , `slate-50` untuk  *light mode* ) dengan aksen warna primer *electric blue* atau *emerald green* untuk melambangkan keuangan.

* **Dashboard Utama:** Menggunakan `Card` Shadcn untuk menampilkan  *Metric Widgets* . Total Saldo Utama menggunakan font berukuran besar dengan  *font-weight: tracking-tight* .
* **Tabel Pemasukan:** Menggunakan `DataTable` Shadcn (berbasis TanStack Table) lengkap dengan *Sorting* dan  *Filtering* . Kolom mencakup: Nama Sumber, Tipe, Nominal, Tanggal Cair, dan Status.
* **Warning System:** Menggunakan `Alert` dan `Progress` Shadcn. Jika pengeluaran gaya hidup mencapai 80% dari limit, `Progress` bar berubah dari *primary* menjadi *destructive* (merah), dan `Toast` notifikasi muncul.
* **Target Alokasi:** Menampilkan *Grid* dari `Card`. Setiap kartu memiliki `RadialProgress` atau `Progress` bar linear yang menunjukkan persentase dana terkumpul menuju batas waktu ( *deadline* ).

## 4. Algoritma Core Feature

### A. Engine Pemasukan (Dynamic Payouts)

Logika untuk menangani tanggal cair yang berbeda-beda:

* Sebuah *Server Action* (bisa dipicu oleh *Cron Job* via Vercel Cron) berjalan setiap hari.
* Sistem mengecek `IncomeSource` yang `isRecurring == true` dan `payoutDate == tanggal_hari_ini`.
* Jika cocok, sistem otomatis membuat *record* baru di tabel `Transaction` (INCOME).
* Untuk tipe `PROJECT` ( *one-time* ), pengguna memasukkan `expectedDate`. Pendapatan ini berstatus *Pending* hingga pengguna menekan tombol "Cairkan" (`Mark as Paid`).

### B. Expense Warning System (Real-time Calculation)

**TypeScript**

```
// Pseudo-code logic di Server Component
const currentExpense = await db.transaction.aggregate({
  where: { type: 'EXPENSE', category: 'LIFESTYLE', date: { gte: startOfMonth } },
  _sum: { amount: true }
});

const budget = await db.budgetLimit.findUnique({ where: { category: 'LIFESTYLE' } });
const percentage = (currentExpense / budget.maxLimit) * 100;

if (percentage >= budget.warningThreshold) {
  // Trigger UI Alert (Shadcn Alert Destructive)
  // "Peringatan: Pengeluaran bulan ini sudah mencapai 80% dari batas maksimal!"
}
```

### C. Simulation Engine (Time-Travel Forecasting)

Fitur paling canggih di aplikasi ini. Memungkinkan pengguna memilih tanggal di masa depan (misal:  *Agustus 2028* ), lalu sistem akan mengkalkulasi prediksi saldo:

1. Ambil  **Saldo Saat Ini** .
2. Ambil seluruh data `IncomeSource` yang aktif ( *recurring* ). Kalikan nominalnya dengan selisih bulan dari bulan ini hingga bulan target.
3. Tambahkan pemasukan *one-time* yang tanggal `expectedDate`-nya jatuh di antara rentang waktu tersebut.
4. Kurangi dengan proyeksi pengeluaran tetap bulanan (`Average Monthly Expense`).
5. Kurangi dengan `SavingGoal` yang  *deadline* -nya terjadi dalam rentang waktu tersebut (sistem otomatis menyisihkan uang untuk target).
6. Tampilkan hasil dalam bentuk grafik `Recharts` (Garis *trend* naik).
