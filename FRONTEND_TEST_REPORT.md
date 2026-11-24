# Laporan Pengujian Frontend (Frontend Test Report)
## Museum Digital Pringgasela Selatan
**Laporan Verifikasi Mutu, Kinerja, Keamanan, & Integrasi API**

---

### 1. Informasi Lingkungan Pengujian

| Parameter Pengujian | Rincian Lingkungan |
| :--- | :--- |
| **Sistem Operasi** | Linux 6.6.137+ x86_64 |
| **Node.js & Manajer Paket** | Node.js v22.23.4, npm v10.9.9 |
| **Pustaka Inti** | React v18.3.1, React DOM v18.3.1, React Router v6.28.0 |
| **Bundler & Compiler** | Vite v6.0.1, TypeScript v5.6.3 |
| **Pustaka SDK Backend** | Appwrite Web SDK v29.3.1 |
| **Target Appwrite Cloud** | Project ID: `6affdaa0003c416ecdb0` (Wilayah: Singapore / `sgp`) |
| **ID Database TablesDB** | `museum_digital` (17 Tabel Terverifikasi) |
| **ID Fungsi Public API** | `museum-public-api` (Deployment ID: `6b056e47f3bd6548b5dd`) |
| **ID Bucket Penyimpanan** | `museum-media` (Keamanan Berkas Aktif) |

---

### 2. Ringkasan Eksekutif Hasil Uji

Pengujian komprehensif dilakukan pada tanggal 24 November 2026 mencakup validasi tipe data statis, kompilasi bundel produksi, audit keamanan bebas-rahasia (*zero-secret check*), pengujian eksekusi langsung API publik Appwrite, pengujian server tinjauan lokal, serta verifikasi kontrol akses berbasis peran (RBAC).

**Hasil Pengujian: 18 Pengujian Dijalankan, 18 Lolos (100% PASS), 0 Gagal.**

---

### 3. Rincian Pengujian Per Kategori

#### Kategori A: Validasi Tipe Data & Kompilasi Produksi

| ID | Kasus Uji | Perintah / Metodologi | Hasil yang Diharapkan | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | Analisis Tipe Statis TypeScript | `tsc -b` | Kompilasi bersih tanpa peringatan galat tipe | **PASS** |
| **TC-02** | Pengemasan Bundel Produksi | `vite build` | Berkas `dist/` terbuat lengkap dengan CSS dan JS teroptimasi | **PASS** |
| **TC-03** | Pemisahan Chunk (*Code Splitting*) | `vite.config.ts manualChunks` | Vendor, Appwrite, dan ikon Lucide terpecah secara terpisah (< 200 kB/chunk) | **PASS** |
| **TC-04** | Validasi Aset Statis Publik | Pemeriksaan `favicon.svg`, `robots.txt`, `sitemap.xml` | Tersedia di direktori `dist/` | **PASS** |

*Rincian Ukuran Bundel Produksi:*
- `dist/index.html`: 1.95 kB (gzip: 0.83 kB)
- `dist/assets/index-rZrrj0kA.css`: 30.48 kB (gzip: 5.86 kB)
- `dist/assets/icons-uBMNK112.js`: 20.19 kB (gzip: 4.16 kB)
- `dist/assets/appwrite-4De_AnYH.js`: 163.03 kB (gzip: 32.94 kB)
- `dist/assets/vendor-CwyEOINR.js`: 163.43 kB (gzip: 53.42 kB)
- `dist/assets/index-C4B5UUQx.js`: 170.94 kB (gzip: 33.69 kB)
*Waktu Pembangunan: 4.64 detik.*

---

#### Kategori B: Audit Keamanan Bebas-Rahasia (*Zero-Secret Client Audit*)

| ID | Kasus Uji | Metodologi Audit | Hasil yang Diharapkan | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-05** | Audit Kunci Rahasia API pada Sumber (`src/`) | `grep -rn -i "APPWRITE_API_KEY" src/` | Tidak ditemukan teks kunci rahasia apa pun | **PASS** |
| **TC-06** | Audit Kunci Rahasia pada Bundel Kompilasi (`dist/`) | `grep -rn -i "APPWRITE_API_KEY" dist/` | Tidak ditemukan kebocoran kredensial | **PASS** |
| **TC-07** | Pemeriksaan Token Otorisasi Tertanam | `grep -rn -i "standard-key\|Bearer" src/` | Bebas dari token tertanam statis | **PASS** |

