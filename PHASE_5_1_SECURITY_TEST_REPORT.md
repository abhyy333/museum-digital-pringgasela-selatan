# Laporan Pengujian Keamanan & Regresi Tahap 5.1
## (Phase 5.1 Security & Regression Test Report) — Museum Digital Pringgasela Selatan

---

### 1. Lingkungan Pengujian Terverifikasi

- **Target Cloud:** Appwrite Cloud (`https://sgp.cloud.appwrite.io/v1`, Project ID `6affdaa0003c416ecdb0`, Bucket `museum-media`, DB `museum_digital`).
- **Appwrite Function Teruji:** `museum-public-api` v1.2.0, deployment aktif **`6b06405ef41e827d8977`** (`status: ready`).
- **Build & Runtime Browser:** Produksi Vite (`tsc -b && vite build`, `5.42s`, 0 error) dijalankan pada `127.0.0.1:4173` dan diuji langsung menggunakan Chromium headless via Chrome DevTools Protocol (`uat_phase5_1_security.mjs`).
- **Pemindaian Rahasia:** `grep -rn -i "APPWRITE_API_KEY" src/ dist/` -> `NO_SECRETS`.

---

### 2. Hasil Pengujian Keamanan Matriks Wajib (11 Kasus Uji Live Appwrite Cloud)

| ID Uji | Skenario Pengujian | Ekspektasi | Hasil Observasi Aktual (Post-Final Edit) | Status |
| :--- | :--- | :--- | :--- | :---: |
| `SEC-01` | Anonymous membuka file privat bawaan (`private-kkn-archive`) | Ditolak | Permintaan anonim HTTP `GET /files/private-kkn-archive/view` mengembalikan **`HTTP 404`**. | **PASS** |
| `SEC-01B` | Anonymous membuka file gambar & audio KKN baru yang diunggah default-privat | Ditolak | Permintaan anonim ke foto & audio privat mengembalikan **`HTTP 404`** pada keduanya. | **PASS** |
| `SEC-02` | Anonymous membuka file publik (`public-motif-sample`) | Diizinkan | Permintaan anonim HTTP `GET /files/public-motif-sample/view` mengembalikan **`HTTP 200`**. | **PASS** |
| `API-HEALTH` | Verifikasi fungsi Public API v1.2.0 aktif | Aktif `ready` | `GET /health` mengembalikan `status=200`, `version="1.2.0"`. | **PASS** |
| `SEC-03` | Admin KKN (`kkn@pringgasela.desa.id`) mengunggah file baru | Berhasil, default privat | `storage.createFile` berhasil; `$permissions` tepat `["read(\"team:museum-admins\")"]` (tanpa `read("any")` & tanpa `update(user)`). | **PASS** |
| `SEC-04` | Admin KKN mencoba mempublikasikan file tanpa izin (`storage.updateFile`) | Ditolak | Appwrite Server menolak tegas dengan **`HTTP 401 user_unauthorized`**. | **PASS** |
| `SEC-05` | Admin Desa (`admindesa@pringgasela.desa.id`) mempublikasikan media sesuai kewenangan | Berhasil | `storage.updateFile` memperbarui `$permissions` ke `["read(\"any\")","read(\"team:museum-admins\")"]`, log `audit_logs` tercatat (`publish`), URL publik kembali `HTTP 200`. | **PASS** |
| `SEC-06` | Super Admin (`superadmin@pringgasela.desa.id`) mengelola permission (*unpublish* ke privat) | Berhasil | `storage.updateFile` mencabut `read("any")`; URL publik seketika kembali **`HTTP 404`**. | **PASS** |
| `SEC-07` | API meminta entri `published` yang terhubung ke file **privat** (motif & potret kontributor) | Tidak mengembalikan file privat | `/motifs/:slug` & `/motifs` mengembalikan `media: []`; potret privat kontributor disetel `photoFileId: null` di `/motifs/:slug` maupun `/contributors`. | **PASS** |
| `SEC-08` | API meminta entri `published` sesudah file disetujui & dipublikasikan Admin Desa | Mengembalikan referensi valid | `/motifs/:slug` & `/motifs` mengembalikan `fileId` yang sah (`media.length=1`), dan potret publik kontributor tampil konsisten (`photoFileId === ids.kknImg`). | **PASS** |
| `SEC-09` | File Storage **tanpa** baris metadata di `media_assets` (meski `read("any")` di Storage) | Tidak otomatis terekspos | `orphanFile` tidak pernah muncul pada respons `museum-public-api` (`orphanExposed=false`). | **PASS** |
| `SEC-10` | Entri **Draft** (`status: draft`) tertaut ke file audio privat | Tidak tampil di publik | `/motifs/:slug` mengembalikan **`HTTP 404`** dan daftar `/motifs` tidak menyertakannya (`inList=false`). | **PASS** |

