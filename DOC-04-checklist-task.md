# DOC-04 — AI Developer Task Checklist
## Sistem MES + WMS Pabrik Penggilingan Padi
### PT. Beras Nusantara

---

> **BACA SEBELUM MULAI:**
> 1. Baca DOC-01 (Business Process) — logika bisnis & aturan
> 2. Baca DOC-02 (Requirements) — fitur, user stories, API spec
> 3. Baca DOC-03 (Technical) — ERD, Prisma schema, arsitektur
> 4. Kerjakan checklist ini **secara berurutan** — setiap phase bergantung pada phase sebelumnya
> 5. Centang `[x]` setiap task yang sudah selesai
> 6. Jangan lanjut ke phase berikutnya jika ada task yang belum selesai

---

## Urutan Phase

```
PHASE 1 → Project Setup & Infrastruktur
PHASE 2 → Database & Prisma
PHASE 3 → Authentication
PHASE 4 → Layout & Komponen Shared
PHASE 5 → Master Data
PHASE 6 → WMS Gudang Padi (Raw Material)
PHASE 7 → MES Work Order
PHASE 8 → MES Proses Produksi
PHASE 9 → WMS Gudang Beras (Finished Goods)
PHASE 10 → WMS Pengiriman (Delivery)
PHASE 11 → Dashboard
PHASE 12 → Laporan (Reports)
PHASE 13 → Notifikasi & Alert
PHASE 14 → PDF Generation
PHASE 15 → Testing & Polish
PHASE 16 → Deployment
```

---

## PHASE 1 — Project Setup & Infrastruktur

### 1.1 Inisialisasi Project

- [x] Buat project Next.js 14 dengan TypeScript:
  ```bash
  npx create-next-app@latest mes-wms-beras \
    --typescript --tailwind --eslint --app --src-dir=false \
    --import-alias="@/*"
  ```
- [x] Verifikasi struktur folder dasar terbuat (`app/`, `public/`, `components/`, dll)
- [x] Buat file `.env.local` dari `.env.example` (lihat DOC-03 section 7.1)
- [x] Tambahkan `.env.local` ke `.gitignore`
- [x] Init git repository dan buat initial commit

### 1.2 Install Dependencies

- [x] Install dependencies utama:
  ```bash
  npm install @prisma/client next-auth @auth/prisma-adapter bcryptjs \
    zod react-hook-form @hookform/resolvers zustand \
    @tanstack/react-query date-fns recharts lucide-react \
    @react-pdf/renderer
  ```
- [x] Install dev dependencies:
  ```bash
  npm install -D prisma @types/bcryptjs ts-node
  ```
- [x] Install shadcn/ui CLI dan init:
  ```bash
  npx shadcn-ui@latest init
  ```
  Pilih: Default style, Slate base color, CSS variables = yes
- [x] Install komponen shadcn/ui yang diperlukan:
  ```bash
  npx shadcn-ui@latest add button input label card table badge \
    dialog dropdown-menu select form textarea toast skeleton \
    separator sheet tabs alert progress
  ```
- [x] Verifikasi semua package terinstall dengan `npm run dev` (tidak ada error)

### 1.3 Konfigurasi

- [x] Buat `lib/prisma.ts` — Prisma client singleton:
  ```typescript
  import { PrismaClient } from "@prisma/client";

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({ log: ["query"] });

  if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;

  export default prisma;
  ```
- [x] Update `tailwind.config.ts` — pastikan path `./app/**` dan `./components/**` included
- [x] Buat `types/index.ts` — export semua Prisma types yang akan sering dipakai:
  ```typescript
  export type { User, PaddyLot, WorkOrder, FinishedGoodsBatch,
    DeliveryOrder, Machine, Supplier, Customer, Product,
    WarehouseLocation } from "@prisma/client";
  ```
- [x] Buat `lib/constants/thresholds.ts` — salin dari DOC-03 section 5.7
- [x] Buat `lib/constants/status.ts` — semua label display untuk enum:
  ```typescript
  export const PADDY_LOT_STATUS_LABEL: Record<string, string> = {
    MENUNGGU_QC: "Menunggu QC",
    DITERIMA: "Diterima",
    DITOLAK: "Ditolak",
    ANTRIAN_GILING: "Antrian Giling",
    RESERVED: "Reserved",
    SEDANG_DIGILING: "Sedang Digiling",
    SELESAI: "Selesai",
  };
  export const WORK_ORDER_STATUS_LABEL: Record<string, string> = {
    DRAFT: "Draft",
    IN_PROGRESS: "In Progress",
    SELESAI: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  // ... tambahkan semua enum lainnya
  ```
- [x] Buat `lib/utils/cn.ts`:
  ```typescript
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```
- [x] Buat semua utility files dari DOC-03 section 5:
  - [x] `lib/utils/yield-calculator.ts`
  - [x] `lib/utils/lot-number.ts`
  - [x] `lib/utils/batch-number.ts`
  - [x] `lib/utils/wo-number.ts`
  - [x] `lib/utils/do-number.ts`
  - [x] `lib/utils/net-weight.ts`
- [x] Buat `lib/utils/date.ts`:
  ```typescript
  import { format, addMonths } from "date-fns";
  import { id } from "date-fns/locale";

  export const formatDate = (date: Date | string) =>
    format(new Date(date), "dd MMM yyyy", { locale: id });

  export const formatDateTime = (date: Date | string) =>
    format(new Date(date), "dd MMM yyyy HH:mm", { locale: id });

  export const calculateExpiryDate = (productionDate: Date): Date =>
    addMonths(productionDate, 6);
  ```
- [x] Buat `middleware.ts` di root — salin dari DOC-03 section 6.4

---

## PHASE 2 — Database & Prisma

### 2.1 Schema

- [x] Buat `prisma/schema.prisma` — salin schema lengkap dari DOC-03 section 3
- [x] Tambahkan semua `@@index` dari DOC-03 section 8 ke masing-masing model
- [x] Jalankan `npx prisma format` — pastikan tidak ada syntax error
- [x] Jalankan `npx prisma validate` — pastikan schema valid
- [x] Jalankan `npx prisma migrate dev --name init` — buat migration pertama
- [x] Verifikasi semua tabel terbuat di database dengan `npx prisma studio`

### 2.2 Seed Data

- [x] Buat `prisma/seed.ts`
- [x] Seed: **PaddyVariety** (5 records) — sesuai DOC-01 tabel 9.1
  ```typescript
  const varieties = [
    { code: "VAR-IR64", name: "IR64", description: "Varietas paling umum di Jawa Barat" },
    { code: "VAR-CIH", name: "Ciherang", description: "Kualitas premium, populer" },
    { code: "VAR-PW", name: "Pandan Wangi", description: "Kualitas sangat premium, harum" },
    { code: "VAR-IR42", name: "IR42", description: "Kualitas menengah" },
    { code: "VAR-LOK", name: "Lokal/Campuran", description: "Tidak teridentifikasi/campuran" },
  ];
  ```
