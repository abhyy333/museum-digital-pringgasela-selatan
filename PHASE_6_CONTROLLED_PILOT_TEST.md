# Laporan Pengujian & Controlled Pilot Phase 6
## Museum Digital Pringgasela Selatan

**Tanggal Pengujian:** 27 November 2026  
**Lingkungan Teruji:**
- Build lokal hasil `tsc -b && vite build` (`dist/` disajikan lewat `http://localhost:4173`)
- Browser nyata: Google Chrome headless via Chrome DevTools Protocol (CDP)
- Backend Cloud aktual: Appwrite (`6affdaa0003c416ecdb0`), `museum-public-api v1.3.0`, `museum-admin-media v4.0.0`

---

### 1. Hasil Pengujian Tahap A (Verifikasi Lokal & Security Scans)

| Pemeriksaan | Perintah / Target | Hasil Aktual | Status |
| :--- | :--- | :--- | :---: |
| **TypeScript Typecheck & Production Build** | `npx tsc -b && npm run build` | `0` error; selesai `8.29s`; menghasilkan `dist/index.html` + chunk JS/CSS | **PASS** |
| **Direct Storage Client Scan** | `grep -rn "storage\." src/` | `NO_DIRECT_STORAGE_CALLS` (`0` panggilan langsung mutasi Storage di `src/`) | **PASS** |
| **Secret & Hardcoded Password Scan** | `grep -rnE "UPLOAD_SESSION_SECRET\|APPWRITE_API_KEY\|Pringgasela2026\|x-appwrite-key" src/ dist/` | `NO_SECRETS_IN_SRC_OR_DIST` | **PASS** |
| **Source Map Leak Scan** | `find dist -name "*.map"` | `0` berkas source map di `dist/` | **PASS** |
| **Unit Security Engine Tests** | `node --test unit_phase5_4.test.mjs` | **10 / 10 PASS** (`134.2 ms`) | **PASS** |

---

### 2. Verifikasi Endpoint `museum-public-api v1.3.0`

Pengujian langsung terhadap ke-12 endpoint + proteksi draf:
- `/health` -> `HTTP 200`
- `/motifs` -> `HTTP 200` (`motif-subahnale` tayang; draf tidak ikut)
- `/motifs/motif-subahnale` -> `HTTP 200`
- **`/motifs/motif-arsip-rahasia-kkn` (unpublished)** -> **`HTTP 404`** (`{"error":"Motif not found or not published"}`)
- `/motifs/nonexistent-slug-999` -> `HTTP 404`
- `/crafts` -> `HTTP 200`, `/crafts/nonexistent-craft` -> `HTTP 404`
- `/cultures` -> `HTTP 200`, `/cultures/nonexistent-culture` -> `HTTP 404`
- `/history`, `/categories`, `/contributors`, `/settings` -> semua `HTTP 200`

---

### 3. Hasil Real-Chrome End-to-End Controlled Pilot (`pilot_phase6_e2e.mjs`) — 6 / 6 PASS

Pengujian simulasi multi-peran dijalankan di Google Chrome pada viewport Desktop (`1280×800`) dan Mobile (`390×844`) dengan akun sementara terisolasi (`p6out*`, `p6kkn*`, `p6desa*`, `p6owner*`):

| ID | Peran / Konteks | Skenario Teruji di Browser | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- | :---: |
| **`PUB-HOME`** | Pengunjung Umum (`Desktop 1280×800` & `Mobile 390×844`) | Memuat `/`, arsip live Appwrite Cloud tampil, `scrollWidth <= innerWidth` di desktop & mobile, toggle bahasa `ID` ↔ `EN` mengubah antarmuka dan kembali bersih. | 0 horizontal overflow; arsip & toggle dwibahasa berfungsi | **PASS** |
| **`PUB-ROUTES`** | Pengunjung Umum | Navigasi `/motifs/motif-subahnale` (verifikasi `SBN-01` & `<title>` dinamis), akses paksa `/motifs/motif-arsip-rahasia-kkn` (diblokir `"Motif Tidak Ditemukan"`), serta render `/crafts`, `/cultures`, `/curatorial`, `/history`, `/about`. | Draf tersembunyi pada akses URL langsung; seluruh rute publik tampil | **PASS** |
| **`AUTH-GUARD`** | Anonim & Akun Non-Tim (`outsider`) | Akses langsung `/admin/media` tanpa sesi -> redirect ke `/admin/login`; halaman login bebas preset kata sandi & memasang `<meta name="robots" content="noindex, nofollow">`; akun non-`museum-admins` ditolak masuk CMS. | Redirect bersih tanpa infinite loop; outsider ditolak | **PASS** |
| **`PILOT-KKN`** | `admin_kkn` | Login via `/admin/login`, verifikasi badge `"Admin KKN"`, buka `/admin/media` -> modal unggah mengunci opsi `"Publik"` (disabled), unggah `pilot-motif.png` melalui `MediaUploader` -> Gateway `v4.0.0`, status otomatis `"Privat"`, logout bersih. | Upload browser sukses via Gateway (`Privat`); tombol publik terkunci | **PASS** |
| **`PILOT-DESA`** | `admin_desa` | Login, jalankan tombol **`Audit Rekonsiliasi`** (`GET /media/reconcile`), publikasikan `pilot-motif.png` -> badge `"Publik"`, tarik kembali -> `"Privat"`, unggah `pilot-vector.svg` -> opsi `"Publik"` disabled di uploader & badge `"Karantina Privat (Tak Dapat Terbit)"` di daftar media. | Rekonsiliasi, Publish/Unpublish, dan kunci UI Karantina SVG bekerja nyata | **PASS** |
| **`PILOT-OWNER`** | `super_admin` | Login, hapus permanen kedua berkas pilot (`pilot-motif.png` & `pilot-vector.svg`) melalui tombol `"Hapus Media"` -> Gateway `DELETE /media/:id`. Pemeriksaan jaringan browser mencatat **0** panggilan `POST/PUT/PATCH/DELETE` langsung ke Appwrite Storage, **0** error halaman tak tertangani (`pageErrorsCount: 0`), dan **0** error konsol (`consoleErrorsCount: 0`). | Hapus kaskade sukses, 0 mutasi Storage langsung, 0 JS error | **PASS** |

---

### 4. Status Kebersihan Pasca-Pilot (`cleanupCheck`) & Catatan Staf Asli

- Verifikasi akhir otomatis pasca-teardown:
  - `finalUsers`: **`3`** (seluruh akun sementara `p6*` dihapus)
  - `finalFiles`: **`["public-motif-sample", "private-kkn-archive"]`** (`0` file sisa uji)
  - `finalAssets`: **`0`** baris `media_assets`
  - `finalAudit`: **`0`** baris `audit_logs`
- **Catatan Controlled Pilot Staf Manusia (Tahap C):** Pengujian E2E di atas telah memvalidasi alur autentikasi, role RBAC, upload gateway, preview privat, publish/unpublish, karantina, dan rekonsiliasi secara nyata melalui browser Chrome terhadap Appwrite Cloud; uji penerimaan akhir oleh personel asli desa/KKN pada domain **Vercel Preview** dijalankan segera setelah akun Vercel pengguna melakukan login & menerbitkan Preview URL.
