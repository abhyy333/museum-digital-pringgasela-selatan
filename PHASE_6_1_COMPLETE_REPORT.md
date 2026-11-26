# Laporan Lengkap Phase 6.1 — Admin Dashboard Redesign & Realtime Visitor Analytics
## Museum Digital Pringgasela Selatan

**Tanggal Audit, Implementasi & Pengujian:** 26 November 2026  
**ID Proyek Appwrite:** `6affdaa0003c416ecdb0` (`https://sgp.cloud.appwrite.io/v1`)  
**Konsep Desain:** *Editorial Museum Control Room* (Palet Warm Ivory `#F3EEE5`, Aged Paper `#E9DFD0`, Terracotta `#984323`, Indigo Textile `#243A4A`, Dark Charcoal `#25221F`, Soft Linen `#D9CCB9`)

---

### 1. Ringkasan Eksekutif & Status Fungsional

Phase 6.1 telah merombak total antarmuka dashboard kurator dan sidebar navigasi sekaligus membangun arsitektur pelacakan kunjungan publik secara anonim, hemat penulisan database, aman dari manipulasi klien, dan **diperbarui secara otomatis (real-time)** menggunakan **Appwrite Realtime WebSocket** + sinkronisasi interval `30` detik.

Seluruh fitur baru diuji langsung pada browser Chromium nyata terhadap layanan Appwrite Cloud aktif (bukan nilai simulasi/hardcoded), dan seluruh data pengujian telah dibersihkan kembali ke titik nol sebelum serah terima.

---

### 2. Daftar Berkas Berubah & Komponen Didesain Ulang