- [x] Seed: **User** (5 records) — sesuai DOC-01 tabel 10.1, password di-hash dengan bcryptjs
- [x] Seed: **Supplier** (5 records) — sesuai DOC-01 tabel 10.3
- [x] Seed: **Customer** (5 records) — sesuai DOC-01 tabel 10.4
- [x] Seed: **Product** (3 records) — sesuai DOC-01 section 2, lengkap dengan packagingVariants JSON
- [x] Seed: **Machine** (8 records) — sesuai DOC-01 tabel 9.4
- [x] Seed: **WarehouseLocation** — sesuai DOC-01 tabel 9.6:
  - Area A (karantina RM), Area B (IR64), Area C (lainnya), Area D (dryer)
  - Rak A-01 s/d A-10 (FG Premium), Rak B-01 s/d B-15 (FG Medium), Rak C-01 s/d C-10 (FG Patah), Area KAR
- [x] Seed: **PackagingMaterial** (7 records) — sesuai DOC-01 tabel 9.5
- [x] Seed: **PaddyLot** (3 sample records) — sesuai DOC-01 tabel 10.9
- [x] Seed: **IncomingQC** untuk 2 dari 3 lot sample (status LULUS)
- [x] Seed: **WorkOrder** (2 sample records) — sesuai DOC-01 tabel 10.10
- [x] Seed: **WorkOrderStep** — untuk setiap WO, generate 5 steps (PENGERINGAN, PENGGILINGAN, PENYOSOHAN, SORTASI_GRADING, PENGEMASAN) dengan status BELUM_MULAI
- [x] Pastikan seed idempotent: gunakan `upsert` bukan `create` di semua seed
- [x] Jalankan `npm run db:seed` — pastikan berhasil tanpa error
- [x] Verifikasi data seed di Prisma Studio

---

## PHASE 3 — Authentication

### 3.1 NextAuth Setup

- [x] Buat `lib/auth.ts` — konfigurasi NextAuth:
  ```typescript
  import { NextAuthOptions } from "next-auth";
  import CredentialsProvider from "next-auth/providers/credentials";
  import { PrismaAdapter } from "@auth/prisma-adapter";
  import { prisma } from "@/lib/prisma";
  import bcrypt from "bcryptjs";

  export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" },
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user || user.status === "INACTIVE") return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) { token.role = (user as any).role; token.id = user.id; }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).role = token.role;
          (session.user as any).id = token.id;
        }
        return session;
      },
    },
    pages: { signIn: "/login" },
  };
  ```
- [x] Buat `app/api/auth/[...nextauth]/route.ts`:
  ```typescript
  import NextAuth from "next-auth";
  import { authOptions } from "@/lib/auth";
  const handler = NextAuth(authOptions);
  export { handler as GET, handler as POST };
  ```
- [x] Extend tipe NextAuth di `types/next-auth.d.ts`:
  ```typescript
  import { Role } from "@prisma/client";
  declare module "next-auth" {
    interface Session {
      user: { id: string; name: string; email: string; role: Role; };
    }
  }
  declare module "next-auth/jwt" {
    interface JWT { role: Role; id: string; }
  }
  ```
- [x] Buat helper `lib/utils/auth-guard.ts`:
  ```typescript
  import { getServerSession } from "next-auth";
  import { authOptions } from "@/lib/auth";
  import { NextResponse } from "next/server";
  import { Role } from "@prisma/client";

  export async function requireAuth(allowedRoles?: Role[]) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { session: null, error: NextResponse.json(
        { success: false, error: "Unauthorized" }, { status: 401 }
      )};
    }
    if (allowedRoles && !allowedRoles.includes((session.user as any).role)) {
      return { session: null, error: NextResponse.json(
        { success: false, error: "Forbidden" }, { status: 403 }
      )};
    }
    return { session, error: null };
  }
  ```

### 3.2 Halaman Login

- [x] Buat `app/(auth)/layout.tsx` — layout minimalis tanpa sidebar
- [x] Buat `app/(auth)/login/page.tsx`:
  - Form: input email + password
  - Button "Masuk"
  - Loading state saat submit
  - Error message jika login gagal
  - Setelah login sukses → redirect ke `/`
  - Gunakan `signIn()` dari `next-auth/react`
- [x] Test: login dengan semua 5 user dari seed data
- [x] Test: redirect ke `/login` jika akses halaman protected tanpa login

---

## PHASE 4 — Layout & Komponen Shared

### 4.1 Dashboard Layout

- [x] Buat `app/(dashboard)/layout.tsx`:
  - Sidebar di kiri (desktop)
  - Header di atas
  - Main content area
  - Mobile: sidebar collapse jadi hamburger menu
  - Wrap children dengan `QueryClientProvider` (TanStack Query)
- [x] Buat `components/layout/Sidebar.tsx`:
  - Render menu dari DOC-02 section 2.2
  - Highlight active menu sesuai current path
  - Role-based: sembunyikan Master Data jika bukan ADMIN
  - Collapse di mobile (state dari Zustand atau useState)
- [x] Buat `components/layout/Header.tsx`:
  - Nama user yang login + role badge
  - Tombol logout
  - Hamburger button untuk mobile sidebar
  - Tombol notifikasi/alert (badge jumlah alert aktif)
- [x] Buat `components/layout/MobileNav.tsx` — Sheet/drawer dari shadcn untuk nav mobile

### 4.2 Komponen Shared

- [x] Buat `components/shared/PageHeader.tsx`:
  ```typescript
  // Props: title, description?, actions? (ReactNode untuk button di kanan)
  ```
- [x] Buat `components/shared/StatusBadge.tsx`:
  - Terima `status` string dan `type` (paddyLot / workOrder / batch / delivery / machine)
  - Return Badge dengan warna sesuai DOC-02 section 7.2
- [x] Buat `components/shared/DataTable.tsx`:
  - Props: `columns`, `data`, `isLoading`, `pagination?`
  - Loading state: skeleton rows
  - Empty state: ilustrasi + pesan
  - Pagination controls (prev/next/page numbers)
- [x] Buat `components/shared/ConfirmDialog.tsx`:
  - Props: `title`, `description`, `onConfirm`, `isLoading`, `trigger`
  - Gunakan Dialog dari shadcn
- [x] Buat `components/shared/AlertBanner.tsx`:
  - Props: `alerts: Alert[]`
  - Tampilkan banner merah/kuning untuk setiap alert aktif
  - Tombol dismiss per alert
- [x] Buat `components/shared/LoadingSkeleton.tsx`:
  - Beberapa variant: `table`, `card`, `form`
- [x] Buat `components/shared/ErrorState.tsx`:
  - Props: `message`, `onRetry?`
- [x] Buat `components/shared/EmptyState.tsx`:
  - Props: `title`, `description`, `action?`
- [x] Setup toast notifications — gunakan Toaster dari shadcn, tambahkan ke root layout

---

## PHASE 5 — Master Data

> Semua halaman master data hanya untuk role `ADMIN`.
> Pattern yang sama untuk semua entity: List → Create → Edit.

### 5.1 API Routes Master Data

