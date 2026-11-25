# Laporan Pengujian Penerimaan Pengguna (Phase 5 UAT Report)
## Museum Digital Pringgasela Selatan

---

### 1. Ruang Lingkup Pengujian

Pengujian penerimaan sistem (*User Acceptance Testing*) dijalankan setelah perbaikan kode final dan build produksi (`npm run build`), menggunakan skrip terotomasi terintegrasi (`uat_full_suite.mjs`) melawan infrastruktur produksi Appwrite Cloud (`6affdaa0003c416ecdb0`) serta peramban Chromium headless nyata pada resolusi desktop (`1536x1024`) dan seluler (`390x844`) melawan server pratinjau (`vite preview` di `127.0.0.1:4173`).

---

### 2. Ringkasan Hasil Uji Terotomasi (Post-Edit Final Run)

| ID Uji | Skenario Pengujian | Lingkungan & Aktor | Hasil Observasi Aktual | Status |
| :--- | :--- | :--- | :--- | :---: |
| `UAT-SEC-01` | Blokir pembacaan langsung TablesDB oleh pengunjung anonim | Klien SDK Anonim | `weaving_motifs`: `total=0`, `museum_settings`: `total=0`, `getRow('motif-subahnale')`: ditolak, `audit_logs`: HTTP `401` | **PASS** |
| `UAT-SEC-02` | Isolasi berkas Storage publik vs privat | HTTP `GET` Storage | `public-motif-sample`: HTTP `200`; `private-kkn-archive` (tanpa sesi): HTTP `404` | **PASS** |
| `UAT-API-01` | Health check Public API v1.1.0 & anti-kebocoran draf | Appwrite Function `museum-public-api` | `version=1.1.0`, `motifs.total=1`, `GET /motifs/motif-draft-rahasia`: HTTP `404` | **PASS** |
| `UAT-RBAC-KKN` | Alur penuh Admin KKN: unggah publik/privat, buat draf motif dwibahasa + lampiran media, ajukan `in_review`, uji batas RBAC | `kkn@pringgasela.desa.id` | Unggah & draf `in_review` + audit log sukses; `audit_logs` baca, ubah `museum_settings`, & `deleteRow` seluruhnya diblokir (`401`) | **PASS** |
| `UAT-API-02` | Status `in_review` tidak bocor ke website publik | Public API | Motif uji `uat-motif-*` berstatus `in_review` tidak muncul di `/motifs` & `/motifs/:slug` mengembalikan `404` | **PASS** |
| `UAT-RBAC-DESA` | Alur Admin Desa: tambah diagram ke-2 & urutkan `#1`, terbitkan motif (`reviewedById`), buat Kriya `batik_sasambo` + Budaya dengan audio chant + Draf Sejarah, baca `audit_logs` | `admindesa@pringgasela.desa.id` | Seluruh kurasi & baca log sukses (`auditTotal=1`); ubah `museum_settings` & `deleteRow` diblokir (`401`) | **PASS** |
| `UAT-API-03` | Resolusi multimedia Public API, pemfilteran berkas privat, urutan galeri, dan atribusi tokoh budaya | Public API (`/motifs`, `/crafts`, `/cultures`, `/history`) | 2 foto publik muncul berurutan (`pubFile2` diagram `#1`), file PDF privat tidak bocor (`privLeaked=false`), list endpoint menyertakan `media`, budaya menyertakan audio & profil `Ibu Mariam`, sejarah draft tersembunyi | **PASS** |
| `UAT-CLEANUP` | Penghapusan berantai (*cascade delete*) oleh Super Admin atas seluruh data/berkas/log sintetik UAT | `superadmin@pringgasela.desa.id` + CLI | Seluruh entri `uat-*`, terjemahan, relasi media, dan berkas Storage terhapus bersih; data asli & 5 baris `museum_settings` utuh | **PASS** |
| `UAT-UI-01` | Tampilan Beranda publik pada desktop `1536x1024` | Chromium Headless | Judul H1 tampil utuh, `overflow: false`, `8` gambar dimuat (`brokenCount: 0`) | **PASS** |
| `UAT-UI-02` | Detail Motif Subahnale, pengalihan bahasa `ID -> EN`, & tata letak mobile `390x844` | Chromium Headless Mobile | ID=`Motif Subahnale`, `overflow: false`, sesudah toggle EN=`Subahnale Motif` | **PASS** |
| `UAT-UI-03` | Seluruh rute publik sekunder (`/crafts`, `/cultures/dzikir-saman-pringgasela`, `/history`, `/curatorial`, `/about`) | Chromium Headless Desktop | Semua rute merender konten lengkap & judul H1 | **PASS** |
| `UAT-UI-04` | Perlindungan rute `/admin` saat belum login | Chromium Headless | Otomatis mengarahkan ke `/admin/login` | **PASS** |
| `UAT-UI-05` | Login browser Admin KKN, banner kunci RBAC (Kategori & Pengaturan), tampilan Pengguna tidak kosong, dan kontrol modal Motif | Chromium Headless | `/admin/categories` menampilkan pembatasan KKN, `/admin/settings` Mode Baca-Saja, `/admin/users` menampilkan `Profil Kurator` & `SUPER_ADMIN`, modal Motif membuka `in_review` sambil menonaktifkan `published` + menampilkan panel galeri & input EN | **PASS** |
| `UAT-UI-06` | Login browser Super Admin, ketahanan sesi setelah *reload*, Log Aktivitas Dashboard, & kunjungan seluruh 9 sub-rute CMS | Chromium Headless | Sesi bertahan saat `Page.reload`, kartu `Log Aktivitas Kurasi Terbaru` & `Babak Sejarah` tampil, 9 rute `/admin/*` bersih tanpa error | **PASS** |
| `UAT-UI-07` | Verifikasi nihil galat runtime browser & jaringan aset | Chromium Console & Network | `pageErrors: 0`, `consoleErrors: 0`, `httpFailures: []` | **PASS** |

**Ringkasan Teknis Terukur:** `15 / 15` skenario lulus (`100%`) setelah kompilasi produksi final (`tsc -b && vite build`).

---

### 3. Uji Penerimaan Editorial Manusia (Menunggu Pelaksanaan Tim Desa & KKN)

Item berikut bersifat non-otomasi karena memerlukan keputusan budaya manusia di Desa Pringgasela Selatan:
1. Validasi teks terjemahan Inggris dan penamaan lokal Sasak (*gedogan*, *sungkit*, *Subahnale*, *Dzikir Saman*) bersama tokoh adat setempat.
2. Konfirmasi persetujuan eksplisit dari penenun (contoh: Ibu Mariam) sebelum menandai foto potret tokoh atau rekaman audio ritual sebagai `Publik`.
3. Peninjauan berkala atas draf hasil pendataan mahasiswa KKN oleh Admin Desa sebelum status diubah ke `published`.
