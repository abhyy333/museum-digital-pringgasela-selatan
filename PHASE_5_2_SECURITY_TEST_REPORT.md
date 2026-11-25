# Laporan Pengujian Keamanan & Regresi Tahap 5.2
## Museum Digital Pringgasela Selatan

---

### 1. Ringkasan Eksekusi

Pengujian dijalankan langsung terhadap infrastruktur Appwrite Cloud proyek `6affdaa0003c416ecdb0`, gateway `https://museum-admin-media-pringgasela.appwrite.network` (`deployment 6b064772a59772b9f7ca`), `museum-public-api` v1.2.0 (`6b06405ef41e827d8977`), dan aplikasi frontend terkompilasi (`vite preview` pada `http://127.0.0.1:4173`) menggunakan Google Chrome headless melalui Chrome DevTools Protocol (CDP).

* **Waktu Eksekusi Final:** `2026-11-25T02:36:25Z`
* **Kompilasi TypeScript & Bundle Vite:** `npx tsc -b && npm run build` lulus (`0` error, 1648 modul, `5.27s`).
* **Pemindaian Rahasia (`APPWRITE_API_KEY`):** `0` temuan pada `src/` maupun `dist/` (`NO_SECRETS_IN_SRC_OR_DIST`).
* **Total Kasus Uji Otomatis & Browser:** **16 / 16 LULUS (100%)**.
* **Akun Pengujian:** Akun KKN produksi `adminkkn-peneliti` (`abhyy333@gmail.com`) **tidak disentuh sama sekali**; seluruh uji KKN & keanggotaan dicabut dijalankan memakai akun sementara `uat-kkn-*` dan `uat-rev-*` yang langsung dihapus bersih pada blok `finally`.

---

### 2. Hasil Matriks Keamanan (`SM-01` s/d `SM-13`)

| ID | Skenario Uji | Hasil | Bukti & Observasi Aktual |
| :--- | :--- | :---: | :--- |
| **SM-01** | Probe `/health` & pemeriksaan ACL bucket `museum-media` | **LULUS** | `GET /health` -> `HTTP 200` (`version: "2.0.0"`) tanpa kebocoran metadata; `$permissions` bucket bebas dari `create(...)`. |
| **SM-02** | Permintaan anonim ke `/me`, `/upload-chunk`, `/publish\|unpublish`, `DELETE` | **LULUS** | Seluruhnya ditolak dengan **`HTTP [401, 401, 401, 401]`**. |
| **SM-03** | JWT palsu / kedaluwarsa (`Authorization: Bearer bad.jwt.token`) | **LULUS** | Ditolak dengan **`HTTP 401`** pada `/me` maupun `/upload-chunk`. |
| **SM-04** | Akun valid Appwrite yang dicabut dari tim `museum-admins` memegang JWT valid | **LULUS** | Ditolak dengan **`HTTP 403`** (`"Akses ditolak: akun bukan anggota aktif tim museum-admins."`) pada `/me` & `/upload-chunk`. |
| **SM-05** | Upaya bypass langsung `storage.createFile(..., ['read("any")'])` untuk KKN, Desa, & Super Admin | **LULUS** | Ditolak langsung oleh Appwrite Storage ACL dengan **`HTTP 401`** pada ketiga peran (`{ kkn: 401, desa: 401, owner: 401 }`). |
| **SM-06** | KKN mengirim header spoof `X-Requested-Role: super_admin` & `X-Is-Public: true` ke `/upload-chunk` | **LULUS** | Ditolak server dengan **`HTTP 403`** (`"Pelanggaran otorisasi: akun Admin KKN dilarang meminta akses publik pada unggahan media."`). |
| **SM-07** | Unggahan foto `.png` sah oleh KKN melalui `/upload-chunk` | **LULUS** | `HTTP 201`, `$permissions = ['read("team:museum-admins")']`, `media_assets` tercipta, dan akses anonim ke `/files/:id/view` ditolak (`HTTP 404`). |
| **SM-08** | KKN mencoba self-publish lewat gateway & `storage.updateFile` langsung | **LULUS** | Gateway menolak **`HTTP 403`**; Appwrite Storage menolak `storage.updateFile` dengan **`HTTP 401`**. |
| **SM-09** | Unggahan video *multi-chunk* `> 5 MiB` (`6.291.456 B` / 6 MiB, 2 chunk `.mp4`) & audio `.wav` via gateway | **LULUS** | Chunk 1 `HTTP 202` -> Chunk 2 `HTTP 201` (`fileSizeBytes: 6291456`, `mediaType: "video"`, `isPublic: false`); audio `.wav` `HTTP 201` (`mediaType: "audio"`, `isPublic: false`). |
| **SM-10** | Penolakan berkas berbahaya/spoof MIME (`.exe`+`image/jpeg`, `.html`+`image/png`, `.jpg`+`text/html`) & ukuran `> 50 MB` | **LULUS** | Ketiga spoof ekstensi/MIME ditolak **`HTTP 400`**; muatan `55.000.000 B` ditolak **`HTTP 413`**. |
| **SM-11** | Admin Desa publish, blokir publish file orphan tanpa `media_assets`, tolak delete, dan unpublish | **LULUS** | Publish `200` (view anonim `200`), publish `private-kkn-archive` ditolak `404`, `DELETE` ditolak `403`, unpublish `200` (view anonim kembali `404`). |
| **SM-12** | Simulasi kegagalan pembuatan baris `media_assets` (`X-Caption-Id` > 255 karakter) | **LULUS** | Mengembalikan **`HTTP 500`** (`Metadata gagal disimpan sehingga upload dibatalkan...`) dan `storage.listFiles().total` tetap sama (`filesBefore: 5 -> filesAfter: 5`) — berkas Storage di-rollback bersih tanpa orphan. |
| **SM-13** | Penghapusan permanen oleh Super Admin & verifikasi `audit_logs` server-side | **LULUS** | `DELETE /media/:id` mengembalikan `200`; teramati 8 baris `audit_logs` (`["create","publish","unpublish","delete"]`) bertanda `via: "server-gateway"`. |