- [x] Buat `app/api/master-data/users/route.ts` — GET (list), POST (create)
- [x] Buat `app/api/master-data/users/[id]/route.ts` — GET (detail), PATCH (edit)
- [x] Buat `app/api/master-data/users/[id]/reset-password/route.ts` — PATCH
- [x] Buat `app/api/master-data/suppliers/route.ts` — GET, POST
- [x] Buat `app/api/master-data/suppliers/[id]/route.ts` — GET, PATCH
- [x] Buat `app/api/master-data/customers/route.ts` — GET, POST
- [x] Buat `app/api/master-data/customers/[id]/route.ts` — GET, PATCH
- [x] Buat `app/api/master-data/products/route.ts` — GET, POST
- [x] Buat `app/api/master-data/products/[id]/route.ts` — GET, PATCH
- [x] Buat `app/api/master-data/machines/route.ts` — GET, POST
- [x] Buat `app/api/master-data/machines/[id]/route.ts` — GET, PATCH
- [x] Buat `app/api/master-data/machines/[id]/status/route.ts` — PATCH (update status mesin)
- [x] Buat `app/api/master-data/locations/route.ts` — GET, POST
- [x] Buat `app/api/master-data/locations/[id]/route.ts` — GET, PATCH
- [x] Buat `app/api/master-data/packaging-materials/route.ts` — GET, POST
- [x] Buat `app/api/master-data/packaging-materials/[id]/route.ts` — GET, PATCH
- [x] Buat `app/api/master-data/paddy-varieties/route.ts` — GET (untuk dropdown)

**Untuk setiap API route pastikan:**
- [x] Cek session + role dengan `requireAuth(["ADMIN"])`
- [x] Validasi input dengan Zod schema
- [x] Handle error dengan try-catch
- [x] Response format sesuai konvensi DOC-02 section 5.0

### 5.2 Zod Validation Schemas

- [x] Buat `lib/validations/user.ts` — schema create & edit user
- [x] Buat `lib/validations/supplier.ts`
- [x] Buat `lib/validations/customer.ts`
- [x] Buat `lib/validations/product.ts`
- [x] Buat `lib/validations/machine.ts`
- [x] Buat `lib/validations/location.ts`
- [x] Buat `lib/validations/packaging-material.ts`

### 5.3 Halaman Master Data

- [x] Buat `app/(dashboard)/master-data/users/page.tsx` — tabel user + button tambah
- [x] Buat `app/(dashboard)/master-data/users/create/page.tsx` — form tambah user
- [x] Buat `app/(dashboard)/master-data/users/[id]/page.tsx` — form edit user + reset password
- [x] Buat `app/(dashboard)/master-data/suppliers/page.tsx`
- [x] Buat `app/(dashboard)/master-data/suppliers/create/page.tsx`
- [x] Buat `app/(dashboard)/master-data/suppliers/[id]/page.tsx`
- [x] Buat `app/(dashboard)/master-data/customers/page.tsx`
- [x] Buat `app/(dashboard)/master-data/customers/create/page.tsx`
- [x] Buat `app/(dashboard)/master-data/customers/[id]/page.tsx`
- [x] Buat `app/(dashboard)/master-data/products/page.tsx`
- [x] Buat `app/(dashboard)/master-data/products/create/page.tsx`
- [x] Buat `app/(dashboard)/master-data/products/[id]/page.tsx`
- [x] Buat `app/(dashboard)/master-data/machines/page.tsx`
- [x] Buat `app/(dashboard)/master-data/machines/create/page.tsx`
- [x] Buat `app/(dashboard)/master-data/machines/[id]/page.tsx`
- [x] Buat `app/(dashboard)/master-data/locations/page.tsx`
- [x] Buat `app/(dashboard)/master-data/locations/create/page.tsx`
- [x] Buat `app/(dashboard)/master-data/locations/[id]/page.tsx`
- [x] Buat `app/(dashboard)/master-data/packaging-materials/page.tsx`
- [x] Buat `app/(dashboard)/master-data/packaging-materials/create/page.tsx`
- [x] Buat `app/(dashboard)/master-data/packaging-materials/[id]/page.tsx`

**Untuk setiap halaman pastikan:**
- [x] Gunakan `DataTable` component yang sudah dibuat
- [x] Ada loading skeleton saat data fetch
- [x] Ada empty state jika data kosong
- [x] Form menggunakan React Hook Form + Zod resolver
- [x] Toast success/error setelah submit
- [x] Redirect setelah create/edit berhasil

---

## PHASE 6 — WMS Gudang Padi (Raw Material)

### 6.1 API Routes

- [x] Buat `app/api/wms/paddy-lots/route.ts` — GET (list dengan filter), POST (catat penerimaan)
  - GET: support query params `?status=&varietyId=&supplierId=&startDate=&endDate=&page=&limit=`
  - POST: validasi, generate lot number, hitung net weight, create PaddyLot + RMStockMovement, return lot baru
- [x] Buat `app/api/wms/paddy-lots/[id]/route.ts` — GET (detail lot)
- [x] Buat `app/api/wms/paddy-lots/[id]/qc/route.ts` — POST (submit QC)
  - Gunakan `prisma.$transaction()`: create IncomingQC + update PaddyLot status + update RMStockMovement
  - Jika LULUS → status ANTRIAN_GILING
  - Jika GAGAL → status DITOLAK
- [x] Buat `app/api/wms/paddy-lots/[id]/history/route.ts` — GET (riwayat pergerakan)

### 6.2 Zod Schemas

- [x] Buat `lib/validations/paddy-lot.ts`:
  - `createPaddyLotSchema`: supplierId, varietyId, grossWeight, sackWeight, moistureContent, dirtPercentage, notes
  - `incomingQCSchema`: moistureContent, dirtPercentage, colorAroma, result, rejectionReason, notes
  - Validasi: moistureContent max 30, dirtPercentage max 100, grossWeight > 0

### 6.3 Halaman

- [x] Buat `app/(dashboard)/wms/paddy-warehouse/page.tsx`:
  - PageHeader: "Gudang Padi" + button "Catat Penerimaan"
  - Stats cards: total stok padi (kg), jumlah lot aktif, lot menunggu QC
  - DataTable lot padi: Lot Number, Supplier, Varietas, Berat Bersih, Kadar Air, Status, Tanggal Masuk
  - Filter: status, varietas, tanggal
  - Klik baris → `/wms/paddy-warehouse/[id]`
- [x] Buat `app/(dashboard)/wms/paddy-warehouse/incoming/page.tsx`:
  - PageHeader: "Catat Penerimaan Padi"
  - Form penerimaan padi (semua fields dari DOC-02 section 3.4.2)
  - Kalkulasi preview net weight otomatis saat input gross weight, sack weight, dirt %
  - Submit → redirect ke halaman QC untuk lot yang baru dibuat
- [x] Buat `app/(dashboard)/wms/paddy-warehouse/[id]/page.tsx`:
  - Detail lot: semua info
  - Card QC result (jika sudah ada)
  - Timeline pergerakan lot
  - Jika status MENUNGGU_QC: tampilkan form QC inline atau link ke QC

### 6.4 Komponen

- [x] Buat `components/wms/PaddyLotTable.tsx` — tabel dengan StatusBadge dan filter
- [x] Buat `components/wms/IncomingForm.tsx` — form penerimaan dengan preview net weight
- [x] Buat `components/qc/IncomingQCForm.tsx` — form QC dengan toggle LULUS/DITOLAK

### 6.5 QC Penerimaan

- [x] Buat `app/(dashboard)/qc/incoming/page.tsx` — list semua lot yang menunggu QC
- [x] Buat `app/(dashboard)/qc/incoming/[lotId]/page.tsx` — form QC untuk lot tertentu
- [x] Buat `app/api/qc/incoming/route.ts` — GET lot menunggu QC

---

## PHASE 7 — MES Work Order

### 7.1 API Routes

