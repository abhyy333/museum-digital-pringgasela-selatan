# Laporan Implementasi Phase 6.1 — Admin Dashboard Redesign & Realtime Visitor Analytics
## Museum Digital Pringgasela Selatan

**Tanggal:** 27 November 2026  
**ID Proyek Appwrite:** `6affdaa0003c416ecdb0`  
**Konsep Desain:** *Editorial Museum Control Room*

---

### 1. Ringkasan Eksekutif

Phase 6.1 merombak tampilan dan arsitektur panel pengelola dari gaya dashboard generik menjadi ruang kerja kurator museum bertema **Editorial Museum Control Room** menggunakan palet asli museum (`Warm ivory #F3EEE5`, `Aged paper #E9DFD0`, `Soft parchment #E6D9C6`, `Terracotta #984323`, `Indigo textile #243A4A`, `Dark charcoal #25221F`, `Soft linen #D9CCB9`) dan tipografi `Playfair Display` + `Inter`, terintegrasi dengan **Realtime Visitor Analytics** bebas PII (*Personally Identifiable Information*).

---

### 2. Berkas yang Dibuat / Diperbarui

| Berkas | Jenis Perubahan | Ringkasan |
| :--- | :--- | :--- |
| [functions/museum-public-api/src/main.js](file:///home/aby/Antigravity_Project/functions/museum-public-api/src/main.js) | Diperbarui (`v1.4.0`) | Menambahkan endpoint `POST /analytics/track` dengan validasi skema ketat, pembatasan laju (40/mnt per `sessionId`, 120/mnt per hash IP in-memory), deduplikasi pageview 15 detik, pemisahan `heartbeat` vs `pageview`, pengabaian rute `/admin/*`, serta retensi otomatis sesi mentah > 30 hari. |
| [functions/museum-admin-media/src/main.js](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/main.js) | Diperbarui (`v4.1.0`) | Menambahkan endpoint `GET /analytics/summary` terotentikasi JWT & Team RBAC untuk menghitung pengunjung aktif (window 2 menit), unik hari ini (WITA `Asia/Makassar`), tren 30 hari, halaman terpopuler beserta thumbnail publik opsional, serta aktivitas terkini tanpa PII. |
| [appwrite.config.json](file:///home/aby/Antigravity_Project/appwrite.config.json) | Diperbarui | Menyelaraskan scope `museum-public-api` dengan penambahan `"rows.write"`. |
| [src/appwrite/analyticsApi.ts](file:///home/aby/Antigravity_Project/src/appwrite/analyticsApi.ts) | Baru | Klien tracking anonim (`sessionStorage` opaque ID, kategori referrer & perangkat aman), pemanggil `GET /analytics/summary`, serta langganan WebSocket `subscribeToVisitorRealtime()`. |
| [src/hooks/useVisitorTracker.ts](file:///home/aby/Antigravity_Project/src/hooks/useVisitorTracker.ts) | Baru | Hook pelacakan route publik + heartbeat 45 detik (hanya saat `document.visibilityState === 'visible'` dan bukan `/admin/*`). |
| [src/components/common/TextileMotifAccent.tsx](file:///home/aby/Antigravity_Project/src/components/common/TextileMotifAccent.tsx) | Baru | Aksen geometris Subahnale SVG ringan (`opacity ~5.5%–6%`) khusus header & sidebar tanpa mengganggu area data padat. |
| [src/components/admin/VisitorTrendChart.tsx](file:///home/aby/Antigravity_Project/src/components/admin/VisitorTrendChart.tsx) | Baru | Grafik tren SVG dua seri ringan (tanpa dependensi eksternal tambahan), tombol rentang **7 Hari / 30 Hari**, tooltip interaktif, serta state loading/error/empty. |
| [src/components/admin/AdminLayout.tsx](file:///home/aby/Antigravity_Project/src/components/admin/AdminLayout.tsx) | Didesain Ulang | Sidebar *Editorial Museum Control Room* dengan pengelompokan **RINGKASAN**, **KOLEKSI & ARSIP**, **MANAJEMEN**, aksen motif tenun halus, navigasi responsif mobile, dan penyaringan item menu berdasarkan role aktual. |
| [src/pages/admin/AdminDashboardPage.tsx](file:///home/aby/Antigravity_Project/src/pages/admin/AdminDashboardPage.tsx) | Didesain Ulang | Arsitektur informasi kurator: Header (`Selamat datang, Kurator`), 4 metrik pengunjung live + konten terbit, grafik tren, panel aktivitas realtime bebas PII, ringkasan inventaris CMS, konten terpopuler, serta log kurasi ringkas dengan pemisahan label **`Server Gateway`** vs **`Catatan Klien`**. |
| [src/App.tsx](file:///home/aby/Antigravity_Project/src/App.tsx) | Diperbarui | Memasang `useVisitorTracker()` khusus di dalam `PublicLayout`. |

---

### 3. Arsitektur Analitik, Skema Appwrite & Keamanan

- **Aliran Data Analitik:**
  `Public Frontend (useVisitorTracker)` → `museum-public-api v1.4.0 (POST /analytics/track)` → *validasi + rate-limit + dedupe server* → `TablesDB (visitor_sessions, visitor_daily_stats, visitor_page_stats)` → `Appwrite Realtime + museum-admin-media v4.1.0 (GET /analytics/summary)` → `AdminDashboardPage`.
- **Sumber Daya Appwrite Cloud yang Digunakan (Sudah Ada & Diverifikasi):**
  - `visitor_sessions` (`$permissions: ['read("team:museum-admins")']`, `rowSecurity: false`)
  - `visitor_daily_stats` (`$permissions: ['read("team:museum-admins")']`, `rowSecurity: false`)
  - `visitor_page_stats` (`$permissions: ['read("team:museum-admins")']`, `rowSecurity: false`)
  - **0 perubahan destruktif**, **0 tabel baru di luar 20 tabel aktif**, **0 data koleksi museum tersentuh**.
- **Privasi & Isolasi Keamanan:**
  - Klien publik tidak pernah membaca atau menulis langsung ke tabel `visitor_*` (`HTTP 401` teruji langsung).
  - Tidak ada IP mentah, email, maupun `sessionId` yang dikembalikan ke UI dashboard (`Tanpa PII`).
  - Sidebar menyembunyikan item di luar wewenang (`Kategori Budaya` & `Pengguna & Akses` disembunyikan bagi `admin_kkn`; `Pengaturan Museum` hanya tampil bagi `super_admin`), sementara otorisasi sebenarnya tetap dijaga oleh backend Appwrite.

---

### 4. Hasil Verifikasi & Status Pengujian

- **Build & Keamanan Statis:**
  - `npx tsc -b && npm run build`: **PASS** (`7.75s`, bundle JS utama `313.51 kB` / `66.68 kB` gzip).
  - `grep -rn "storage\." src/`: **`NO_DIRECT_STORAGE_CALLS`**.
  - `grep` secret & password check + `find dist -name "*.map"`: **`NO_SECRETS_IN_SRC_OR_DIST`**, **`0` file source map**.
- **Regresi Unit Security (`unit_phase5_4.test.mjs`):** **10 / 10 PASS** (`124.5 ms`).
- **Live Security, RBAC & Realtime Browser Suite (`verify_phase6_1.mjs`):** **4 / 4 PASS** (`0` page error):
  - `SEC-01`: Baca/tulis anonim langsung ke `visitor_sessions` ditolak **`401`**, `/analytics/track` untuk rute `/admin/media` maupun `sessionId` tidak valid ditolak **`400`**, `GET /analytics/summary` tanpa token ditolak **`401`**.
  - `SEC-02`: Akun terautentikasi non-tim ditolak pada `GET /analytics/summary` (`HTTP 403`).
  - `ROLE-SIDEBAR`: Menu sidebar terverifikasi nyata di Chrome untuk akun `admin_kkn`, `admin_desa`, dan `super_admin`.
  - `REALTIME-LIVE`: Sesi Chrome publik terpisah membuka `/` dan `/motifs/motif-subahnale` memicu pembaruan otomatis tanpa reload pada `AdminDashboardPage` (`Pengunjung Aktif: 2`, `Pengunjung Unik Hari Ini: 2`, `Total Page Views: 3`, serta `/motifs/motif-subahnale` tampil di aktivitas & konten terpopuler), lolos layout Desktop (`1280×800`) dan Mobile (`390×844`) dengan `0` horizontal overflow.
- **Kebersihan Pasca-Uji:** `finalUsers: 3`, `visitor_sessions: 0`, `visitor_daily_stats: 0`, `visitor_page_stats: 0`.

---

### 5. Keterbatasan & Kesiapan Preview Deployment

- **Preview Deployment:** Perubahan siap dideploy ke Vercel Preview (`npx vercel login && npx vercel` tanpa `--prod`). Belum dilakukan deployment Production sesuai batasan.
- **Lingkup Heartbeat & Multi-Container:** Jika suatu sesi tab publik tetap idle di latar belakang tanpa berinteraksi, Appwrite `visitor_sessions` menandai sesi tidak aktif setelah 2 menit; rate limiter `/analytics/track` berjalan per kontainer hangat Function.
- **Non-Media `audit_logs`:** Pembedaan visual antara log **`Server Gateway`** (otoritatif) dan **`Catatan Klien`** (non-otoritatif untuk CRUD teks) telah ditampilkan jelas di dashboard sambil menunggu migrasi CMS CRUD gateway di fase berikutnya.