---

### 3. Hasil Pengujian Regresi Fungsi & Antarmuka (6 Kasus Uji Browser Chrome)

| ID Uji | Cakupan Regresi | Hasil Observasi Aktual (Post-Final Edit) | Status |
| :--- | :--- | :--- | :---: |
| `REG-01` | Homepage yang disetujui (`1536x1024`) | Judul H1 tampil utuh, `overflow: false`, seluruh `brokenCount: 0`. Desain tidak berubah. | **PASS** |
| `REG-02` | Halaman detail Motif & Tradisi Budaya publik | Detail `motif-subahnale` (`subahnale=true`) dan `dzikir-saman-pringgasela` (`culture=true`) merender normal. | **PASS** |
| `REG-03` | UI Admin KKN (`/admin/media` & Modal Upload) | Tombol `"Publik"` dinonaktifkan (`pubDisabled=true`), tombol kirim terbaca `"Unggah Sebagai Berkas Privat"`, pemberitahuan `"Privat secara Default"` tampil, tabel Audit Berkas Storage Tanpa Metadata muncul, tombol `"Publikasikan Media"` disembunyikan. | **PASS** |
| `REG-04` | UI Admin Desa (`/admin/media`, unggah Foto/Video/Audio, & `EntityMediaManager` di Motif) | Kartu foto privat (`blob:` terautentikasi `privateBlobImgs=1`), pemutar video (`videoPlayers=1`), pemutar audio (`audioPlayers=1`), tombol `"Publikasikan Media"`, serta peringatan kuning `"masih berstatus Privat (Staf)"` di modal Motif seluruhnya terverifikasi. | **PASS** |
| `REG-05` | Kebersihan Console, Runtime, & HTTP Jaringan Browser | `pageErrors: 0`, `consoleErrors: 0`, `httpFailures: []` (**0 kesalahan HTTP** di seluruh pengujian Chrome). | **PASS** |

**Total Ringkasan Uji Akhir:** **`17 / 17` Skenario Lulus (`100%`)**, **`0` Gagal**.

---

### 4. Pembersihan Data Uji & Verifikasi Kondisi Akhir Live Appwrite

Setelah `uat_phase5_1_security.mjs` selesai, verifikasi ulang via `audit_live_appwrite.mjs` dan `appwrite storage list-files` memastikan:
- **Storage `museum-media`:** Tepat **`2` berkas** bawaan (`public-motif-sample`, `private-kkn-archive`). Seluruh file uji sementara (`s51-kkn-img-*`, `s51-vid-*`, `s51-aud-*`, `s51-orphan-*`) bersih terhapus.
- **TablesDB `museum_digital`:** Kembali tepat ke kondisi pra-uji (`categories: 1`, `profiles: 3`, `contributors: 1`, `crafts: 0`, `weaving_motifs: 2`, `cultures: 1`, `village_history: 1`, `media_assets: 0`, `audit_logs: 0`, `museum_settings: 5`).