- [x] Buat `app/api/mes/work-orders/route.ts` — GET (list), POST (create)
  - GET: support filter `?status=&startDate=&endDate=&page=&limit=`
  - POST:
    - Gunakan `prisma.$transaction()`
    - Generate WO number
    - Create WorkOrder
    - Create 5 WorkOrderStep (order 1–5, cek kadar air lot — jika ≤14% set PENGERINGAN → SKIPPED)
    - Update PaddyLot status → RESERVED
- [x] Buat `app/api/mes/work-orders/[id]/route.ts` — GET (detail + steps + logs)
- [x] Buat `app/api/mes/work-orders/[id]/status/route.ts` — PATCH (update status WO)
  - Validasi: hanya ADMIN yang bisa cancel, tidak bisa cancel jika sudah IN_PROGRESS

### 7.2 Zod Schemas

- [x] Buat `lib/validations/work-order.ts`:
  - `createWorkOrderSchema`: paddyLotId, targetProducts (array enum), estimatedOutput, deadline, notes
  - Validasi: deadline harus di masa depan, estimatedOutput > 0

### 7.3 Halaman

- [x] Buat `app/(dashboard)/mes/work-orders/page.tsx`:
  - PageHeader: "Work Order" + button "Buat Work Order" (ADMIN only)
  - Stats cards: total WO, WO aktif, WO selesai hari ini
  - DataTable: WO Number, Lot Padi, Target Produk, Est. Output, Status, Deadline, Progress
  - Filter by status dan tanggal
- [x] Buat `app/(dashboard)/mes/work-orders/create/page.tsx`:
  - Form buat WO (ADMIN only)
  - Dropdown lot padi hanya tampilkan status ANTRIAN_GILING
  - Multi-select target produk
  - Auto-kalkulasi estimatedOutput dari lot weight × 0.62 (target yield)
  - Date picker untuk deadline
- [x] Buat `app/(dashboard)/mes/work-orders/[id]/page.tsx`:
  - Info WO: nomor, status, deadline, lot padi asal, target produk
  - **WorkOrderTimeline component** — visual progress semua step
  - Per step: status badge, tombol "Mulai" (jika giliran step ini), detail log jika sudah selesai
  - Tombol "Cancel WO" (ADMIN, hanya jika DRAFT)

### 7.4 Komponen

- [x] Buat `components/mes/WorkOrderTimeline.tsx`:
  - Tampilkan 5 step dalam bentuk visual progress (vertikal di mobile, horizontal di desktop)
  - Setiap step: icon, nama, status badge, tombol aksi
  - Step yang SKIPPED tampil abu-abu dengan label "Dilewati"
  - Step yang IN_PROGRESS animasi pulse
- [x] Buat `components/mes/WorkOrderForm.tsx` — form create WO dengan semua field
- [x] Buat `components/mes/MachineStatusCard.tsx`:
  - Card kecil per mesin: nama, tipe, status (warna)
  - Klik → buka dialog input downtime


---

## PHASE 8 — MES Proses Produksi

### 8.1 API Routes Production Logs

- [x] Buat `app/api/mes/production-logs/route.ts` — GET (list log untuk WO tertentu)
- [x] Buat `app/api/mes/production-logs/drying/route.ts` — POST
  - Validasi: cek WO status IN_PROGRESS, step PENGERINGAN belum SELESAI
  - `prisma.$transaction()`: create ProductionLog + create DryingLog + update WorkOrderStep
  - Hitung dryingLoss, update WO startedAt jika pertama kali
  - Jika kadar air akhir ≤14% → step SELESAI, else tetap IN_PROGRESS (siklus berikutnya)
- [x] Buat `app/api/mes/production-logs/husking/route.ts` — POST
  - Validasi: step PENGERINGAN harus SELESAI atau SKIPPED
  - `prisma.$transaction()`: create ProductionLog + create HuskingLog + update WorkOrderStep
  - Hitung huskingYield, update MachineLog
  - Cek threshold: jika yield <75% → create Alert HUSKING_YIELD_RENDAH
  - Update stok by-product sekam (WarehouseLocation by-product)
- [x] Buat `app/api/mes/production-logs/polishing/route.ts` — POST
  - Validasi: step PENGGILINGAN harus SELESAI
  - `prisma.$transaction()`: create ProductionLog + create PolishingLog + update WorkOrderStep
  - Hitung polishingYield
  - Update stok by-product bekatul
- [x] Buat `app/api/mes/production-logs/sorting/route.ts` — POST
  - Validasi: step PENYOSOHAN harus SELESAI
  - Validasi: sum outputs ≤ input (toleransi 0.5%)
  - `prisma.$transaction()`: create ProductionLog + create SortingLog + update WorkOrderStep
  - Hitung wholeGrainRatio, tentukan gradingDecision otomatis
- [x] Buat `app/api/mes/production-logs/packaging/route.ts` — POST
  - Validasi: step SORTASI_GRADING harus SELESAI
  - `prisma.$transaction()`:
    - Create ProductionLog + create PackagingLog
    - Create PackagingConsumption per material
    - Kurangi stok PackagingMaterial
    - Create FinishedGoodsBatch per produk per ukuran kemasan
    - Update WorkOrderStep PENGEMASAN → SELESAI
    - Update WorkOrder status → SELESAI, set actualOutput & overallYield & completedAt
    - Update PaddyLot status → SELESAI
  - Cek threshold: jika overall yield <58% → create Alert YIELD_RENDAH

### 8.2 API Routes Machine Logs

- [x] Buat `app/api/mes/machine-logs/downtime/route.ts` — POST (catat downtime)
  - Create DowntimeLog
  - Hitung duration jika endTime ada
  - Update Machine status sesuai (BREAKDOWN jika reason BREAKDOWN)
- [x] Buat `app/api/mes/machine-logs/[machineId]/route.ts` — GET (riwayat log mesin)

### 8.3 Zod Schemas

- [x] Buat `lib/validations/production-log.ts`:
  - `dryingLogSchema`: workOrderId, machineId, inputWeight, tempCelsius, moistureIn, moistureOut, weightAfterDrying, startTime, endTime, notes
  - `huskingLogSchema`: workOrderId, machineId, inputWeight, brownRiceOutput, huskOutput, startTime, endTime, notes
  - `polishingLogSchema`: workOrderId, machineId, inputWeight, soshLevel, whiteRiceOutput, branOutput, startTime, endTime, notes
  - `sortingLogSchema`: workOrderId, inputWeight, wholeGrainOutput, halfBrokenOutput, quarterBrokenOutput, rejectedOutput, startTime, endTime, notes
  - `packagingLogSchema`: workOrderId, items (array: productId, packagingSize, totalSak), materials (array: materialId, qty), notes
  - `downtimeLogSchema`: machineId, reason, startTime, endTime, notes

### 8.4 Halaman & Komponen Produksi

- [x] Buat `components/mes/ProductionStepForm.tsx`:
  - Komponen reusable untuk semua form step produksi
  - Props: `stepType`, `workOrderId`, `onSuccess`
  - Render form yang berbeda berdasarkan stepType
  - Tampil di dalam WorkOrderTimeline saat step di-expand

