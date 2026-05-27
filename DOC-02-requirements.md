# DOC-02 — Requirements Document
## Sistem MES + WMS Pabrik Penggilingan Padi
### PT. Beras Nusantara

---

> **Prasyarat:** Baca DOC-01 (Business Process) terlebih dahulu sebelum dokumen ini.
> Dokumen ini mendefinisikan **apa yang harus dibangun** — modul, fitur, user stories, dan API.
> Detail teknis (schema, ERD, arsitektur) ada di DOC-03.

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Struktur Aplikasi](#2-struktur-aplikasi)
3. [Modul & Fitur](#3-modul--fitur)
   - 3.1 [Authentication & User Management](#31-authentication--user-management)
   - 3.2 [Dashboard](#32-dashboard)
   - 3.3 [Master Data](#33-master-data)
   - 3.4 [WMS — Gudang Padi (Raw Material)](#34-wms--gudang-padi-raw-material)
   - 3.5 [MES — Work Order Management](#35-mes--work-order-management)
   - 3.6 [MES — Proses Produksi](#36-mes--proses-produksi)
   - 3.7 [MES — Quality Control](#37-mes--quality-control)
   - 3.8 [WMS — Gudang Beras (Finished Goods)](#38-wms--gudang-beras-finished-goods)
   - 3.9 [WMS — Pengiriman (Outbound)](#39-wms--pengiriman-outbound)
   - 3.10 [Laporan & Analytics](#310-laporan--analytics)
   - 3.11 [Notifikasi & Alert](#311-notifikasi--alert)
4. [User Stories](#4-user-stories)
5. [API Specification](#5-api-specification)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [UI/UX Requirements](#7-uiux-requirements)

---

## 1. Tech Stack

### 1.1 Stack yang Digunakan

| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| **Framework** | Next.js | 14.x (App Router) | Fullstack, SSR, routing built-in |
| **Language** | TypeScript | 5.x | Type safety end-to-end |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **UI Components** | shadcn/ui | latest | Komponen siap pakai, accessible |
| **Database** | PostgreSQL | 15.x | Relational DB |
| **ORM** | Prisma | 5.x | Schema management, migrations, type-safe queries |
| **Authentication** | NextAuth.js | 4.x | JWT, role-based, session management |
| **Charts** | Recharts | 2.x | Dashboard charts dan KPI visual |
| **Form Handling** | React Hook Form + Zod | latest | Validasi form + schema validation |
| **State Management** | Zustand | 4.x | Global state ringan |
| **Data Fetching** | TanStack Query (React Query) | 5.x | Server state, caching, refetch |
| **Date Handling** | date-fns | 3.x | Manipulasi tanggal |
| **PDF Generation** | @react-pdf/renderer | latest | Generate surat jalan PDF |
| **Icons** | Lucide React | latest | Icon set konsisten |
| **Deployment** | Railway | - | PostgreSQL + Next.js, free tier |
| **Version Control** | Git + GitHub | - | Source code management |

### 1.2 Struktur Folder

```
mes-wms-beras/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + header layout
│   │   ├── page.tsx              # Dashboard utama
│   │   ├── master-data/
│   │   │   ├── products/
│   │   │   ├── suppliers/
│   │   │   ├── customers/
│   │   │   ├── machines/
│   │   │   ├── locations/
│   │   │   └── packaging-materials/
│   │   ├── wms/
│   │   │   ├── paddy-warehouse/  # Gudang padi (RM)
│   │   │   │   ├── page.tsx      # Stok & lot list
│   │   │   │   ├── incoming/     # Penerimaan padi
│   │   │   │   └── [lotId]/      # Detail lot
│   │   │   ├── rice-warehouse/   # Gudang beras (FG)
│   │   │   │   ├── page.tsx      # Stok & batch list
│   │   │   │   ├── inbound/      # Penerimaan dari produksi
│   │   │   │   └── stock-opname/ # Stock opname
│   │   │   └── delivery/         # Pengiriman
│   │   │       ├── page.tsx      # Daftar DO
│   │   │       ├── create/
│   │   │       └── [doId]/
│   │   ├── mes/
│   │   │   ├── work-orders/
│   │   │   │   ├── page.tsx      # Daftar WO
│   │   │   │   ├── create/
│   │   │   │   └── [woId]/       # Detail + proses produksi
│   │   │   ├── production/
│   │   │   │   ├── drying/       # Log pengeringan
│   │   │   │   ├── husking/      # Log penggilingan
│   │   │   │   ├── polishing/    # Log penyosohan
│   │   │   │   ├── sorting/      # Log sortasi & grading
│   │   │   │   └── packaging/    # Log pengemasan
│   │   │   └── machines/         # Status & downtime mesin
│   │   ├── qc/
│   │   │   ├── incoming/         # QC padi masuk
│   │   │   └── production/       # QC in-process
│   │   └── reports/
│   │       ├── yield/
│   │       ├── production/
│   │       ├── inventory/
│   │       └── delivery/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── master-data/
│       │   ├── products/
│       │   ├── suppliers/
│       │   ├── customers/
│       │   ├── machines/
│       │   ├── locations/
│       │   └── packaging-materials/
│       ├── wms/
│       │   ├── paddy-lots/
│       │   ├── rice-stock/
│       │   ├── inbound/
│       │   ├── stock-opname/
│       │   └── delivery-orders/
│       ├── mes/
│       │   ├── work-orders/
│       │   ├── production-logs/
│       │   └── machine-logs/
│       ├── qc/
│       └── reports/
├── components/
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── dashboard/
│   │   ├── StockSummaryCard.tsx
│   │   ├── ProductionChart.tsx
│   │   ├── YieldGaugeChart.tsx
│   │   └── ActiveWorkOrderList.tsx
│   ├── wms/
│   │   ├── PaddyLotTable.tsx
│   │   ├── IncomingForm.tsx
│   │   ├── RiceStockTable.tsx
│   │   ├── DeliveryOrderForm.tsx
│   │   └── SuratJalanPDF.tsx
│   ├── mes/
│   │   ├── WorkOrderForm.tsx
│   │   ├── WorkOrderTimeline.tsx
│   │   ├── ProductionStepForm.tsx
│   │   └── MachineStatusCard.tsx
│   ├── qc/
│   │   ├── IncomingQCForm.tsx
│   │   └── GradingReportCard.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── DataTable.tsx
│       ├── AlertBanner.tsx
│       ├── ConfirmDialog.tsx
│       └── PageHeader.tsx
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── validations/              # Zod schemas
│   │   ├── work-order.ts
│   │   ├── paddy-lot.ts
│   │   ├── delivery-order.ts
│   │   └── ...
│   ├── utils/
│   │   ├── yield-calculator.ts   # Kalkulasi yield & rendemen
│   │   ├── lot-number.ts         # Generate lot number
│   │   ├── batch-number.ts       # Generate batch number
│   │   ├── date.ts               # Date utilities
│   │   └── cn.ts                 # className utility
│   └── constants/
│       ├── status.ts             # Semua enum status
│       └── thresholds.ts         # Nilai threshold (min stok, yield, dll)
├── hooks/
│   ├── useWorkOrders.ts
│   ├── usePaddyStock.ts
│   ├── useRiceStock.ts
│   ├── useAlerts.ts
│   └── useMachineStatus.ts
├── store/
│   └── alertStore.ts             # Zustand store untuk alerts
├── types/
│   └── index.ts                  # Global TypeScript types
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   └── logo.png
├── .env.local                    # Environment variables (tidak di-commit)
├── .env.example                  # Template env vars
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 2. Struktur Aplikasi

### 2.1 Environment Variables

```env
# .env.example
DATABASE_URL="postgresql://user:password@host:5432/beras_nusantara"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
```

### 2.2 Navigation Sidebar

```
🏠 Dashboard
──────────────
📦 WMS
  └── Gudang Padi (RM)
      ├── Stok & Lot
      └── Penerimaan Padi
  └── Gudang Beras (FG)
      ├── Stok Beras
      ├── Penerimaan dari Produksi
      └── Stock Opname
  └── Pengiriman
      ├── Delivery Order
      └── Surat Jalan
──────────────
⚙️  MES
  └── Work Order
  └── Proses Produksi
      ├── Pengeringan
      ├── Penggilingan
      ├── Penyosohan
      ├── Sortasi & Grading
      └── Pengemasan
  └── Status Mesin
──────────────
🔍 QC
  └── QC Penerimaan Padi
  └── QC Produksi
──────────────
📊 Laporan
  └── Laporan Produksi & Yield
  └── Laporan Inventaris
  └── Laporan Pengiriman
──────────────
⚙️  Master Data (ADMIN only)
  └── Produk
  └── Supplier
  └── Pelanggan
  └── Mesin
  └── Lokasi Gudang
  └── Packaging Material
  └── User Management
```

---

## 3. Modul & Fitur

---

### 3.1 Authentication & User Management

#### Fitur
- Login dengan email & password
- Session management dengan JWT (NextAuth.js)
- Role-based access control (RBAC): `ADMIN`, `OPR_PROD`, `OPR_WHS`, `DRIVER`
- Halaman login dengan redirect ke dashboard setelah login
- Logout
- Proteksi route: semua halaman di `(dashboard)` wajib login
- ADMIN dapat membuat, mengedit, menonaktifkan user
- User tidak bisa mengganti role sendiri

#### Halaman
- `/login` — Form login (email + password)
- `/master-data/users` — Daftar user (ADMIN only)
- `/master-data/users/create` — Form tambah user (ADMIN only)
- `/master-data/users/[id]` — Edit user (ADMIN only)

---

### 3.2 Dashboard

#### Fitur
Dashboard menampilkan ringkasan real-time kondisi pabrik. Semua data di dashboard di-refresh otomatis setiap 5 menit.

**Kartu Statistik (Stats Cards) — baris atas:**
- Total stok padi di gudang RM (kg)
- Total stok beras per produk (sak / kg) — 3 kartu untuk 3 produk
- Work Order aktif (jumlah)
- Pengiriman pending (jumlah DO belum terkirim)

**Grafik Produksi (7 hari terakhir):**
- Bar chart: padi masuk vs beras jadi per hari
- Line chart: overall milling yield (%) per hari

**Tabel Work Order Aktif:**
- Kolom: WO Number, Produk Target, Status, Progress, Start Date
- Klik → masuk ke detail WO

**Tabel Alert / Notifikasi:**
- List alert terbaru (stok rendah, kadaluarsa dekat, yield rendah)

**Kartu Status Mesin:**
- Grid kartu per mesin, tampilkan status: RUNNING / IDLE / BREAKDOWN (warna hijau/abu/merah)

#### Halaman
- `/` — Dashboard utama

---

### 3.3 Master Data

Semua halaman master data hanya bisa diakses oleh `ADMIN`. Setiap halaman memiliki fitur: tampil list, tambah, edit, (non-aktifkan — tidak boleh hapus jika sudah ada transaksi).

#### 3.3.1 Produk
Fields: SKU, nama, deskripsi, jenis (PREMIUM/MEDIUM/PATAH/BY_PRODUCT), packaging variants (array ukuran kemasan), harga jual, minimum stok, status (ACTIVE/INACTIVE).

#### 3.3.2 Supplier
Fields: kode supplier, nama, alamat, kota, provinsi, nomor telepon, email, wilayah asal padi, status (ACTIVE/INACTIVE).

#### 3.3.3 Pelanggan
Fields: kode pelanggan, nama, tipe (TOKO/DISTRIBUTOR/SUPERMARKET/HORECA/KOPERASI), alamat pengiriman, kota, nomor telepon, status (ACTIVE/INACTIVE).

#### 3.3.4 Mesin
Fields: kode mesin, nama, tipe (DRYER/HUSKER/POLISHER/COLOR_SORTER/CLASSIFIER/PACKER), kapasitas (kg/batch atau kg/jam), tanggal pembelian, tanggal maintenance terakhir, tanggal maintenance berikutnya, status (ACTIVE/MAINTENANCE/INACTIVE).

#### 3.3.5 Lokasi Gudang
Fields: kode lokasi, nama, tipe gudang (RAW_MATERIAL/FINISHED_GOODS/QUARANTINE), kapasitas (sak), status (KOSONG/TERISI/RESERVED).

#### 3.3.6 Packaging Material
Fields: kode material, nama, satuan, stok saat ini, minimum stok, status.

#### 3.3.7 User Management
Fields: nama, email, role, status (ACTIVE/INACTIVE). Password di-reset oleh admin.

---

### 3.4 WMS — Gudang Padi (Raw Material)

#### 3.4.1 Halaman Stok & Lot Padi
- Tabel semua lot padi dengan kolom: Lot Number, Supplier, Varietas, Berat (kg), Kadar Air, Status, Tanggal Masuk
- Filter by: status, varietas, supplier, tanggal
- Search by: lot number, nama supplier
- Klik baris → detail lot

#### 3.4.2 Form Penerimaan Padi (Incoming)
Fields yang wajib diisi Operator Gudang:
- Supplier (dropdown dari master data)
- Varietas padi (dropdown dari master data)
- Berat kotor (kg) — input manual dari timbangan
- Berat karung (kg) — input estimasi
- Kadar air awal (%) — hasil moisture meter
- Estimasi kotoran (%) — visual check
- Catatan (opsional)

Setelah submit:
- Sistem generate Lot Number otomatis (format: `LOT-YYYYMMDD-XXX`)
- Status awal: `MENUNGGU_QC`
- Redirect ke halaman QC Penerimaan untuk lot tersebut

#### 3.4.3 QC Penerimaan (Incoming QC)
- Diakses dari halaman penerimaan atau menu QC
- Fields: kadar air (%), kotoran (%), warna/aroma (NORMAL/ABNORMAL), catatan, keputusan (DITERIMA/DITOLAK), alasan penolakan (jika ditolak)
- Jika DITERIMA → stok gudang RM bertambah, status lot → `ANTRIAN_GILING`
- Jika DITOLAK → status lot → `DITOLAK`, stok tidak bertambah

#### 3.4.4 Detail Lot
- Info lengkap lot
- Riwayat pergerakan (incoming → issued to WO → selesai)
- Status saat ini

---

### 3.5 MES — Work Order Management

#### 3.5.1 Halaman Daftar Work Order
- Tabel WO dengan kolom: WO Number, Lot Padi, Target Produk, Target Output (kg), Status, Progress, Tanggal Dibuat, Deadline
- Filter by: status, tanggal
- Button "Buat Work Order" (ADMIN only)

#### 3.5.2 Form Buat Work Order
Fields (ADMIN):
- Lot padi (dropdown — hanya lot dengan status `ANTRIAN_GILING`)
- Target produk utama (PREMIUM/MEDIUM/PATAH — bisa multi-select)
- Estimasi output (kg) — auto-kalkulasi dari berat lot × expected yield, tapi bisa di-edit
- Deadline (date picker)
- Catatan (opsional)

Setelah submit:
- WO Number di-generate otomatis (format: `WO-YYYYMMDD-XXX`)
- Status: `DRAFT`
- Lot padi ter-reserved untuk WO ini

#### 3.5.3 Detail & Timeline Work Order
Halaman ini adalah pusat pengerjaan WO. Tampilkan:
- Info WO (nomor, lot, target, deadline, status)
- **Timeline Steps** — visual progress bar dengan step:
  1. Pengeringan (jika kadar air >14%)
  2. Penggilingan (Husking)
  3. Penyosohan (Polishing)
  4. Sortasi & Grading
  5. Pengemasan (Packaging)
- Setiap step bisa di-expand untuk melihat log / form input
- Button "Mulai" hanya aktif jika step sebelumnya selesai
- Status WO: `DRAFT` → `IN_PROGRESS` → `SELESAI` → `CANCELLED`

---

### 3.6 MES — Proses Produksi

Setiap tahap produksi diakses dari halaman Detail Work Order. Setiap log produksi terikat ke Work Order.

#### 3.6.1 Log Pengeringan (Drying)
Form input Operator Produksi:
- Mesin (DRYER-01)
- Berat input (kg) — auto-fill dari berat lot
- Waktu mulai (datetime)
- Suhu dryer (°C)
- Waktu selesai (datetime)
- Kadar air akhir (%)
- Berat setelah kering (kg)
- Catatan

Setelah submit:
- Sistem hitung drying loss = berat input - berat output
- Sistem catat log mesin (jam operasi bertambah)
- Jika kadar air akhir >14% → tampilkan warning, bisa input siklus ke-2
- Step status → `SELESAI`

#### 3.6.2 Log Penggilingan / Husking
Form input Operator Produksi:
- Mesin (HUSKER-01 atau HUSKER-02)
- Berat input padi (kg)
- Waktu mulai & selesai
- Berat beras pecah kulit output (kg)
- Berat sekam output (kg)
- Catatan downtime (jika ada)

Setelah submit:
- Sistem hitung husking yield = beras pecah kulit / padi input × 100%
- Jika husking yield <75% → tampilkan warning merah, require catatan
- Stok by-product sekam bertambah
- Step status → `SELESAI`

#### 3.6.3 Log Penyosohan / Polishing
Form input Operator Produksi:
- Mesin (POLISHER-01 atau POLISHER-02)
- Berat input beras pecah kulit (kg)
- Setting sosoh (TINGGI / SEDANG)
- Waktu mulai & selesai
- Berat beras putih output (kg)
- Berat bekatul output (kg)
- Catatan

Setelah submit:
- Sistem hitung polishing yield
- Stok by-product bekatul bertambah
- Step status → `SELESAI`

#### 3.6.4 Log Sortasi & Grading
Form input Operator Produksi:
- Mesin (COLOR_SORTER-01, CLASSIFIER-01)
- Berat input beras putih (kg)
- Waktu mulai & selesai
- Output beras utuh (kg)
- Output beras patah ½ (kg)
- Output beras patah ¼ / menir (kg)
- Output rejected grain (kg)
- Keputusan grading (ADMIN atau OPR_PROD): produk yang dihasilkan

Setelah submit:
- Sistem hitung distribusi output dan whole grain ratio
- Sistem validasi: sum of outputs ≤ input (ada toleransi ±0.5%)
- Step status → `SELESAI`

#### 3.6.5 Log Pengemasan (Packaging)
Form input Operator Produksi:
- Untuk setiap produk dan ukuran kemasan:
  - Jumlah sak yang dikemas
  - Packaging material yang digunakan (dropdown) + jumlah
- Batch Number di-generate otomatis
- Tanggal produksi (auto: hari ini)
- Tanggal kadaluarsa (auto: +6 bulan)
- Berat per kemasan (kg) — untuk validasi
- Catatan (opsional)

Setelah submit:
- Stok packaging material berkurang
- Produk jadi (finished goods) dengan batch number di-generate
- WO status → `SELESAI`
- Step status → `SELESAI`
- Notifikasi ke Operator Gudang: produk siap dipindah ke gudang FG

#### 3.6.6 Downtime Mesin
Form bisa diisi kapan saja (dari menu Status Mesin):
- Mesin
- Waktu mulai downtime
- Waktu selesai downtime
- Alasan (BREAKDOWN / MAINTENANCE / SETUP / LAINNYA)
- Catatan
Downtime terintegrasi ke perhitungan OEE mesin.

---

### 3.7 MES — Quality Control

#### 3.7.1 QC Penerimaan Padi
Sudah dijelaskan di 3.4.3.

#### 3.7.2 QC Grading (Hasil Sortasi)
Setelah log sortasi disubmit, sistem otomatis menentukan kualitas grade berdasarkan business rules dari DOC-01 section 5.5. ADMIN bisa override keputusan grading dengan alasan.

#### 3.7.3 Halaman Riwayat QC
- Tabel semua record QC (incoming + grading)
- Filter by: tanggal, tipe QC, hasil (LULUS/GAGAL)
- Statistik: pass rate per bulan

---

### 3.8 WMS — Gudang Beras (Finished Goods)

#### 3.8.1 Halaman Stok Beras
- Summary cards: total stok per produk (sak & kg)
- Tabel detail stok per batch: Batch Number, Produk, Ukuran, Jumlah Sak, Lokasi, Tanggal Produksi, Tanggal Kadaluarsa, Status
- Alert banner jika ada stok mendekati kadaluarsa (<30 hari)
- Filter by: produk, lokasi, tanggal

#### 3.8.2 Form Penerimaan dari Produksi (Inbound FG)
Diisi oleh Operator Gudang setelah menerima produk dari area produksi:
- Pilih batch yang ingin dipindahkan (dari list produk jadi belum masuk gudang)
- Assign lokasi penyimpanan (dropdown dari lokasi tersedia)
- Konfirmasi jumlah (verifikasi fisik vs sistem)
- Kondisi (NORMAL / ADA_KERUSAKAN_KEMASAN)
- Catatan (opsional)

#### 3.8.3 Stock Opname
- Operator Gudang input jumlah fisik per batch per lokasi
- Sistem tampilkan selisih (variance): sistem vs fisik
- ADMIN approve atau reject penyesuaian
- Riwayat stock opname tersimpan

---

### 3.9 WMS — Pengiriman (Outbound)

#### 3.9.1 Halaman Delivery Order
- Tabel semua DO: DO Number, Pelanggan, Tanggal Pengiriman, Total Item, Status
- Filter by: status, tanggal, pelanggan
- Button "Buat Delivery Order" (ADMIN / OPR_WHS)

#### 3.9.2 Form Buat Delivery Order
Fields:
- Pelanggan (dropdown)
- Tanggal pengiriman (date picker)
- Supir (dropdown dari user dengan role DRIVER)
- Items:
  - Produk (dropdown SKU)
  - Ukuran kemasan
  - Jumlah sak
  - Sistem auto-suggest batch berdasarkan FIFO
  - Operator bisa override pilihan batch
- Catatan

Validasi:
- Stok tersedia harus mencukupi
- Otomatis reserved stok setelah DO confirmed

#### 3.9.3 Detail Delivery Order
- Info DO lengkap
- Timeline status
- Daftar item yang akan dikirim (dengan lokasi dan batch)
- Button "Generate Surat Jalan" (PDF)
- Button "Konfirmasi Terkirim" (untuk DRIVER)
- Form retur (jika ada)

#### 3.9.4 Surat Jalan (PDF)
Generate PDF berisi:
- Header: logo, nama perusahaan, judul "SURAT JALAN"
- Nomor DO, tanggal, nama pelanggan, alamat pengiriman
- Tabel produk: nama, ukuran, jumlah sak, berat total, batch number
- Total berat keseluruhan
- Kolom tanda tangan: pengirim, penerima

#### 3.9.5 Konfirmasi Pengiriman (DRIVER)
- DRIVER lihat daftar DO yang di-assign
- Setelah sampai → klik "Konfirmasi Terkirim"
- Input: tanggal & waktu tiba, foto tanda terima (opsional), catatan
- Jika ada retur: input item dan jumlah yang diretur, alasan retur

---

### 3.10 Laporan & Analytics

Semua laporan bisa difilter by tanggal (range) dan di-export ke CSV.

#### 3.10.1 Laporan Produksi & Yield
- Tabel Work Order selesai per periode
- Per WO: lot padi, berat input, berat output per produk, yield breakdown (husking/polishing/overall)
- Summary: rata-rata yield, total produksi, best/worst WO
- Chart: trend yield per minggu/bulan

#### 3.10.2 Laporan Mesin & OEE
- Per mesin, per periode:
  - Total jam operasi
  - Total jam downtime
  - OEE = Availability × Performance × Quality
  - Riwayat downtime

#### 3.10.3 Laporan Inventaris
- Pergerakan stok padi: masuk, keluar, saldo per hari/minggu
- Pergerakan stok beras: masuk, keluar, saldo per hari/minggu
- Stok saat ini vs minimum stok

#### 3.10.4 Laporan Pengiriman
- Semua DO per periode: pelanggan, produk, jumlah, nilai
- Delivery performance: on-time vs late
- Riwayat retur

#### 3.10.5 Laporan Supplier
- Per supplier: jumlah lot dikirim, persentase diterima/ditolak, rata-rata kadar air, rata-rata yield dari padi supplier tersebut

---

### 3.11 Notifikasi & Alert

Alert ditampilkan di dashboard dan bisa di-dismiss. Alert types:

| Kode Alert | Trigger | Target User |
|---|---|---|
| STOK_PADI_RENDAH | Stok padi < 5.000 kg | ADMIN |
| STOK_BERAS_RENDAH | Stok beras SKU apapun < minimum stok | ADMIN |
| KADALUARSA_DEKAT | Ada batch dengan sisa <30 hari | ADMIN, OPR_WHS |
| YIELD_RENDAH | Overall yield WO <58% | ADMIN |
| HUSKING_YIELD_RENDAH | Husking yield <75% | ADMIN, OPR_PROD |
| MESIN_MAINTENANCE | Tanggal maintenance mesin sudah lewat | ADMIN |
| PADI_TERLAMA | Lot padi >7 hari belum digiling | ADMIN |
| DO_BELUM_KONFIRMASI | DO sudah >24 jam status SHIPPED belum DELIVERED | ADMIN, OPR_WHS |

---

## 4. User Stories

Format: `Sebagai [role], saya ingin [aksi], sehingga [manfaat].`

### Operator Gudang (OPR_WHS)
1. Sebagai Operator Gudang, saya ingin mencatat penerimaan padi dari supplier dengan semua detailnya, sehingga stok padi di sistem selalu akurat.
2. Sebagai Operator Gudang, saya ingin melihat semua lot padi beserta statusnya, sehingga saya tahu padi mana yang perlu segera digiling.
3. Sebagai Operator Gudang, saya ingin menerima notifikasi saat produk jadi keluar dari produksi, sehingga saya bisa langsung memindahkannya ke gudang.
4. Sebagai Operator Gudang, saya ingin sistem merekomendasikan batch mana yang harus dikirim duluan (FIFO), sehingga tidak ada produk yang kadaluarsa sebelum dijual.
5. Sebagai Operator Gudang, saya ingin melakukan stock opname dan melihat selisih dengan sistem, sehingga stok selalu akurat.
6. Sebagai Operator Gudang, saya ingin membuat Delivery Order dan generate surat jalan, sehingga pengiriman terdokumentasi dengan baik.

### Operator Produksi (OPR_PROD)
7. Sebagai Operator Produksi, saya ingin melihat Work Order aktif yang perlu dikerjakan, sehingga saya tahu apa yang harus dilakukan hari ini.
8. Sebagai Operator Produksi, saya ingin mencatat setiap tahap produksi (drying, husking, dll) dengan mudah dari halaman WO, sehingga data produksi selalu terupdate.
9. Sebagai Operator Produksi, saya ingin melihat apakah yield saya di bawah target, sehingga saya bisa segera lapor ke manager.
10. Sebagai Operator Produksi, saya ingin mencatat downtime mesin dengan alasannya, sehingga maintenance bisa direncanakan dengan baik.

### Admin / Manager (ADMIN)
11. Sebagai Admin, saya ingin melihat dashboard yang menampilkan kondisi pabrik secara real-time, sehingga saya bisa membuat keputusan cepat.
12. Sebagai Admin, saya ingin membuat Work Order dan assign ke lot padi tertentu, sehingga produksi terencana dengan baik.
13. Sebagai Admin, saya ingin melihat laporan yield per Work Order, sehingga saya bisa evaluasi performa mesin dan operator.
14. Sebagai Admin, saya ingin mendapat alert jika stok beras mendekati minimum, sehingga saya bisa segera jadwalkan produksi tambahan.
15. Sebagai Admin, saya ingin melihat performa supplier (yield dari padi mereka), sehingga saya bisa memilih supplier yang kualitasnya konsisten.
16. Sebagai Admin, saya ingin mengelola semua master data (produk, supplier, mesin, dll), sehingga data referensi di sistem selalu akurat.

### Supir / Pengiriman (DRIVER)
17. Sebagai Supir, saya ingin melihat daftar DO yang perlu saya antar, sehingga saya tahu jadwal pengiriman hari ini.
18. Sebagai Supir, saya ingin mengkonfirmasi pengiriman setelah barang diterima pelanggan, sehingga status DO terupdate secara real-time.
19. Sebagai Supir, saya ingin mencatat retur jika pelanggan menolak sebagian produk, sehingga ada record yang jelas untuk proses klaim.

---

## 5. API Specification

Semua endpoint berada di `/api/`. Response format JSON. Auth menggunakan session cookie dari NextAuth.

### Konvensi Response

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Pagination (untuk list):**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### 5.1 Auth

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/auth/signin` | Login (NextAuth) | Public |
| POST | `/api/auth/signout` | Logout (NextAuth) | All |
| GET | `/api/auth/session` | Get session user | All |

---

### 5.2 Master Data — Users

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/master-data/users` | List semua user | ADMIN |
| POST | `/api/master-data/users` | Buat user baru | ADMIN |
| GET | `/api/master-data/users/[id]` | Detail user | ADMIN |
| PATCH | `/api/master-data/users/[id]` | Edit user | ADMIN |
| PATCH | `/api/master-data/users/[id]/reset-password` | Reset password | ADMIN |

---

### 5.3 Master Data — Suppliers

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/master-data/suppliers` | List supplier | ADMIN |
| POST | `/api/master-data/suppliers` | Buat supplier | ADMIN |
| GET | `/api/master-data/suppliers/[id]` | Detail supplier | ADMIN |
| PATCH | `/api/master-data/suppliers/[id]` | Edit supplier | ADMIN |

---

### 5.4 Master Data — Customers

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/master-data/customers` | List pelanggan | ADMIN |
| POST | `/api/master-data/customers` | Buat pelanggan | ADMIN |
| GET | `/api/master-data/customers/[id]` | Detail pelanggan | ADMIN |
| PATCH | `/api/master-data/customers/[id]` | Edit pelanggan | ADMIN |

---

### 5.5 Master Data — Machines

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/master-data/machines` | List mesin + status | All |
| POST | `/api/master-data/machines` | Tambah mesin | ADMIN |
| PATCH | `/api/master-data/machines/[id]` | Edit mesin | ADMIN |
| PATCH | `/api/master-data/machines/[id]/status` | Update status mesin | ADMIN, OPR_PROD |

---

### 5.6 Master Data — Locations

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/master-data/locations` | List lokasi gudang | All |
| GET | `/api/master-data/locations?type=FINISHED_GOODS&status=KOSONG` | Lokasi FG yang kosong | OPR_WHS |
| POST | `/api/master-data/locations` | Tambah lokasi | ADMIN |
| PATCH | `/api/master-data/locations/[id]` | Edit lokasi | ADMIN |

---

### 5.7 WMS — Paddy Lots (Gudang Padi)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/wms/paddy-lots` | List semua lot padi | ADMIN, OPR_WHS |
| GET | `/api/wms/paddy-lots?status=ANTRIAN_GILING` | Lot siap giling | All |
| POST | `/api/wms/paddy-lots` | Catat penerimaan padi baru | OPR_WHS, ADMIN |
| GET | `/api/wms/paddy-lots/[id]` | Detail lot | All |
| POST | `/api/wms/paddy-lots/[id]/qc` | Submit hasil QC | OPR_WHS, ADMIN |
| GET | `/api/wms/paddy-lots/[id]/history` | Riwayat pergerakan lot | All |

**POST /api/wms/paddy-lots — Request Body:**
```json
{
  "supplierId": "string",
  "varietyCode": "string",
  "grossWeight": 5000,
  "sackWeight": 100,
  "moistureContent": 18.5,
  "dirtPercentage": 2.0,
  "notes": "string (optional)"
}
```

---

### 5.8 MES — Work Orders

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/mes/work-orders` | List semua WO | All |
| POST | `/api/mes/work-orders` | Buat WO baru | ADMIN |
| GET | `/api/mes/work-orders/[id]` | Detail WO + steps | All |
| PATCH | `/api/mes/work-orders/[id]/status` | Update status WO | ADMIN |
| DELETE | `/api/mes/work-orders/[id]` | Cancel WO (hanya DRAFT) | ADMIN |

**POST /api/mes/work-orders — Request Body:**
```json
{
  "paddyLotId": "string",
  "targetProducts": ["PREMIUM", "MEDIUM"],
  "estimatedOutput": 3100,
  "deadline": "2024-01-15T00:00:00Z",
  "notes": "string (optional)"
}
```

---

### 5.9 MES — Production Logs

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/mes/production-logs/drying` | Submit log pengeringan | OPR_PROD, ADMIN |
| POST | `/api/mes/production-logs/husking` | Submit log penggilingan | OPR_PROD, ADMIN |
| POST | `/api/mes/production-logs/polishing` | Submit log penyosohan | OPR_PROD, ADMIN |
| POST | `/api/mes/production-logs/sorting` | Submit log sortasi | OPR_PROD, ADMIN |
| POST | `/api/mes/production-logs/packaging` | Submit log pengemasan | OPR_PROD, ADMIN |
| GET | `/api/mes/production-logs/[workOrderId]` | Semua log untuk WO tertentu | All |
| POST | `/api/mes/machine-logs/downtime` | Catat downtime mesin | OPR_PROD, ADMIN |
| GET | `/api/mes/machine-logs/[machineId]` | Riwayat log mesin | All |

**POST /api/mes/production-logs/husking — Request Body:**
```json
{
  "workOrderId": "string",
  "machineId": "string",
  "inputWeight": 4800,
  "brownRiceOutput": 3840,
  "huskOutput": 960,
  "startTime": "2024-01-10T07:30:00Z",
  "endTime": "2024-01-10T09:00:00Z",
  "notes": "string (optional)"
}
```

---

### 5.10 WMS — Rice Stock (Finished Goods)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/wms/rice-stock` | List stok beras per batch | All |
| GET | `/api/wms/rice-stock/summary` | Summary stok per SKU | All |
| POST | `/api/wms/rice-stock/inbound` | Terima produk dari produksi ke gudang FG | OPR_WHS, ADMIN |
| POST | `/api/wms/rice-stock/stock-opname` | Submit hasil stock opname | OPR_WHS, ADMIN |
| PATCH | `/api/wms/rice-stock/stock-opname/[id]/approve` | Approve penyesuaian stok | ADMIN |

---

### 5.11 WMS — Delivery Orders

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/wms/delivery-orders` | List semua DO | All |
| GET | `/api/wms/delivery-orders?driverId=[id]` | DO untuk supir tertentu | DRIVER |
| POST | `/api/wms/delivery-orders` | Buat DO baru | ADMIN, OPR_WHS |
| GET | `/api/wms/delivery-orders/[id]` | Detail DO | All |
| PATCH | `/api/wms/delivery-orders/[id]/confirm` | Confirm DO → mulai picking | ADMIN, OPR_WHS |
| PATCH | `/api/wms/delivery-orders/[id]/ready` | Marking siap kirim | OPR_WHS, ADMIN |
| PATCH | `/api/wms/delivery-orders/[id]/delivered` | Konfirmasi terkirim (DRIVER) | DRIVER, ADMIN |
| POST | `/api/wms/delivery-orders/[id]/return` | Catat retur | DRIVER, ADMIN |
| GET | `/api/wms/delivery-orders/[id]/surat-jalan` | Generate PDF surat jalan | OPR_WHS, ADMIN |

---

### 5.12 Reports

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/reports/production` | Laporan produksi & yield | ADMIN |
| GET | `/api/reports/machine-oee` | Laporan OEE mesin | ADMIN |
| GET | `/api/reports/inventory` | Laporan pergerakan stok | ADMIN |
| GET | `/api/reports/delivery` | Laporan pengiriman | ADMIN |
| GET | `/api/reports/supplier-quality` | Laporan kualitas supplier | ADMIN |
| GET | `/api/reports/dashboard-stats` | Data untuk dashboard | All |

Query params untuk semua report: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

---

### 5.13 Alerts

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| GET | `/api/alerts` | List alert aktif | All (filtered by role) |
| PATCH | `/api/alerts/[id]/dismiss` | Dismiss alert | All |

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Halaman dashboard harus load dalam <3 detik pada koneksi normal
- API response time <500ms untuk operasi GET biasa
- API response time <2s untuk operasi yang melibatkan kalkulasi yield
- Mendukung minimal 10 concurrent users (sesuai skala pabrik menengah)

### 6.2 Security
- Semua route yang membutuhkan auth wajib cek session di server side
- Password di-hash menggunakan bcrypt (min 10 salt rounds)
- Input validation menggunakan Zod di semua API endpoint
- Tidak ada sensitive data di client-side localStorage

### 6.3 Reliability
- Data produksi dan stok tidak boleh hilang jika terjadi error di tengah proses
- Gunakan database transaction untuk operasi yang melibatkan multiple tabel
- Seed data harus bisa dijalankan ulang (idempotent) tanpa error

### 6.4 Maintainability
- Semua TypeScript, tidak boleh ada `any` type kecuali benar-benar tidak bisa dihindari
- Setiap function utilitas wajib punya JSDoc comment
- Gunakan Prisma migration untuk semua perubahan schema (tidak boleh edit database manual)

### 6.5 Responsiveness
- Aplikasi wajib bisa digunakan di desktop (min 1024px) dan mobile (min 375px)
- Tabel di mobile menggunakan horizontal scroll atau tampilan card
- Form di mobile menggunakan full-width input

---

## 7. UI/UX Requirements

### 7.1 Design System
- Gunakan komponen shadcn/ui sebagai basis
- Color scheme: tema hijau/kuning (tema padi) — primary: hijau (#16a34a), secondary: kuning (#ca8a04)
- Dark mode: opsional, bisa diimplementasi belakangan
- Font: Inter (default dari shadcn)

### 7.2 Status Badge Colors
| Status | Warna |
|---|---|
| DRAFT | Abu-abu |
| IN_PROGRESS / RUNNING | Biru |
| SELESAI / DELIVERED / DITERIMA | Hijau |
| DITOLAK / BREAKDOWN | Merah |
| ANTRIAN / PENDING | Kuning/Oranye |
| MAINTENANCE | Oranye |

### 7.3 Komponen Penting
- **DataTable** — reusable table dengan sorting, filtering, pagination
- **StatusBadge** — badge warna sesuai status
- **AlertBanner** — banner merah/kuning untuk alert penting di atas halaman
- **ConfirmDialog** — dialog konfirmasi sebelum aksi destruktif
- **PageHeader** — header halaman konsisten dengan title + action buttons
- **WorkOrderTimeline** — visual timeline progress tahapan produksi

### 7.4 Loading & Error States
- Semua halaman harus punya loading skeleton (bukan hanya spinner)
- Error state dengan pesan yang jelas dan tombol retry
- Form submission: disable button saat loading, tampilkan success/error toast

### 7.5 Mobile Considerations
- Sidebar collapse menjadi hamburger menu di mobile
- Form input ukuran besar, mudah di-tap di layar kecil
- Halaman yang sering diakses Operator (input log produksi, konfirmasi pengiriman) wajib dioptimalkan untuk mobile

---

## Catatan untuk AI Developer

1. **Urutan implementasi yang disarankan** (ada di DOC-04):
   - Setup project → Auth → Master Data → WMS Gudang Padi → MES Work Order → MES Produksi → WMS Gudang Beras → WMS Pengiriman → Reports → Deploy

2. **Library yang wajib diinstall** (ada di DOC-03 dan DOC-04):
   ```
   next, react, react-dom, typescript, tailwindcss, @prisma/client, prisma,
   next-auth, @auth/prisma-adapter, bcryptjs, zod, react-hook-form,
   @hookform/resolvers, zustand, @tanstack/react-query, date-fns,
   recharts, lucide-react, @react-pdf/renderer, shadcn/ui (via CLI)
   ```

3. **Jangan buat fitur yang belum ada di dokumen ini** — fokus dulu pada yang terdefinisi.

4. **Setiap API endpoint wajib:**
   - Cek session / auth
   - Validasi input dengan Zod
   - Handle error dengan try-catch
   - Return response sesuai konvensi di 5.0

5. **Konsultasi DOC-01** untuk logika bisnis (business rules, threshold, yield formula).

6. **Konsultasi DOC-03** untuk schema database sebelum menulis query Prisma.

---

*Versi: 1.0 | Dokumen ini adalah bagian dari seri DOC-01 s/d DOC-04*
*Lanjut ke DOC-03 untuk ERD dan Prisma schema.*