---

### 3. Hasil Regresi End-to-End Browser Chrome (`REG-01` s/d `REG-03`)

| ID | Skenario Regresi | Hasil | Observasi |
| :--- | :--- | :---: | :--- |
| **REG-01** | Halaman Beranda Publik (`http://127.0.0.1:4173/`) | **LULUS** | Desain editorial hero & koleksi tampil utuh, 8 gambar dimuat sempurna (`brokenCount: 0`), zero console/page error. |
| **REG-02** | Alur UI `AdminMediaPage` & `MediaUploader` di Chrome (`Admindesa` upload & toggle -> `Super Admin` hapus) | **LULUS** | 100% permintaan mutasi melintasi `https://museum-admin-media-pringgasela.appwrite.network` (8 request `POST /upload-chunk`, `/publish`, `/unpublish`, `DELETE`), **`directBucketPostAttempts: []` (0 unggahan langsung Storage)**, `consoleErrors: []`, `pageErrors: []`. |
| **REG-03** | Kompatibilitas `museum-public-api` v1.2.0 | **LULUS** | `GET /motifs` -> `HTTP 200` (`motifCount: 1`, `motif-subahnale`); `GET /media/private-kkn-archive` -> ditolak (`HTTP 404`). |

---

### 4. Verifikasi Pembersihan Lingkungan Pasca-Uji

Pemeriksaan langsung via Appwrite CLI setelah skrip uji selesai memastikan basis data & penyimpanan kembali ke kondisi awal bersih:
* `users list`: `total: 3` (`superadmin-desa`, `admindesa-pringgasela`, `adminkkn-peneliti`).
* `storage list-files` (`museum-media`): `total: 2` (hanya `public-motif-sample` dan `private-kkn-archive`).
* `media_assets`: `total: 0`.
* `audit_logs`: `total: 0`.