- [x] Buat form per step (bisa sebagai sub-komponen atau halaman tersendiri):
  - [x] `components/mes/steps/DryingForm.tsx`
  - [x] `components/mes/steps/HuskingForm.tsx` — tampilkan preview husking yield real-time
  - [x] `components/mes/steps/PolishingForm.tsx` — tampilkan preview polishing yield real-time
  - [x] `components/mes/steps/SortingForm.tsx` — tampilkan preview whole grain ratio + grade otomatis real-time
  - [x] `components/mes/steps/PackagingForm.tsx` — tambah baris per produk + material
  
- [x] Buat `app/(dashboard)/mes/machines/page.tsx`:
  - Grid kartu status semua mesin (menggunakan MachineStatusCard)
  - Tombol "Catat Downtime" per mesin
  - Riwayat downtime terbaru per mesin

---

## PHASE 9 — WMS Gudang Beras (Finished Goods)

### 9.1 API Routes

- [x] Buat `app/api/wms/rice-stock/route.ts` — GET (list batch dengan filter)
  - Support filter: `?productId=&status=&locationId=&expiringInDays=`
- [x] Buat `app/api/wms/rice-stock/summary/route.ts` — GET (summary per SKU):
  - Return: per produk: totalSak, totalKg, batchCount, nearestExpiry
- [x] Buat `app/api/wms/rice-stock/inbound/route.ts` — POST (penerimaan dari produksi)
  - Input: batchId, locationId, confirmedQty, condition, notes
  - `prisma.$transaction()`:
    - Update FinishedGoodsBatch: status → DI_GUDANG, locationId, receivedToWarehouseAt
    - Update WarehouseLocation: status → TERISI
    - Create FGStockMovement (type: IN)
  - Validasi: batchId harus status PRODUKSI, locationId harus KOSONG
- [x] Buat `app/api/wms/rice-stock/stock-opname/route.ts` — GET (list), POST (submit opname)
- [x] Buat `app/api/wms/rice-stock/stock-opname/[id]/route.ts` — GET (detail)
- [x] Buat `app/api/wms/rice-stock/stock-opname/[id]/approve/route.ts` — PATCH (ADMIN approve)
  - `prisma.$transaction()`:
    - Update StockOpname: isApproved = true
    - Per item variance ≠ 0: create FGStockMovement (type: ADJUSTMENT)
    - Update totalSak di FinishedGoodsBatch sesuai physicalQty

### 9.2 Zod Schemas

- [x] Buat `lib/validations/rice-stock.ts`:
  - `inboundSchema`: batchId, locationId, confirmedQty, condition, notes
  - `stockOpnameSchema`: items (array: batchId, physicalQty, notes), notes
  
### 9.3 Halaman

- [x] Buat `app/(dashboard)/wms/rice-warehouse/page.tsx`:
  - PageHeader: "Gudang Beras"
  - Stats cards per produk: total sak, total kg, batch aktif (gunakan summary API)
  - Alert banner jika ada batch hampir kadaluarsa
  - DataTable batch: Batch Number, Produk, Ukuran, Jumlah Sak, Lokasi, Tgl Produksi, Tgl Kadaluarsa, Status
  - Filter: produk, status, lokasi
  - Highlight baris merah jika kadaluarsa <30 hari
- [x] Buat `app/(dashboard)/wms/rice-warehouse/inbound/page.tsx`:
  - List batch dengan status PRODUKSI (belum masuk gudang)
  - Per batch: tombol "Terima ke Gudang" → modal form assign lokasi
  - Form: pilih lokasi kosong (dropdown), konfirmasi jumlah, kondisi
- [x] Buat `app/(dashboard)/wms/rice-warehouse/stock-opname/page.tsx`:
  - List stock opname sebelumnya
  - Tombol "Mulai Stock Opname Baru"
- [x] Buat `app/(dashboard)/wms/rice-warehouse/stock-opname/create/page.tsx`:
  - Tabel semua batch aktif dengan kolom: Batch, Produk, Jumlah Sistem, Input Fisik, Variance
  - Input fisik per baris (number input)
  - Summary: total variance, jumlah item berbeda
  - Tombol submit → konfirmasi dialog

### 9.4 Komponen

- [x] Buat `components/wms/RiceStockTable.tsx` — tabel dengan highlight kadaluarsa
- [x] Buat `components/wms/InboundFGForm.tsx` — form penerimaan dari produksi

---

## PHASE 10 — WMS Pengiriman (Delivery)

### 10.1 API Routes

- [x] Buat `app/api/wms/delivery-orders/route.ts` — GET (list), POST (create DO)
  - GET: support filter `?status=&customerId=&driverId=&startDate=&endDate=`
  - POST:
    - Generate DO number
    - `prisma.$transaction()`:
      - Create DeliveryOrder
      - Create DeliveryOrderItems
      - Per item: Update FinishedGoodsBatch status → RESERVED
      - Create FGStockMovement (type: OUT, pending)
    - Validasi: stok tersedia mencukupi per batch
- [x] Buat `app/api/wms/delivery-orders/[id]/route.ts` — GET (detail + items)
- [x] Buat `app/api/wms/delivery-orders/[id]/confirm/route.ts` — PATCH (CONFIRMED → PICKING)
- [x] Buat `app/api/wms/delivery-orders/[id]/ready/route.ts` — PATCH (PICKING → READY_TO_SHIP)
- [x] Buat `app/api/wms/delivery-orders/[id]/ship/route.ts` — PATCH (READY_TO_SHIP → SHIPPED)
  - Set shippedAt = now()
- [x] Buat `app/api/wms/delivery-orders/[id]/delivered/route.ts` — PATCH (SHIPPED → DELIVERED)
  - `prisma.$transaction()`:
    - Update DeliveryOrder: status DELIVERED, deliveredAt = now()
    - Per item: Update FinishedGoodsBatch status → SHIPPED, kurangi totalSak
    - Confirm FGStockMovement
- [x] Buat `app/api/wms/delivery-orders/[id]/return/route.ts` — POST (catat retur)
  - Create DeliveryReturn
  - `prisma.$transaction()`:
    - Update DeliveryOrder status → PARTIAL_RETURN
    - Kembalikan stok batch yang diretur: Update FinishedGoodsBatch totalSak, status → DI_GUDANG
    - Create FGStockMovement (type: IN, retur)
- [x] Buat `app/api/wms/delivery-orders/[id]/surat-jalan/route.ts` — GET (return PDF buffer)

### 10.2 FIFO Logic

- [x] Buat `lib/utils/fifo.ts`:
  ```typescript
  /**
   * Sarankan batch untuk DO berdasarkan FIFO (expiry date paling awal duluan)
   * Return: array batch yang disarankan beserta jumlah sak per batch
   */
  export async function getSuggestedBatchesFIFO(
    productId: string,
    packagingSize: number,
    requiredSak: number
  ): Promise<Array<{ batchId: string; batchNumber: string; availableSak: number; expiryDate: Date }>> {
    // Query batch status DI_GUDANG, filter productId + packagingSize
    // Order by expiryDate ASC (FIFO)
    // Return sampai total sak terpenuhi
  }
  ```
- [x] Integrasikan FIFO logic ke POST delivery-orders: saat create DO, call suggestBatches

### 10.3 Zod Schemas

- [x] Buat `lib/validations/delivery-order.ts`:
  - `createDeliveryOrderSchema`: customerId, driverId, deliveryDate, items (array: batchId, orderedQty), notes
  - `deliveryReturnSchema`: items (array: batchId, returnedQty, reason), notes

### 10.4 Halaman