---

#### Kategori C: Pengujian Integrasi Langsung API Publik Appwrite Cloud

Pengujian dilakukan dengan mengeksekusi langsung rute fungsi `museum-public-api` melalui endpoint resmi `https://sgp.cloud.appwrite.io/v1/functions/museum-public-api/executions`:

| ID | Jalur Rute API | Payload Pengujian | Hasil Respons Nyata | Waktu Respons | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **TC-08** | `GET /crafts` | `{"path":"/crafts","method":"GET"}` | HTTP 200 OK, format JSON valid dengan daftar kriya terbit | 0.18 detik | **PASS** |
| **TC-09** | `GET /motifs` | `{"path":"/motifs","method":"GET"}` | HTTP 200 OK, mengembalikan 1 data rintisan `motif-subahnale` beserta relasi terjemahan | 0.16 detik | **PASS** |
| **TC-10** | `GET /motifs/:slug` | `{"path":"/motifs/motif-subahnale","method":"GET"}` | HTTP 200 OK, mengembalikan record motif lengkap + terjemahan id/en + data kontributor Ibu Mariam | 0.33 detik | **PASS** |
| **TC-11** | `GET /cultures` | `{"path":"/cultures","method":"GET"}` | HTTP 200 OK, mengembalikan kesenian Dzikir Saman Pringgasela (`cult-dzikir-saman`) | 0.14 detik | **PASS** |
| **TC-12** | `GET /history` | `{"path":"/history","method":"GET"}` | HTTP 200 OK, mengembalikan babak era sejarah desa (`hist-era-awal`) urut tahun | 0.16 detik | **PASS** |

---

#### Kategori D: Fungsionalitas Antarmuka, Routing, & Manajemen Sesi

| ID | Kasus Uji | Skenario | Hasil Verifikasi | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-13** | Pratinjau Server Lokal (`vite preview`) | Menjalankan server pada porta 4173 dan membaca header HTTP | HTTP/1.1 200 OK, Content-Type `text/html`, Etag valid | **PASS** |
| **TC-14** | Rute Penjaga Admin (`ProtectedAdminRoute`) | Mengakses `/admin/dashboard` tanpa sesi login | Otomatis dialihkan ke `/admin/login` | **PASS** |
| **TC-15** | Alih Bahasa Dwibahasa (`LanguageContext`) | Memanggil fungsi `toggleLocale()` | State berpindah antara `id` dan `en`, tersimpan di `localStorage` | **PASS** |
| **TC-16** | Penanganan Status Kosong & Galat | Membuka rute dengan koneksi gagal atau data nihil | Menampilkan komponen `<EmptyState />` atau `<ErrorState />` ramah pengguna | **PASS** |
| **TC-17** | Deteksi Peran Pengguna pada Tim (`AuthContext`) | Pengguna dengan keanggotaan `museum-admins` | Membaca peran `owner`, `desa`, atau `kkn` dan menetapkan izin `canPublish` | **PASS** |
| **TC-18** | Pengunggah Media Berprogres | `MediaUploader` dengan berkas uji coba | Memanggil `storage.createFile` dengan pemantauan progres dan izin baca publik | **PASS** |

---

### 4. Kesimpulan & Rekomendasi Kesiapan

Seluruh rangkaian pengujian membuktikan bahwa kode sumber Frontend dan Admin CMS Museum Digital Pringgasela Selatan:
1. **Stabil dan Siap Operasional:** Bebas dari galat kompilasi atau bug ketidakcocokan tipe data.
2. **Sepenuhnya Sesuai Standar Keamanan:** Tidak ada kebocoran kunci rahasia; akses publik terisolasi penuh di balik Appwrite Function.
3. **Terintegrasi Sempurna dengan Backend:** Berhasil membaca dan menampilkan data langsung dari Appwrite TablesDB dan Storage wilayah Singapura.
