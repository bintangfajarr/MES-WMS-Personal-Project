# DOC-01 — Business Process Document
## Sistem MES + WMS Pabrik Penggilingan Padi
### PT. Beras Nusantara

---

> **Dokumen ini adalah satu-satunya sumber kebenaran (single source of truth) untuk proses bisnis.**
> Dibuat untuk digunakan oleh AI Developer sebagai referensi sebelum membaca dokumen teknis (DOC-02, DOC-03, DOC-04).
> Baca dokumen ini **secara menyeluruh** sebelum mengerjakan task apapun.

---

## Daftar Isi

1. [Profil Perusahaan](#1-profil-perusahaan)
2. [Produk](#2-produk)
3. [Struktur Organisasi & User Roles](#3-struktur-organisasi--user-roles)
4. [Overview Alur Bisnis](#4-overview-alur-bisnis)
5. [Proses Bisnis Detail](#5-proses-bisnis-detail)
   - 5.1 [Penerimaan Padi (Incoming)](#51-penerimaan-padi-incoming)
   - 5.2 [Pengeringan (Drying)](#52-pengeringan-drying)
   - 5.3 [Penggilingan / Husking](#53-penggilingan--husking)
   - 5.4 [Penyosohan / Polishing](#54-penyosohan--polishing)
   - 5.5 [Sortasi & Grading](#55-sortasi--grading)
   - 5.6 [Pengemasan (Packaging)](#56-pengemasan-packaging)
   - 5.7 [Penerimaan Gudang Beras (WMS Inbound)](#57-penerimaan-gudang-beras-wms-inbound)
   - 5.8 [Penyimpanan & Manajemen Gudang (WMS Storage)](#58-penyimpanan--manajemen-gudang-wms-storage)
   - 5.9 [Pengiriman (WMS Outbound)](#59-pengiriman-wms-outbound)
6. [Alur WMS Gudang Padi (Raw Material)](#6-alur-wms-gudang-padi-raw-material)
7. [Business Rules](#7-business-rules)
8. [KPI & Metrics](#8-kpi--metrics)
9. [Master Data](#9-master-data)
10. [Seed Data](#10-seed-data)

---

## 1. Profil Perusahaan

| Field | Detail |
|---|---|
| **Nama** | PT. Beras Nusantara |
| **Jenis Usaha** | Penggilingan Padi (Rice Milling Unit / RMU) |
| **Skala** | Menengah — kapasitas giling 10–20 ton padi/hari |
| **Lokasi** | Karawang, Jawa Barat |
| **Jam Operasi** | Senin–Sabtu, 07.00–17.00 WIB (1 shift) |
| **Supplier Padi** | Petani lokal dan pengepul (tengkulak) dari Karawang, Subang, Purwakarta |
| **Pelanggan** | Toko sembako, distributor beras, pasar tradisional, supermarket lokal |
| **Sertifikasi** | Izin PIRT, SNI Beras (target) |

---

## 2. Produk

PT. Beras Nusantara memproduksi **3 produk utama** dari satu bahan baku (padi gabah):

### 2.1 Beras Premium (SKU: BERAS-PRE)

| Field | Detail |
|---|---|
| **Nama Produk** | Beras Nusantara Premium |
| **Deskripsi** | Beras putih kualitas tertinggi, butir utuh ≥95%, bebas kotoran |
| **Varietas Padi** | IR64, Ciherang, Pandan Wangi |
| **Kadar Air** | ≤14% |
| **Butir Utuh** | ≥95% |
| **Butir Patah** | ≤5% |
| **Packaging** | 5 kg, 10 kg |
| **Warna Kemasan** | Putih dengan aksen emas |
| **Target Pasar** | Supermarket, horeca, konsumen premium |
| **Harga Jual Est.** | Rp 15.000/kg |

### 2.2 Beras Medium (SKU: BERAS-MED)

| Field | Detail |
|---|---|
| **Nama Produk** | Beras Nusantara Medium |
| **Deskripsi** | Beras putih kualitas standar, campuran varietas |
| **Varietas Padi** | Campuran (IR64, IR42, lokal) |
| **Kadar Air** | ≤14% |
| **Butir Utuh** | ≥80% |
| **Butir Patah** | ≤20% |
| **Packaging** | 10 kg, 25 kg |
| **Warna Kemasan** | Biru muda |
| **Target Pasar** | Toko sembako, pasar tradisional, rumah tangga |
| **Harga Jual Est.** | Rp 11.000/kg |

### 2.3 Beras Patah / Broken Rice (SKU: BERAS-PAT)

| Field | Detail |
|---|---|
| **Nama Produk** | Beras Patah Nusantara |
| **Deskripsi** | Hasil sortasi beras patah, dijual untuk industri tepung, pakan ternak, atau konsumen ekonomi |
| **Varietas Padi** | Campuran (hasil sortasi semua produk) |
| **Kadar Air** | ≤14% |
| **Butir Patah** | >50% (mayoritas patah) |
| **Packaging** | 25 kg, 50 kg |
| **Warna Kemasan** | Karung goni / plastik polos |
| **Target Pasar** | Industri tepung beras, peternak, konsumen ekonomi |
| **Harga Jual Est.** | Rp 7.000/kg |

### 2.4 Produk Sampingan (By-product) — Tidak Dijual Retail

| Produk | Kode | Keterangan |
|---|---|---|
| Sekam (Husk) | BY-SEKAM | Dijual sebagai bahan bakar atau media tanam |
| Bekatul (Rice Bran) | BY-BEKATUL | Dijual untuk pakan ternak atau suplemen |

---

## 3. Struktur Organisasi & User Roles

### 3.1 Daftar Role

| Role | Kode Role | Deskripsi |
|---|---|---|
| Admin / Manager | `ADMIN` | Akses penuh ke semua modul, konfigurasi sistem, laporan |
| Operator Produksi | `OPR_PROD` | Input dan update proses produksi (MES) |
| Operator Gudang | `OPR_WHS` | Kelola penerimaan, penyimpanan, pengeluaran barang (WMS) |
| Supir / Pengiriman | `DRIVER` | Konfirmasi pengiriman, tanda terima surat jalan |

### 3.2 Hak Akses per Modul

| Modul | ADMIN | OPR_PROD | OPR_WHS | DRIVER |
|---|---|---|---|---|
| Dashboard | ✅ Full | ✅ Read | ✅ Read | ❌ |
| Work Order | ✅ CRUD | ✅ Update status | ❌ | ❌ |
| Proses Produksi | ✅ Full | ✅ Input/Update | ❌ | ❌ |
| QC Inspection | ✅ Full | ✅ Input | ✅ Read | ❌ |
| Gudang Padi (RM) | ✅ Full | ✅ Read | ✅ CRUD | ❌ |
| Gudang Beras (FG) | ✅ Full | ✅ Read | ✅ CRUD | ❌ |
| Delivery Order | ✅ Full | ❌ | ✅ Create | ✅ Konfirmasi |
| Laporan | ✅ Full | ✅ Read terbatas | ✅ Read terbatas | ❌ |
| Master Data | ✅ Full | ❌ | ❌ | ❌ |
| User Management | ✅ Full | ❌ | ❌ | ❌ |

---

## 4. Overview Alur Bisnis

### 4.1 Gambaran Besar (End-to-End Flow)

```
[SUPPLIER/PETANI]
      |
      | Kirim Padi Gabah
      v
[WMS] GUDANG PADI (Raw Material Warehouse)
      |
      | Work Order dibuat
      v
[MES] PROSES PRODUKSI
      |
      |-- 1. Pengeringan (Dryer)
      |-- 2. Penggilingan / Husking (Husker Machine)
      |-- 3. Penyosohan / Polishing (Polisher Machine)
      |-- 4. Sortasi & Grading (Color Sorter + Classifier)
      |-- 5. Pengemasan (Packaging Machine)
      |
      v
[WMS] GUDANG BERAS (Finished Goods Warehouse)
      |
      | Delivery Order dibuat
      v
[WMS] PENGIRIMAN
      |
      v
[PELANGGAN]
```

### 4.2 Alur Dokumen

```
Purchase Order (dari pelanggan)
      |
      v
Work Order (dibuat oleh Manager)
      |
      v
Material Request (ambil padi dari gudang RM)
      |
      v
Production Log (setiap tahap proses)
      |
      v
QC Inspection Report
      |
      v
Goods Receipt (masuk ke gudang FG)
      |
      v
Delivery Order
      |
      v
Surat Jalan (Delivery Note)
```

---

## 5. Proses Bisnis Detail

---

### 5.1 Penerimaan Padi (Incoming)

**Deskripsi:**
Proses penerimaan padi gabah dari supplier (petani atau pengepul). Setiap kedatangan padi dicatat sebagai satu Lot dengan informasi lengkap. Sebelum diterima, padi harus melalui inspeksi kualitas (incoming QC) untuk memastikan layak giling.

**Trigger:** Supplier tiba dengan padi gabah (bisa terjadwal atau tidak terjadwal).

**Aktor:** Operator Gudang, Admin (approve jika diperlukan).

**Input:**
- Nama supplier
- Varietas padi
- Berat kotor (gross weight) dari timbangan
- Sampel fisik padi

**Proses:**
1. Operator gudang mencatat kedatangan supplier
2. Padi ditimbang → catat berat kotor
3. Operator ambil sampel untuk inspeksi:
   - Ukur **kadar air** menggunakan moisture meter
   - Periksa **kotoran** (batu, jerami, gabah hampa) secara visual, estimasi % kotoran
   - Catat **varietas** (dikonfirmasi dari supplier)
4. Sistem generate **Lot Number** otomatis (format: `LOT-YYYYMMDD-XXX`)
5. Jika QC **LULUS** → padi diterima, masuk gudang, catat berat bersih
6. Jika QC **GAGAL** → padi ditolak, dicatat alasan penolakan, dikembalikan ke supplier

**Output:**
- Lot padi baru di sistem dengan status `DITERIMA` atau `DITOLAK`
- Stok gudang padi bertambah (jika diterima)
- Record incoming QC

**Aturan Bisnis:**
- Kadar air padi masuk harus ≤22%. Jika >22%, padi wajib dikeringkan sebelum digiling (atau ditolak).
- Kotoran >5% → otomatis ditolak.
- Setiap lot harus punya Lot Number unik dan tidak bisa digabung dengan lot lain.
- Berat bersih = berat kotor - berat karung - estimasi kotoran.

**Status Lot Padi:**
- `MENUNGGU_QC` → `DITERIMA` → `ANTRIAN_GILING` → `SEDANG_DIGILING` → `SELESAI`
- `MENUNGGU_QC` → `DITOLAK`

---

### 5.2 Pengeringan (Drying)

**Deskripsi:**
Proses menurunkan kadar air padi dari kondisi awal (bisa sampai 22–25%) ke level optimal untuk digiling (≤14%). Pengeringan dilakukan menggunakan mesin dryer atau dijemur secara alami tergantung kondisi.

**Trigger:** Padi dengan kadar air >14% yang masuk gudang dan sudah dibuat Work Order.

**Aktor:** Operator Produksi.

**Input:**
- Lot padi yang akan dikeringkan
- Work Order yang sudah dibuat
- Kadar air awal (dari incoming QC)

**Proses:**
1. Operator menerima Work Order dari sistem
2. Padi dari gudang dikeluarkan sesuai lot (dicatat di sistem sebagai `Material Issued`)
3. Padi dimasukkan ke mesin dryer
4. Operator input ke sistem:
   - Waktu mulai pengeringan
   - Suhu dryer (°C)
   - Kapasitas batch (kg)
5. Setelah selesai, operator ukur kadar air akhir
6. Input ke sistem:
   - Waktu selesai
   - Kadar air akhir
   - Berat setelah kering (ada susut karena penguapan air)
7. Jika kadar air akhir ≤14% → lanjut ke tahap penggilingan
8. Jika masih >14% → ulangi pengeringan (siklus ke-2)

**Output:**
- Log pengeringan (waktu, suhu, durasi, kadar air sebelum/sesudah)
- Berat padi setelah kering (biasanya berkurang 2–5% dari berat awal)
- Status Work Order step: `PENGERINGAN` → `SELESAI`

**Aturan Bisnis:**
- Suhu dryer tidak boleh melebihi 43°C (merusak kualitas beras).
- Jika kadar air tidak turun ke ≤14% setelah 2 siklus → eskalasi ke Manager.
- Susut pengeringan (drying loss) dicatat dan masuk ke perhitungan yield.
- Jika padi awal sudah ≤14%, tahap pengeringan di-skip.

**Mesin:** DRYER-01 (kapasitas 5 ton/batch)

---

### 5.3 Penggilingan / Husking

**Deskripsi:**
Proses mengupas sekam (husk) dari bulir padi menggunakan mesin husker, menghasilkan beras pecah kulit (brown rice). Ini adalah tahap utama yang menentukan rendemen giling.

**Trigger:** Padi sudah kering (kadar air ≤14%) dan Work Order sudah aktif.

**Aktor:** Operator Produksi.

**Input:**
- Padi kering dari tahap pengeringan (atau langsung dari gudang jika kadar air sudah OK)
- Work Order aktif

**Proses:**
1. Operator input berat padi yang akan digiling ke sistem
2. Mesin husker dijalankan
3. Operator input ke sistem:
   - Waktu mulai
   - ID mesin (HUSKER-01 atau HUSKER-02)
   - Berat input (kg padi)
4. Output mesin:
   - **Beras pecah kulit (brown rice)** → lanjut ke polisher
   - **Sekam (husk)** → ditampung, dicatat sebagai by-product
5. Setelah selesai, operator timbang output:
   - Berat beras pecah kulit
   - Berat sekam
6. Input ke sistem → sistem hitung **husking yield** = berat brown rice / berat padi × 100%

**Output:**
- Beras pecah kulit (brown rice) siap ke tahap polishing
- By-product: Sekam (stok gudang by-product bertambah)
- Log mesin: waktu operasi, berat input/output
- Husking yield (%)

**Aturan Bisnis:**
- Husking yield normal: 78–82%. Jika <75% → operator wajib lapor, kemungkinan mesin perlu servis.
- Sekam wajib ditimbang dan dicatat (bukan dibuang begitu saja).
- Downtime mesin wajib dicatat beserta alasannya.
- Satu batch husking maksimal 2 ton padi.

**Mesin:** HUSKER-01, HUSKER-02 (kapasitas masing-masing 2 ton/batch)

---

### 5.4 Penyosohan / Polishing

**Deskripsi:**
Proses menggosok lapisan bekatul (bran) dari beras pecah kulit menggunakan mesin polisher, menghasilkan beras putih (white rice). Tingkat sosoh menentukan apakah produk menjadi Beras Premium atau Beras Medium.

**Trigger:** Beras pecah kulit dari tahap husking tersedia.

**Aktor:** Operator Produksi.

**Input:**
- Beras pecah kulit dari tahap husking
- Setting sosoh (tingkat sosoh ditentukan oleh jenis produk yang dibuat)

**Proses:**
1. Operator set mesin polisher sesuai target produk:
   - **Sosoh Tinggi** (level 3) → untuk Beras Premium (butir lebih putih, mengkilap)
   - **Sosoh Sedang** (level 2) → untuk Beras Medium
2. Input ke sistem: waktu mulai, ID mesin, berat input, setting sosoh
3. Mesin berjalan → menghasilkan:
   - **Beras putih (white rice)** → lanjut ke sortasi
   - **Bekatul (rice bran)** → ditampung sebagai by-product
4. Operator timbang output dan input ke sistem:
   - Berat beras putih
   - Berat bekatul
5. Sistem hitung **polishing yield**

**Output:**
- Beras putih siap sortasi
- By-product: Bekatul (stok gudang by-product bertambah)
- Log mesin: waktu operasi, setting, berat input/output
- Polishing yield (%)

**Aturan Bisnis:**
- Polishing yield normal: 95–98%. Jika <93% → lapor ke Manager.
- Bekatul wajib ditimbang dan dicatat.
- Satu batch polishing harus dari satu lot padi yang sama (tidak boleh campur lot).
- Setting sosoh tidak boleh diubah di tengah batch.

**Mesin:** POLISHER-01, POLISHER-02 (kapasitas masing-masing 2 ton/batch)

---

### 5.5 Sortasi & Grading

**Deskripsi:**
Proses memisahkan beras berdasarkan kualitas menggunakan mesin color sorter (membuang beras hitam/rusak) dan classifier (memisahkan beras utuh dari beras patah). Tahap ini menentukan proporsi output ke masing-masing produk.

**Trigger:** Beras putih dari tahap polishing tersedia.

**Aktor:** Operator Produksi.

**Input:**
- Beras putih dari tahap polishing

**Proses:**
1. Beras putih masuk ke **Color Sorter**:
   - Mesin memindai warna setiap butir beras menggunakan sensor optik
   - Beras hitam/kuning/rusak → dipisahkan sebagai **rejected grain** (dibuang atau dijual sangat murah)
   - Beras lolos → lanjut ke classifier
2. Beras lolos color sorter masuk ke **Classifier / Grader**:
   - Mesin memisahkan berdasarkan ukuran butir
   - **Beras utuh (whole grain)** → untuk Beras Premium atau Medium
   - **Beras patah ½ (half broken)** → untuk Beras Medium atau Beras Patah
   - **Beras patah ¼ (quarter broken / menir)** → untuk Beras Patah
3. Operator timbang masing-masing output dan input ke sistem
4. Sistem hitung distribusi output:
   - % beras utuh
   - % beras patah
   - % rejected

**Output:**
- Beras utuh → antrian packaging Beras Premium / Medium
- Beras patah → antrian packaging Beras Patah
- Rejected grain → dicatat, dibuang / dijual
- Grading report per batch

**Aturan Bisnis:**
- Jika % beras utuh ≥95% dari total output → batch masuk Beras Premium.
- Jika % beras utuh 80–94% → batch masuk Beras Medium.
- Jika % beras utuh <80% → seluruh batch di-downgrade ke Beras Medium atau Beras Patah.
- Rejected grain tidak boleh masuk ke produk apapun.
- Grading decision dicatat di sistem beserta siapa yang approve (Operator/Manager).

**Mesin:** COLOR-SORTER-01, CLASSIFIER-01

---

### 5.6 Pengemasan (Packaging)

**Deskripsi:**
Proses memasukkan beras ke dalam kemasan sesuai ukuran dan jenis produk. Setiap kemasan diberi label yang berisi informasi produk, berat, tanggal produksi, tanggal kadaluarsa, dan nomor batch.

**Trigger:** Beras sudah graded dan siap kemas sesuai Work Order.

**Aktor:** Operator Produksi.

**Input:**
- Beras hasil grading
- Packaging material (karung, plastik, label) dari gudang

**Proses:**
1. Operator ambil packaging material dari gudang (sistem catat sebagai material consumed)
2. Mesin packaging atau manual filling:
   - Timbang beras sesuai ukuran kemasan (5kg / 10kg / 25kg / 50kg)
   - Masukkan ke kemasan
   - Seal kemasan
3. Operator tempel/cetak label di setiap kemasan:
   - Nama produk
   - Berat bersih
   - Tanggal Produksi (tanggal hari ini)
   - Tanggal Kadaluarsa (6 bulan dari tanggal produksi)
   - Nomor Batch (format: `BATCH-YYYYMMDD-XXX`)
   - Nomor Lot padi asal
4. Operator input ke sistem:
   - Jumlah kemasan yang dihasilkan per SKU per ukuran
   - Batch number
   - Sisa beras tidak terkemas (jika ada)
5. Selesai packaging → Work Order di-close

**Output:**
- Produk jadi (finished goods) dengan batch number
- Label untuk setiap kemasan
- Work Order status: `SELESAI`
- Material consumption record (packaging material terpakai)

**Aturan Bisnis:**
- Berat kemasan harus dalam toleransi ±1% dari berat nominal (misal: kemasan 5kg = 4.95–5.05 kg).
- Setiap kemasan **wajib** punya label dengan informasi lengkap.
- Beras dari lot yang berbeda **tidak boleh** dicampur dalam satu batch kemasan.
- Tanggal kadaluarsa = tanggal produksi + 6 bulan.
- Sisa beras tidak terkemas (jika <1 kemasan penuh) dicatat sebagai stok loose dan bisa dikemas di hari berikutnya.

**Mesin / Peralatan:** PACKER-01, timbangan digital, printer label

---

### 5.7 Penerimaan Gudang Beras (WMS Inbound)

**Deskripsi:**
Proses memindahkan produk jadi (beras kemasan) dari area produksi ke gudang finished goods. Setiap batch produk dicatat masuk ke gudang dengan lokasi penyimpanan yang spesifik.

**Trigger:** Work Order selesai, produk jadi sudah dikemas dan dilabeli.

**Aktor:** Operator Gudang.

**Input:**
- Produk jadi dari area produksi (dengan batch number)
- Lokasi gudang yang tersedia

**Proses:**
1. Operator gudang menerima serah terima produk dari area produksi
2. Operator scan atau input batch number di sistem
3. Sistem menampilkan detail produk (jenis, ukuran, jumlah, lot asal)
4. Operator tentukan lokasi penyimpanan (Rak-Baris-Kolom, misal: `A-01-03`)
5. Input ke sistem:
   - Lokasi penyimpanan
   - Jumlah kemasan per SKU
   - Kondisi produk (Normal / Ada kerusakan kemasan)
6. Sistem update stok gudang FG

**Output:**
- Stok gudang FG bertambah
- Record penerimaan (Goods Receipt) dengan timestamp
- Lokasi produk tercatat di sistem (slotting)

**Aturan Bisnis:**
- Produk tidak boleh disimpan di lantai langsung (harus di atas pallet).
- Satu lokasi (slot) hanya boleh berisi satu batch dan satu SKU.
- Produk dengan kadaluarsa lebih awal diletakkan di depan (FIFO enforcement).
- Kondisi gudang: suhu 25–30°C, kelembaban ≤70%.

---

### 5.8 Penyimpanan & Manajemen Gudang (WMS Storage)

**Deskripsi:**
Pengelolaan stok beras di gudang finished goods, termasuk monitoring stok, lokasi produk, kondisi penyimpanan, dan peringatan kadaluarsa.

**Aktor:** Operator Gudang, Admin.

**Fitur:**

**a. Stock Overview**
- Lihat stok per SKU (Beras Premium / Medium / Patah)
- Lihat stok per lokasi (per rak)
- Lihat stok per batch number

**b. FIFO Management**
- Sistem selalu merekomendasikan batch dengan tanggal kadaluarsa paling awal untuk dikeluarkan terlebih dahulu
- Alert otomatis jika ada stok dengan sisa waktu kadaluarsa <30 hari

**c. Stock Opname**
- Operator gudang bisa input hasil stock opname fisik
- Sistem bandingkan dengan stok sistem → tampilkan selisih (variance)
- Manager approve penyesuaian stok

**d. Minimum Stock Alert**
- Setiap SKU punya batas minimum stok
- Jika stok turun ke bawah minimum → alert ke Manager

**Aturan Bisnis:**
- Stock opname dilakukan minimal 1x per minggu.
- Selisih stok >2% wajib diinvestigasi sebelum di-approve.
- Produk rusak/expired dipisahkan ke zona karantina, tidak boleh dijual.
- Minimum stok: Beras Premium 100 sak, Beras Medium 200 sak, Beras Patah 100 sak.

---

### 5.9 Pengiriman (WMS Outbound)

**Deskripsi:**
Proses pengiriman produk jadi ke pelanggan. Dimulai dari pembuatan Delivery Order, picking produk dari gudang, pembuatan surat jalan, sampai konfirmasi pengiriman oleh supir.

**Trigger:** Ada permintaan pengiriman dari Manager atau Purchase Order dari pelanggan.

**Aktor:** Admin/Manager (buat DO), Operator Gudang (picking), Supir (konfirmasi).

**Proses:**
1. **Manager buat Delivery Order (DO)**:
   - Pilih pelanggan
   - Pilih produk dan jumlah yang akan dikirim
   - Sistem otomatis sarankan batch berdasarkan FIFO
   - Set tanggal pengiriman
2. **Operator Gudang lakukan Picking**:
   - Terima notifikasi DO di sistem
   - Ambil produk dari lokasi yang ditentukan sistem
   - Input konfirmasi picking per item
   - Sistem update stok (reserved → shipped)
3. **Generate Surat Jalan**:
   - Sistem generate dokumen surat jalan (PDF)
   - Berisi: nomor DO, nama pelanggan, alamat, daftar produk, batch number, berat total
4. **Supir konfirmasi pengiriman**:
   - Supir lihat daftar DO yang perlu dikirim
   - Setelah tiba di pelanggan, supir input konfirmasi terima
   - Jika ada retur, supir catat item yang diretur
5. **DO status update ke `TERKIRIM`**

**Output:**
- Stok gudang FG berkurang
- Surat jalan (PDF) tersimpan di sistem
- Delivery record dengan timestamp
- Retur record (jika ada)

**Status Delivery Order:**
`DRAFT` → `CONFIRMED` → `PICKING` → `READY_TO_SHIP` → `SHIPPED` → `DELIVERED`
(jika retur: `DELIVERED` → `PARTIAL_RETURN`)

**Aturan Bisnis:**
- DO hanya bisa dibuat jika stok tersedia mencukupi.
- Produk yang sudah di-reserved untuk DO tidak bisa dialokasikan ke DO lain.
- Surat jalan wajib dicetak/di-share sebelum produk keluar gudang.
- Retur maksimal dalam 3 hari setelah tanggal pengiriman.

---

## 6. Alur WMS Gudang Padi (Raw Material)

**Deskripsi:**
Gudang padi adalah tempat penyimpanan sementara padi gabah sebelum digiling. WMS untuk RM lebih sederhana daripada FG.

### 6.1 Penerimaan (Inbound RM)
- Sudah dijelaskan di Proses 5.1 (Penerimaan Padi)

### 6.2 Storage RM
- Padi disimpan per lot, di area yang terpisah per varietas
- Kadar air padi disimpan dan dimonitor (harus ≤14% untuk jangka panjang)
- Jika padi menunggu terlalu lama (>7 hari) → alert ke Manager

### 6.3 Pengeluaran (Outbound RM)
- Padi dikeluarkan dari gudang hanya berdasarkan Work Order aktif
- Sistem catat: lot yang dikeluarkan, berat, tujuan (mesin mana), timestamp
- FIFO berlaku: lot dengan tanggal masuk paling awal harus digiling lebih dulu

---

## 7. Business Rules

### 7.1 Traceability (Keterlacakan)
- Setiap produk jadi **harus bisa dilacak** sampai ke lot padi asal, tanggal masuk, nama supplier.
- Jika terjadi masalah kualitas pada produk yang sudah dikirim, Manager bisa trace ke lot padi sumber.

### 7.2 Yield Calculation (Perhitungan Rendemen)
Yield total dihitung sebagai:

```
Overall Milling Yield (%) = Berat Beras Jadi (semua produk) / Berat Padi Awal × 100%
```

Benchmark yield normal:
- Overall yield: 60–65%
- Husking yield: 78–82%
- Polishing yield: 95–98%
- Whole grain ratio: 60–80% (tergantung kualitas padi)

### 7.3 Lot Integrity
- Satu lot padi tidak boleh dipecah menjadi Work Order yang berbeda secara bersamaan.
- Pencampuran lot hanya boleh di tahap packaging dengan persetujuan Manager, dan tetap dicatat di sistem.

### 7.4 Work Order
- Work Order harus dibuat sebelum proses produksi dimulai.
- Tidak boleh ada proses produksi tanpa Work Order aktif.
- Work Order bisa di-cancel hanya sebelum proses dimulai.

### 7.5 Inventory
- Stok tidak boleh negatif. Sistem harus mencegah pengeluaran melebihi stok tersedia.
- Setiap perubahan stok harus ada transaksi yang melatarbelakangi (tidak ada penyesuaian manual tanpa alasan).

---

## 8. KPI & Metrics

### 8.1 KPI Produksi (MES)

| KPI | Formula | Target | Frekuensi |
|---|---|---|---|
| Overall Milling Yield | Beras jadi / Padi masuk × 100% | ≥62% | Per Work Order |
| Husking Yield | Brown rice / Padi masuk × 100% | ≥78% | Per batch |
| Polishing Yield | White rice / Brown rice × 100% | ≥95% | Per batch |
| Whole Grain Ratio | Beras utuh / Total beras × 100% | ≥70% | Per batch |
| Machine OEE | Availability × Performance × Quality | ≥75% | Per hari |
| Machine Downtime | Total jam downtime | ≤1 jam/hari | Per hari |
| Work Order On-Time | WO selesai tepat waktu / Total WO | ≥90% | Per minggu |
| Reject Rate | Rejected grain / Total beras × 100% | ≤3% | Per batch |

### 8.2 KPI Gudang (WMS)

| KPI | Formula | Target | Frekuensi |
|---|---|---|---|
| Inventory Accuracy | 1 - (|Selisih stok| / Total stok) | ≥98% | Per stock opname |
| FIFO Compliance | Pengiriman sesuai FIFO / Total pengiriman | 100% | Per DO |
| Order Fulfillment Rate | DO terkirim tepat waktu / Total DO | ≥95% | Per minggu |
| Expired/Near-Expiry Stock | Stok dengan sisa <30 hari / Total stok | ≤2% | Per minggu |
| Supplier Quality Rate | Lot diterima / Total lot datang | Target >95% | Per bulan |

### 8.3 KPI Dashboard (tampil di halaman utama)

Dashboard utama menampilkan:
- Stok padi (gudang RM) — hari ini
- Stok beras per produk (gudang FG) — hari ini
- Work Order aktif — jumlah dan status
- Overall Milling Yield — rata-rata 7 hari terakhir
- Produksi hari ini (kg) vs target
- Delivery Order pending

---

## 9. Master Data

Master data adalah data referensi yang jarang berubah, hanya bisa diubah oleh `ADMIN`.

### 9.1 Varietas Padi

| Kode | Nama | Keterangan |
|---|---|---|
| VAR-IR64 | IR64 | Varietas paling umum di Jawa Barat |
| VAR-CIH | Ciherang | Kualitas premium, populer |
| VAR-PW | Pandan Wangi | Kualitas sangat premium, harum |
| VAR-IR42 | IR42 | Kualitas menengah |
| VAR-LOK | Lokal/Campuran | Tidak teridentifikasi/campuran |

### 9.2 Supplier

Data supplier meliputi: nama, alamat, nomor telepon, wilayah asal padi, rating kualitas historis.

### 9.3 Pelanggan

Data pelanggan meliputi: nama, alamat pengiriman, nomor telepon, jenis pelanggan (toko / distributor / horeca), limit kredit.

### 9.4 Mesin

| Kode | Nama | Tipe | Kapasitas |
|---|---|---|---|
| DRYER-01 | Dryer Utama | Pengering | 5 ton/batch |
| HUSKER-01 | Husker 1 | Penggilingan | 2 ton/batch |
| HUSKER-02 | Husker 2 | Penggilingan | 2 ton/batch |
| POLISHER-01 | Polisher 1 | Penyosohan | 2 ton/batch |
| POLISHER-02 | Polisher 2 | Penyosohan | 2 ton/batch |
| COLOR-SORTER-01 | Color Sorter | Sortasi | 3 ton/jam |
| CLASSIFIER-01 | Classifier/Grader | Grading | 3 ton/jam |
| PACKER-01 | Mesin Packing | Pengemasan | 500 sak/jam |

### 9.5 Packaging Material

| Kode | Nama | Satuan |
|---|---|---|
| PKG-KAR5 | Karung plastik 5kg | pcs |
| PKG-KAR10 | Karung plastik 10kg | pcs |
| PKG-KAR25 | Karung plastik 25kg | pcs |
| PKG-KAR50 | Karung goni 50kg | pcs |
| PKG-LBL-PRE | Label Beras Premium | roll |
| PKG-LBL-MED | Label Beras Medium | roll |
| PKG-LBL-PAT | Label Beras Patah | roll |

### 9.6 Lokasi Gudang

**Gudang Padi (Raw Material):**
- Area A: Padi belum QC (karantina)
- Area B: Padi sudah diterima, varietas IR64
- Area C: Padi sudah diterima, varietas lain
- Area D: Padi sedang dikeringkan

**Gudang Beras (Finished Goods):**
- Rak A (A-01 s/d A-10): Beras Premium
- Rak B (B-01 s/d B-15): Beras Medium
- Rak C (C-01 s/d C-10): Beras Patah
- Area KAR: Zona karantina produk bermasalah

---

## 10. Seed Data

Data awal yang harus di-seed ke database saat pertama kali aplikasi dijalankan (`npm run seed` atau `prisma db seed`).

### 10.1 Users

| Nama | Email | Role | Password (hash) |
|---|---|---|---|
| Ahmad Yusuf | admin@berasnusantara.com | ADMIN | (hash: Admin123!) |
| Budi Santoso | budi@berasnusantara.com | OPR_PROD | (hash: Operator1!) |
| Citra Dewi | citra@berasnusantara.com | OPR_PROD | (hash: Operator1!) |
| Dani Permana | dani@berasnusantara.com | OPR_WHS | (hash: Gudang123!) |
| Eko Prasetyo | eko@berasnusantara.com | DRIVER | (hash: Driver123!) |

### 10.2 Varietas Padi (5 records)
Sesuai tabel 9.1.

### 10.3 Supplier (5 records)

| Kode | Nama | Alamat | Telp | Wilayah |
|---|---|---|---|---|
| SUP-001 | Pak Hasan | Ds. Sukamulya, Karawang | 0812-1111-0001 | Karawang |
| SUP-002 | Bu Sari | Ds. Cibuaya, Karawang | 0812-1111-0002 | Karawang |
| SUP-003 | UD. Mitra Tani | Jl. Raya Subang No.12 | 0812-1111-0003 | Subang |
| SUP-004 | Pak Asep | Ds. Loji, Purwakarta | 0812-1111-0004 | Purwakarta |
| SUP-005 | CV. Gabah Jaya | Jl. Industri No.5, Karawang | 0812-1111-0005 | Karawang |

### 10.4 Pelanggan (5 records)

| Kode | Nama | Tipe | Alamat | Telp |
|---|---|---|---|---|
| CUST-001 | Toko Sembako Makmur | Toko | Jl. Pasar Baru No.10, Karawang | 0813-2222-0001 |
| CUST-002 | UD. Beras Sejahtera | Distributor | Jl. Raya Bekasi No.45 | 0813-2222-0002 |
| CUST-003 | Supermarket Segar | Supermarket | Jl. Ahmad Yani No.88, Karawang | 0813-2222-0003 |
| CUST-004 | Warung Nasi Pak Min | Horeca | Jl. Koperasi No.3, Karawang | 0813-2222-0004 |
| CUST-005 | Koperasi Warga RW05 | Koperasi | Perum Griya Asri Blok A | 0813-2222-0005 |

### 10.5 Mesin (8 records)
Sesuai tabel 9.4, dengan field tambahan: `status: ACTIVE`, `lastMaintenanceDate`, `nextMaintenanceDate`.

### 10.6 Packaging Material (7 records)
Sesuai tabel 9.5, dengan field tambahan: `currentStock`, `minimumStock`.

### 10.7 Produk (3 records)
Sesuai bagian 2, dengan field: SKU, nama, deskripsi, packaging variants, harga jual, minimumStock.

### 10.8 Lokasi Gudang
Seed semua lokasi gudang sesuai tabel 9.6, dengan status `KOSONG`.

### 10.9 Sample Lot Padi (3 records — untuk demo/testing)

| Lot Number | Supplier | Varietas | Berat (kg) | Kadar Air | Status |
|---|---|---|---|---|---|
| LOT-20240101-001 | SUP-001 | VAR-IR64 | 5.000 | 18% | ANTRIAN_GILING |
| LOT-20240101-002 | SUP-003 | VAR-CIH | 3.000 | 13.5% | ANTRIAN_GILING |
| LOT-20240102-001 | SUP-002 | VAR-LOK | 4.000 | 21% | ANTRIAN_GILING |

### 10.10 Sample Work Order (2 records — untuk demo)

| WO Number | Target Produk | Lot | Target Output | Status |
|---|---|---|---|---|
| WO-20240101-001 | Beras Premium + Medium | LOT-20240101-001 | 3.100 kg beras | DRAFT |
| WO-20240101-002 | Beras Medium + Patah | LOT-20240101-002 | 1.860 kg beras | DRAFT |

---

## Catatan untuk AI Developer

1. **Baca dokumen ini lengkap sebelum mulai coding** — jangan skip bagian business rules.
2. **DOC-02** berisi requirements teknis (modul, fitur detail, API spec).
3. **DOC-03** berisi ERD, arsitektur sistem, dan schema Prisma.
4. **DOC-04** berisi checklist task yang harus dikerjakan secara berurutan.
5. Jika ada konflik antara dokumen, **DOC-01 adalah yang paling otoritatif** untuk logika bisnis.
6. Semua nama, kode, dan format (Lot Number, Batch Number, dll) yang ada di dokumen ini **harus digunakan konsisten** di seluruh codebase.

---

*Dokumen ini dibuat untuk proyek personal/portfolio. PT. Beras Nusantara adalah perusahaan fiktif.*
*Versi: 1.0 | Terakhir diperbarui: 2024*