- [x] Buat `app/(dashboard)/wms/delivery/page.tsx`:
  - PageHeader: "Delivery Order" + button "Buat DO"
  - Stats cards: DO pending, DO hari ini, DO bulan ini
  - DataTable: DO Number, Pelanggan, Tanggal Kirim, Total Item, Status, Driver
  - Filter by status, tanggal
- [x] Buat `app/(dashboard)/wms/delivery/create/page.tsx`:
  - Form buat DO
  - Pilih pelanggan (dropdown)
  - Pilih supir (dropdown — user role DRIVER)
  - Date picker tanggal pengiriman
  - **Add Item section**: pilih produk + ukuran kemasan + jumlah sak
    - Setelah input produk & jumlah: tampilkan FIFO suggestion (batch yang akan digunakan)
    - Operator bisa override batch yang dipilih
  - Summary: total sak, total estimasi berat
- [x] Buat `app/(dashboard)/wms/delivery/[id]/page.tsx`:
  - Detail DO: info header, status timeline, tabel items
  - Tombol aksi sesuai status (Confirm, Ready, Ship, Delivered)
  - Tombol "Generate Surat Jalan" (download PDF)
  - Section retur (jika status DELIVERED)
  - Form catat retur
- [x] Buat `app/(dashboard)/wms/delivery/driver/page.tsx` — khusus role DRIVER:
  - Tampilkan DO yang di-assign ke driver yang login
  - Filter: hari ini, upcoming
  - Tombol "Konfirmasi Terkirim" per DO
  - Form konfirmasi: tanggal tiba, catatan, retur

### 10.5 Komponen

- [x] Buat `components/wms/DeliveryOrderForm.tsx`
- [x] Buat `components/wms/FIFOBatchSelector.tsx` — tampilkan suggestion + override
- [x] Buat `components/wms/DeliveryStatusTimeline.tsx` — visual timeline status DO

---

## PHASE 11 — Dashboard

### 11.1 API Routes

- [x] Buat `app/api/reports/dashboard-stats/route.ts` — GET
  - Return semua data yang dibutuhkan dashboard dalam satu request:
    ```typescript
    {
      paddyStockKg: number,
      riceStockByProduct: Array<{ sku, name, totalSak, totalKg }>,
      activeWorkOrders: number,
      pendingDeliveries: number,
      activeAlerts: Alert[],
      recentWorkOrders: WorkOrder[],          // 5 terbaru
      machineStatuses: Machine[],
      productionChartData: Array<{            // 7 hari terakhir
        date: string,
        paddyIn: number,
        riceOut: number,
        yield: number
      }>,
    }
    ```
  - Semua query bisa dijalankan parallel dengan `Promise.all([])`

### 11.2 Halaman Dashboard

- [x] Buat `app/(dashboard)/page.tsx`:
  - Fetch data dari `/api/reports/dashboard-stats`
  - Auto-refresh setiap 5 menit (TanStack Query `refetchInterval` atau polling custom 30s)
  - **Row 1 — Stats Cards:**
    - Stok Padi (kg) dengan icon gudang
    - Stok Beras Premium (sak) — warna hijau
    - Stok Beras Medium (sak) — warna biru
    - Stok Beras Patah (sak) — warna abu
    - Work Order Aktif (count)
    - Delivery Order Pending (count)
  - **Row 2 — Charts:**
    - Bar chart: Padi Masuk vs Beras Keluar per hari (7 hari)
    - Line chart overlay: Overall Yield (%) per hari
    - Gunakan Recharts `ComposedChart`
  - **Row 3 — Tables & Status:**
    - Tabel Work Order Aktif (kiri)
    - Grid Machine Status cards (kanan)
  - **Alert Banner** di atas halaman jika ada alert aktif

### 11.3 Komponen Dashboard

- [x] Buat `components/dashboard/StockSummaryCard.tsx` — stats card dengan icon & trend
- [x] Buat `components/dashboard/ProductionChart.tsx` — ComposedChart 7 hari
- [x] Buat `components/dashboard/YieldGaugeChart.tsx` — gauge chart untuk rata-rata yield
- [x] Buat `components/dashboard/ActiveWorkOrderList.tsx` — mini tabel WO aktif
- [x] Buat `components/dashboard/MachineStatusGrid.tsx` — grid semua mesin

---

## PHASE 12 — Laporan (Reports)

### 12.1 API Routes Reports

- [x] Buat `app/api/reports/production/route.ts` — GET
  - Query params: `startDate`, `endDate`
  - Return: list WO selesai + detail yield, summary rata-rata yield, total produksi
- [x] Buat `app/api/reports/machine-oee/route.ts` — GET
  - Per mesin: total jam operasi, total downtime menit, OEE %
  - Gunakan `calculateOEE()` dari yield-calculator.ts
- [x] Buat `app/api/reports/inventory/route.ts` — GET
  - Stock movement summary per hari (padi masuk/keluar, beras masuk/keluar)
  - Stok saat ini vs minimum stok
- [x] Buat `app/api/reports/delivery/route.ts` — GET
  - List semua DO terkirim per periode
  - On-time delivery rate
  - Total retur
- [x] Buat `app/api/reports/supplier-quality/route.ts` — GET
  - Per supplier: total lot, acceptance rate, avg kadar air, avg yield dari lot mereka

### 12.2 Halaman

- [x] Buat `app/(dashboard)/reports/yield/page.tsx`:
  - Date range picker
  - Summary cards: rata-rata overall yield, rata-rata husking yield, rata-rata polishing yield
  - Tabel: per WO — nomor, lot, padi masuk, beras jadi, husking yield, polishing yield, overall yield
  - Line chart: trend yield per periode
  - Tombol export CSV
- [x] Buat `app/(dashboard)/reports/production/page.tsx`:
  - Date range picker
  - Total produksi per produk (Premium/Medium/Patah) dalam kg dan sak
  - Bar chart per produk per periode
  - Tabel detail per WO
- [x] Buat `app/(dashboard)/reports/inventory/page.tsx`:
  - Summary stok saat ini vs minimum
  - Grafik pergerakan stok per hari
  - Tabel log pergerakan stok
- [x] Buat `app/(dashboard)/reports/delivery/page.tsx`:
  - Date range picker
  - Summary: total DO, total sak terkirim, on-time rate, total retur
  - Tabel DO per periode
  - Chart: pengiriman per pelanggan (pie/bar)

### 12.3 Export CSV

- [x] Buat `lib/utils/export-csv.ts`:
  ```typescript
  export function exportToCSV(data: Record<string, any>[], filename: string): void {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
  ```
- [x] Tambahkan tombol export CSV di setiap halaman laporan

---

## PHASE 13 — Notifikasi & Alert

### 13.1 API Routes

- [x] Buat `app/api/alerts/route.ts` — GET (list alert aktif, filter by role)
- [x] Buat `app/api/alerts/[id]/dismiss/route.ts` — PATCH (dismiss alert)
- [x] Buat `app/api/alerts/check/route.ts` — POST (trigger pengecekan alert manual)
  - Panggil `runAlertChecks()` dari `lib/utils/alert-checker.ts`
  - Endpoint ini dipanggil dari cron job atau setelah operasi penting

### 13.2 Alert Integration

- [x] Panggil `runAlertChecks()` setelah operasi-operasi penting:
  - [x] Setelah QC penerimaan padi diterima
  - [x] Setelah packaging log disubmit (cek stok beras)
  - [x] Setelah delivery order dibuat (cek stok)
  - [x] Setelah inbound FG selesai