#### Berkas Baru
- [scripts/analytics_migration.mjs](file:///home/aby/Antigravity_Project/scripts/analytics_migration.mjs) — Skrip migrasi TablesDB idempoten (`up` / `down` rollback) untuk 3 tabel analitik baru.
- [src/appwrite/analyticsApi.ts](file:///home/aby/Antigravity_Project/src/appwrite/analyticsApi.ts) — Klien pelacakan anonim (`sessionStorage`), pengambil ringkasan analitik terotentikasi JWT, serta subscriber `Realtime` (`Channel.tablesdb(...)`).
- [src/hooks/useVisitorTracker.ts](file:///home/aby/Antigravity_Project/src/hooks/useVisitorTracker.ts) — Hook pelacakan route publik otomatis + heartbeat visibilitas tab setiap `40` detik (menonaktifkan pelacakan pada rute `/admin`).
- [src/components/common/TextileMotifAccent.tsx](file:///home/aby/Antigravity_Project/src/components/common/TextileMotifAccent.tsx) — Ornamen geometri tenun Pringgasela (`TextileMotifBand` beropasitas 5% dan `TextileDivider`), ringan tanpa aset berat dan tidak diletakkan di belakang tabel/grafik padat.
- [src/components/admin/VisitorTrendChart.tsx](file:///home/aby/Antigravity_Project/src/components/admin/VisitorTrendChart.tsx) — Grafik SVG editorial responsif buatan internal (tanpa library eksternal besar) dengan toggle **7 Hari / 30 Hari**, pembeda garis **Page Views** vs **Pengunjung Unik**, tooltip interaktif (hover & fokus keyboard), serta state loading/error/kosong.

#### Berkas Dimodifikasi / Didesain Ulang
- [src/components/admin/AdminLayout.tsx](file:///home/aby/Antigravity_Project/src/components/admin/AdminLayout.tsx) — Sidebar *Editorial Museum Control Room* selebar `240px` (`w-60`), tajuk `Panel Kurator` dengan `MuseumLogo` & `TextileMotifBand`, pengelompokan **Ringkasan**, **Koleksi Budaya**, dan **Pengelolaan**, serta penyembunyian menu berdasarkan peran RBAC aktual (`Kategori Budaya` & `Pengguna & Akses` hanya tampil bagi `canPublish`; `Pengaturan Museum` hanya bagi `isSuperAdmin`).
- [src/pages/admin/AdminDashboardPage.tsx](file:///home/aby/Antigravity_Project/src/pages/admin/AdminDashboardPage.tsx) — Didesain ulang total sesuai arsitektur informasi Section 4:
  - Header `Selamat datang, Kurator`, tanggal WITA, status analitik realtime, dan aksen tenun halus.
  - 4 Metrik Realtime Visitor Overview berbahasa Indonesia utuh (menghapus singkatan `MTF`, `CRF`, `CLT`, `HST`, `CTR`, `DFT`, `MDA`): **Pengunjung Aktif**, **Pengunjung Unik Hari Ini**, **Total Page Views**, dan **Konten Diterbitkan**.
  - Grafik tren (`VisitorTrendChart`) berpasangan dengan panel **Aktivitas Kunjungan** anonim (perangkat, kategori referrer, path halaman, tanpa IP/email/PII).
  - **Ringkasan Koleksi & Kurasi** terhubung langsung ke setiap halaman pengelolaan CMS.
  - **Popularitas Konten Publik** (berdasarkan `visitor_page_stats` + resolusi judul terpublikasi & thumbnail publik jika tersedia) dan panel ringkas **Aktivitas Kuratorial** (membedakan label `Server` vs `Klien`).
- [src/App.tsx](file:///home/aby/Antigravity_Project/src/App.tsx) — Memasang `useVisitorTracker()` di dalam `PublicLayout`.
- [src/appwrite/publicApi.ts](file:///home/aby/Antigravity_Project/src/appwrite/publicApi.ts) — Memperbaiki penerusan parameter query ke endpoint `/executions` Appwrite Function.
- [functions/museum-public-api/src/main.js](file:///home/aby/Antigravity_Project/functions/museum-public-api/src/main.js) — Ditingkatkan ke **`v1.4.0`** (Deployment `6b087545b1de796dbe8e`) dengan endpoint write-only **`POST /analytics/track`**, pemecahan query-string path aman, penolakan `GET /analytics*` (`HTTP 403`), validasi rute & deduplikasi pageview 45 detik, rate limit memori sesi & IP-hash, dan retensi otomatis sesi >48 jam.
- [functions/museum-admin-media/src/main.js](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/main.js) — Ditingkatkan ke **`v4.1.0`** (Deployment `6b08734522002f25f8cd`) dengan endpoint terotentikasi **`GET /analytics/summary`** (khusus anggota aktif tim `museum-admins`).
- [appwrite.config.json](file:///home/aby/Antigravity_Project/appwrite.config.json) — Sinkronisasi scope `rows.write` pada `museum-public-api`.

---

### 3. Arsitektur Analitik, Skema Database & Keamanan

#### A. Alur Data & Alasan 2 Function
Appwrite Cloud pada paket saat ini membatasi jumlah maksimal Function pada angka **2 Function** (terverifikasi saat audit: `Error: The maximum number of functions allowed for the selected plan has reached`). Oleh karena itu, arsitektur menggunakan:
```text
Website Publik (useVisitorTracker, anonim sessionStorage)
   └── POST /executions -> museum-public-api v1.4.0 (POST /analytics/track)
         ├── Validasi skema, rute publik whitelist (blokir /admin), & rate-limit (25/mnt sesi, 90/mnt IP-hash)
         ├── Deduplikasi pageview (45s) & retensi sesi >48 jam
         └── Server API Key menulis ke 3 tabel analitik TablesDB
               └── Event perubahan dipancarkan lewat Appwrite Realtime (hanya read("team:museum-admins"))
                     └── Admin Dashboard memanggil GET /analytics/summary (JWT + tim verified) pada museum-admin-media v4.1.0
```

#### B. Perubahan Database & Indeks (`museum_digital`)
Dibuat secara terprogram via [scripts/analytics_migration.mjs](file:///home/aby/Antigravity_Project/scripts/analytics_migration.mjs) (**tanpa menyentuh 17 tabel konten existing**):

1. **`visitor_sessions`** (`permissions: ["read(\"team:museum-admins\")"]`)
   - Kolom: `sessionId` (string 64, required), `currentPath` (string 180, required), `pageTitle` (string 160), `referrerCategory` (string 24), `deviceCategory` (string 16), `lastSeenAt` (datetime, required), `startedDate` (string 10 WITA, required), `pageViewsCount` (integer, required).
   - Indeks: `idx_vs_session` (unique `ASC`), `idx_vs_lastseen` (key `DESC`), `idx_vs_date` (key `DESC`).
   - Retensi: Maks 1 baris per sesi; dibersihkan otomatis secara bertahap bila `lastSeenAt < 48` jam lalu.
2. **`visitor_daily_stats`** (`permissions: ["read(\"team:museum-admins\")"]`)
   - Kolom: `dateKey` (string 10 `YYYY-MM-DD` WITA, required), `uniqueVisitors` (integer), `pageViews` (integer), `mobileViews` (integer), `desktopViews` (integer).
   - Indeks: `idx_vds_date` (unique `DESC`).
3. **`visitor_page_stats`** (`permissions: ["read(\"team:museum-admins\")"]`)
   - Kolom: `pageKey` (string 180, required), `contentType` (string 24, required), `slug` (string 128), `titleHint` (string 160), `pageViews` (integer), `lastViewedAt` (datetime, required).
   - Indeks: `idx_vps_pagekey` (unique `ASC`), `idx_vps_views` (key `DESC`).

**Rollback:** Jalankan `node scripts/analytics_migration.mjs down` untuk menghapus hanya 3 tabel analitik baru tanpa menyentuh tabel museum lainnya.

#### C. Kontrol Privasi, Keamanan & RBAC
- Tidak menyimpan alamat IP mentah (IP hanya di-hash dengan salt runtime acak di RAM untuk rate limiter), email, `userId`, maupun *browser fingerprinting*.
- Pengunjung publik tidak memiliki izin baca maupun tulis langsung ke tabel analitik (`401`/`403` terverifikasi langsung).
- Permintaan `GET /analytics*` via `museum-public-api` ditolak dengan `HTTP 403`.
- Pelacakan jalur `/admin*` ditolak server dengan `HTTP 400`.
- `GET /analytics/summary` di `museum-admin-media v4.1.0` mewajibkan Bearer JWT valid + keanggotaan aktif tim `museum-admins`.
- Kebijakan RBAC lama (`Admin KKN` tidak dapat publish/delete; `Admin Desa` tidak dapat mengubah `Pengaturan Museum` atau permanent delete; `Super Admin` penuh) tetap utuh, termasuk penyembunyian menu manajemen terlarang pada sidebar.

---

### 4. Status Fitur Saat Ini (Implemented vs Verified vs Pending)

| Komponen / Fitur | Status | Keterangan Verifikasi |
| :--- | :---: | :--- |
| **Redesign Sidebar & Dashboard Editorial** | **Selesai & Teruji** | Terverifikasi di desktop `1280x800` dan mobile `375x812` (`0` overflow, `0` console error). |
| **Pelacakan Publik & Heartbeat + Deduplikasi** | **Selesai & Teruji** | Teruji langsung via Chrome & API (`counted: true`, ulangan 45s `deduped: true`, tolak `/admin` `400`). |
| **Update Dashboard Realtime (Tanpa Reload)** | **Selesai & Teruji** | Teruji di Chrome: membuka dashboard lalu mengirim pageview baru -> counter unik naik otomatis (`2 -> 3`) & aktivitas `/cultures` muncul lewat Appwrite Realtime (`PASS [REALTIME-PUSH]`). |
| **Grafik Tren 7 Hari / 30 Hari & Popularitas** | **Selesai & Teruji** | Grafik SVG terender dengan toggle 7/30 hari & daftar popularitas memuat `Motif Tenun Subahnale`. |
| **Kesiapan Vercel Preview Deployment** | **Siap (Belum Dideploy CLI)** | Build `dist/` sukses; deployment `*.vercel.app` tetap menunggu `vercel login` / PR GitHub (tidak menyentuh Production). |

---

### 5. Keterbatasan Diketahui (*Known Limitations*)

1. **Sinkronisasi Penurunan Aktif (Window 2 Menit):** Saat tab pengunjung ditutup tanpa event keluar, sesi tetap dianggap aktif sampai melewati batas `120` detik dan turun otomatis pada siklus polling `30` detik atau event Realtime berikutnya.
2. **Scope Rate Limiter Ingestion:** Rate limiter `museum-public-api` berjalan di memori per kontainer hangat Function, efektif menahan burst per kontainer tetapi tidak berbagi state antar banyak kontainer sekaligus.
3. **Konkurensi Agregator Harian:** Penambahan `uniqueVisitors` dan `pageViews` memakai read-then-update; pada trafik serentak ribuan request per detik di masa depan disarankan menggantinya dengan operasi `incrementRowColumn` atau antrean batch.
4. **Status Audit Log Non-Media:** Aktivitas kurasi non-media tetap memakai `audit_logs` sisi klien (berlabel `Klien`), sedangkan aktivitas media gateway bertanda otoritatif `Server`.

---

### 6. Hasil Pengujian & Kebersihan Akhir

- **`npx tsc -b && npm run build`**: Lulus bersih (`0` error, `8.36s`, `dist/` siap).
- **`node --test` (`unit_phase5_4.test.mjs` + `frontend_phase6.test.mjs`)**: **12 / 12 PASS** (termasuk scan nol secret, nol source map `.map`, nol pemanggilan `storage.*`, dan uji seluruh endpoint publik).
- **`verify_phase6_1_analytics.mjs` (Live Appwrite Cloud + Real Chromium)**:
  - `PASS [SEC-ANALYTICS]`: Read/write publik ke tabel analitik ditolak (`401`), `GET /analytics` publik ditolak (`403`), summary tanpa JWT ditolak (`401`), path `/admin` ditolak (`400`).
  - `PASS [TRACK-DEDUP]`: Pageview terhitung (`200`), ulangan cepat terdeduplikasi (`202 deduped: true`).
  - `PASS [REALTIME-PUSH]`: Dashboard memperbarui counter unik dan aktivitas terkini secara live tanpa reload halaman.
  - `PASS [MOBILE-DASHBOARD]`: `375x812` bebas overflow horizontal.
  - `PASS [SIDEBAR-RBAC]`: Menu sidebar terverifikasi sesuai hak akses `Admin KKN`, `Admin Desa`, dan `Super Admin`.
  - `PASS [CONSOLE-CLEAN]`: `0` console error dan `0` uncaught exception.
- **Verifikasi Kebersihan Pasca-Uji (`cleanupCheck`)**: `finalUsers: 3`, `visitorSessions: 0`, `visitorDailyStats: 0`, `visitorPageStats: 0`.