- [x] Buat `hooks/useAlerts.ts` — hook untuk fetch & dismiss alerts
- [x] Tampilkan badge jumlah alert di Header
- [x] Tampilkan AlertBanner di dashboard

---

## PHASE 14 — PDF Generation (Surat Jalan)

### 14.1 Komponen PDF

- [x] Buat `components/wms/SuratJalanPDF.tsx` menggunakan `@react-pdf/renderer`:
  ```typescript
  // Komponen PDF dengan sections:
  // - Header: nama perusahaan, alamat, nomor telp
  // - Judul: "SURAT JALAN"
  // - Info: Nomor DO, Tanggal, Pelanggan, Alamat Kirim, Driver
  // - Tabel produk: Nama Produk, Ukuran, Jumlah Sak, Berat (kg), Batch Number
  // - Footer: Total berat, kolom tanda tangan pengirim + penerima
  ```
- [x] Buat `app/api/wms/delivery-orders/[id]/surat-jalan/route.ts`:
  - Fetch data DO + items + customer dari database
  - Render PDF menggunakan `renderToBuffer()` dari `@react-pdf/renderer`
  - Return response dengan header `Content-Type: application/pdf`

### 14.2 Integrasi

- [x] Tambahkan tombol "Download Surat Jalan" di halaman detail DO
- [x] Tombol membuka URL `/api/wms/delivery-orders/[id]/surat-jalan` di tab baru
- [x] Test: PDF bisa dibuka dan dicetak di browser

---

## PHASE 15 — Testing & Polish

### 15.1 Fungsional Testing (Manual)

Jalankan semua skenario berikut:

**Skenario 1: Alur Penuh Produksi**
- [ ] Login sebagai OPR_WHS → catat penerimaan padi baru (moistureContent 18%)
- [ ] Submit QC → diterima
- [ ] Login sebagai ADMIN → buat Work Order untuk lot tersebut
- [ ] Login sebagai OPR_PROD → submit log pengeringan (drying step)
- [ ] Submit log penggilingan → verifikasi husking yield terhitung
- [ ] Submit log penyosohan → verifikasi polishing yield terhitung
- [ ] Submit log sortasi → verifikasi grading decision & whole grain ratio
- [ ] Submit log pengemasan → verifikasi batch terbuat & WO selesai
- [ ] Login sebagai OPR_WHS → terima batch ke gudang, assign lokasi
- [ ] Verifikasi stok beras bertambah di dashboard

**Skenario 2: Pengiriman**
- [ ] Login sebagai ADMIN → buat Delivery Order ke pelanggan
- [ ] Verifikasi FIFO suggestion muncul
- [ ] Confirm DO → Picking → Ready → Ship
- [ ] Login sebagai DRIVER → konfirmasi terkirim
- [ ] Verifikasi stok beras berkurang

**Skenario 3: Edge Cases**
- [ ] Coba submit packaging saat step sortasi belum selesai → harus error
- [ ] Coba buat DO melebihi stok → harus error
- [ ] Coba akses halaman master data sebagai OPR_PROD → harus redirect/forbidden
- [ ] Submit husking log dengan yield <75% → alert harus muncul
- [ ] Submit padi dengan kadar air >14% → WO harus include step pengeringan

**Skenario 4: QC Padi Ditolak**
- [ ] Catat penerimaan padi dengan kotoran 8%
- [ ] Submit QC → ditolak
- [ ] Verifikasi stok gudang padi tidak bertambah
- [ ] Verifikasi lot status DITOLAK

### 15.2 UI Polish

- [ ] Cek semua halaman di mobile (375px) — tidak ada overflow horizontal
- [ ] Cek semua form bisa disubmit dari mobile (input cukup besar untuk tap)
- [ ] Verifikasi semua StatusBadge warnanya sesuai DOC-02 section 7.2
- [ ] Verifikasi sidebar mobile berfungsi (buka/tutup)
- [ ] Cek semua tabel punya loading skeleton saat fetch
- [ ] Cek semua tabel punya empty state jika data kosong
- [ ] Pastikan semua angka desimal ditampilkan dengan 2 desimal
- [ ] Pastikan semua tanggal ditampilkan dalam format Indonesia (dd MMM yyyy)
- [ ] Pastikan semua angka besar menggunakan separator ribuan (1.000, tidak 1000)

### 15.3 Error Handling

- [ ] Semua API route punya try-catch dan return error response yang jelas
- [ ] Semua halaman punya error boundary atau error state component
- [ ] Network error saat fetch → tampilkan ErrorState + tombol retry
- [ ] Form validation error → tampilkan pesan error di bawah field

### 15.4 Performance

- [ ] Pastikan query API tidak ada N+1 (gunakan Prisma `include` bukan loop query)
- [ ] Dashboard stats menggunakan `Promise.all()` untuk parallel query
- [ ] List halaman menggunakan pagination (default 20 item per halaman)
- [ ] Gambar (jika ada) di-optimize dengan `next/image`

---

## PHASE 16 — Deployment

### 16.1 Persiapan

- [ ] Pastikan semua `console.log()` debug sudah dihapus
- [ ] Buat `.env.example` dengan semua env vars yang diperlukan (tanpa value)
- [ ] Pastikan `prisma/seed.ts` berjalan sempurna: `npm run db:seed`
- [ ] Jalankan `npm run build` di lokal — tidak ada error TypeScript
- [ ] Jalankan `npm run lint` — tidak ada ESLint error
- [ ] Commit semua perubahan ke GitHub

### 16.2 Railway Setup

- [ ] Buat akun Railway di railway.app
- [ ] Buat project baru di Railway
- [ ] **Add service: PostgreSQL** (Railway managed database)
  - Copy `DATABASE_URL` yang di-generate Railway
- [ ] **Add service: GitHub Repo**
  - Connect ke repo GitHub
  - Railway auto-detect Next.js project
- [ ] **Set environment variables** di Railway service settings:
  - `DATABASE_URL` — dari PostgreSQL service
  - `NEXTAUTH_URL` — URL Railway yang di-generate (misal: `https://mes-wms-beras.railway.app`)
  - `NEXTAUTH_SECRET` — generate dengan `openssl rand -base64 32`
  - `NODE_ENV` — `production`

### 16.3 Deploy

- [ ] Tambahkan `railway.json` atau pastikan `package.json` punya script yang benar:
  ```json
  {
    "scripts": {
      "build": "prisma generate && prisma migrate deploy && next build",
      "start": "next start"
    }
  }
  ```
- [ ] Push ke GitHub → Railway auto-deploy
- [ ] Monitor deployment logs di Railway dashboard
- [ ] Setelah deploy sukses: jalankan seed di Railway shell:
  ```bash
  npm run db:seed
  ```
- [ ] Buka URL Railway → test login dengan user seed
- [ ] Test semua alur utama di production environment

### 16.4 Verifikasi Final

- [ ] Login berhasil di URL production
- [ ] Dashboard tampil dengan data seed
- [ ] Alur penerimaan padi berfungsi
- [ ] Alur WO + produksi berfungsi
- [ ] Surat jalan PDF bisa di-download
- [ ] Semua halaman responsif di mobile
- [ ] Tidak ada error 500 di production logs

---

## Ringkasan File yang Harus Dibuat

### API Routes (total ±45 files)
```
app/api/auth/[...nextauth]/route.ts
app/api/master-data/users/route.ts
app/api/master-data/users/[id]/route.ts
app/api/master-data/users/[id]/reset-password/route.ts
app/api/master-data/suppliers/route.ts
app/api/master-data/suppliers/[id]/route.ts
app/api/master-data/customers/route.ts
app/api/master-data/customers/[id]/route.ts
app/api/master-data/products/route.ts
app/api/master-data/products/[id]/route.ts
app/api/master-data/machines/route.ts
app/api/master-data/machines/[id]/route.ts
app/api/master-data/machines/[id]/status/route.ts
app/api/master-data/locations/route.ts
app/api/master-data/locations/[id]/route.ts
app/api/master-data/packaging-materials/route.ts
app/api/master-data/packaging-materials/[id]/route.ts
app/api/master-data/paddy-varieties/route.ts
app/api/wms/paddy-lots/route.ts
app/api/wms/paddy-lots/[id]/route.ts
app/api/wms/paddy-lots/[id]/qc/route.ts
app/api/wms/paddy-lots/[id]/history/route.ts
app/api/mes/work-orders/route.ts
app/api/mes/work-orders/[id]/route.ts
app/api/mes/work-orders/[id]/status/route.ts
app/api/mes/production-logs/route.ts
app/api/mes/production-logs/drying/route.ts
app/api/mes/production-logs/husking/route.ts
app/api/mes/production-logs/polishing/route.ts
app/api/mes/production-logs/sorting/route.ts
app/api/mes/production-logs/packaging/route.ts
app/api/mes/machine-logs/downtime/route.ts
app/api/mes/machine-logs/[machineId]/route.ts
app/api/wms/rice-stock/route.ts
app/api/wms/rice-stock/summary/route.ts
app/api/wms/rice-stock/inbound/route.ts
app/api/wms/rice-stock/stock-opname/route.ts
app/api/wms/rice-stock/stock-opname/[id]/route.ts
app/api/wms/rice-stock/stock-opname/[id]/approve/route.ts
app/api/wms/delivery-orders/route.ts
app/api/wms/delivery-orders/[id]/route.ts
app/api/wms/delivery-orders/[id]/confirm/route.ts
app/api/wms/delivery-orders/[id]/ready/route.ts
app/api/wms/delivery-orders/[id]/ship/route.ts
app/api/wms/delivery-orders/[id]/delivered/route.ts
app/api/wms/delivery-orders/[id]/return/route.ts
app/api/wms/delivery-orders/[id]/surat-jalan/route.ts
app/api/reports/dashboard-stats/route.ts
app/api/reports/production/route.ts
app/api/reports/machine-oee/route.ts
app/api/reports/inventory/route.ts
app/api/reports/delivery/route.ts
app/api/reports/supplier-quality/route.ts
app/api/alerts/route.ts
app/api/alerts/[id]/dismiss/route.ts
app/api/alerts/check/route.ts
```

### Pages (total ±40 files)
```
app/(auth)/layout.tsx
app/(auth)/login/page.tsx
app/(dashboard)/layout.tsx
app/(dashboard)/page.tsx
app/(dashboard)/master-data/users/page.tsx
app/(dashboard)/master-data/users/create/page.tsx
app/(dashboard)/master-data/users/[id]/page.tsx
app/(dashboard)/master-data/suppliers/page.tsx
app/(dashboard)/master-data/suppliers/create/page.tsx
app/(dashboard)/master-data/suppliers/[id]/page.tsx
app/(dashboard)/master-data/customers/page.tsx
app/(dashboard)/master-data/customers/create/page.tsx
app/(dashboard)/master-data/customers/[id]/page.tsx
app/(dashboard)/master-data/products/page.tsx
app/(dashboard)/master-data/products/create/page.tsx
app/(dashboard)/master-data/products/[id]/page.tsx
app/(dashboard)/master-data/machines/page.tsx
app/(dashboard)/master-data/machines/create/page.tsx
app/(dashboard)/master-data/machines/[id]/page.tsx
app/(dashboard)/master-data/locations/page.tsx
app/(dashboard)/master-data/locations/create/page.tsx
app/(dashboard)/master-data/locations/[id]/page.tsx
app/(dashboard)/master-data/packaging-materials/page.tsx
app/(dashboard)/master-data/packaging-materials/create/page.tsx
app/(dashboard)/master-data/packaging-materials/[id]/page.tsx
app/(dashboard)/wms/paddy-warehouse/page.tsx
app/(dashboard)/wms/paddy-warehouse/incoming/page.tsx
app/(dashboard)/wms/paddy-warehouse/[id]/page.tsx
app/(dashboard)/wms/rice-warehouse/page.tsx
app/(dashboard)/wms/rice-warehouse/inbound/page.tsx
app/(dashboard)/wms/rice-warehouse/stock-opname/page.tsx
app/(dashboard)/wms/rice-warehouse/stock-opname/create/page.tsx
app/(dashboard)/wms/delivery/page.tsx
app/(dashboard)/wms/delivery/create/page.tsx
app/(dashboard)/wms/delivery/[id]/page.tsx
app/(dashboard)/wms/delivery/driver/page.tsx
app/(dashboard)/mes/work-orders/page.tsx
app/(dashboard)/mes/work-orders/create/page.tsx
app/(dashboard)/mes/work-orders/[id]/page.tsx
app/(dashboard)/mes/machines/page.tsx
app/(dashboard)/qc/incoming/page.tsx
app/(dashboard)/qc/incoming/[lotId]/page.tsx
app/(dashboard)/reports/yield/page.tsx
app/(dashboard)/reports/production/page.tsx
app/(dashboard)/reports/inventory/page.tsx
app/(dashboard)/reports/delivery/page.tsx
```

---

## Catatan Penting untuk AI Developer

1. **Jangan skip phase** — setiap phase bergantung pada phase sebelumnya. Phase 2 (database) harus selesai sebelum apapun.

2. **Selalu gunakan `prisma.$transaction()`** untuk operasi yang mengubah lebih dari satu tabel. Lihat contoh di masing-masing API route description.

3. **Semua Prisma Decimal** dikembalikan sebagai `Prisma.Decimal` object — selalu konversi dengan `Number()` sebelum kalkulasi atau display.

4. **Role check wajib di setiap API route** menggunakan `requireAuth()` helper. Jangan lupa sertakan array role yang diizinkan.

5. **Konsultasi DOC-01** jika ada keraguan tentang logika bisnis (threshold, formula, aturan).

6. **Konsultasi DOC-03** untuk struktur database sebelum menulis query Prisma.

7. **Urutan seed wajib diikuti** untuk menghindari foreign key constraint error.

8. **Gunakan `upsert` bukan `create`** di seed file agar idempotent.

9. **Format number untuk display** — semua angka kg/sak gunakan `toLocaleString('id-ID')`, semua persentase gunakan `.toFixed(2) + '%'`.

10. **Jika ada fitur yang tidak jelas**, kembali ke DOC-01 (Business Process) sebagai sumber kebenaran utama.

---

*Versi: 1.0 | Ini adalah dokumen terakhir dari seri DOC-01 s/d DOC-04*
*Total: 4 dokumen, siap digunakan sebagai brief lengkap untuk AI developer.*
