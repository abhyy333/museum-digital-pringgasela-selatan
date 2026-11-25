# Laporan Penegakan Permission Storage & RBAC (Tahap 5.2)
## Museum Digital Pringgasela Selatan

---

### 1. Perubahan Permission Bucket `museum-media`

Konfigurasi aktual bucket Appwrite Storage `museum-media` diverifikasi sebelum dan sesudah pengerasan Tahap 5.2 (diperbarui melalui Appwrite CLI dan disinkronkan di [appwrite.config.json](file:///home/aby/Antigravity_Project/appwrite.config.json#L1929-L1963)):

| Properti Bucket | Sebelum (Tahap 5.1) | Sesudah (Tahap 5.2) | Dampak Keamanan |
| :--- | :--- | :--- | :--- |
| **`$permissions`** | `create("team:museum-admins")`, `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` | **`update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")`** | **Izin `create` klien dihapus sepenuhnya.** Seluruh pemanggilan `storage.createFile` langsung dari Web SDK / REST ditolak Appwrite (`HTTP 401`). |
| `fileSecurity` | `true` | `true` | Izin tingkat berkas tetap menjadi penentu visibilitas individu (`read("team:museum-admins")` vs `read("any")`). |
| `maximumFileSize` | `50000000` (50 MB) | `50000000` (50 MB) | Konsisten antara validasi gateway dan bucket. |
| `allowedFileExtensions` | `jpg, jpeg, png, webp, svg, avif, tif, tiff, mp3, wav, aac, ogg, mp4, webm, pdf, zip` (16 format) | Tetap (16 format) | Disinkronkan dengan `ALL_ALLOWED_EXTENSIONS` & `ALLOWED_MIME_MAP` di server gateway. |
| `encryption` / `antivirus` / `transformations` | `true` / `true` / `true` | `true` / `true` / `true` | Tidak berubah (Appwrite Free/Starter tetap memblokir HTTP `/preview` transformasi). |

---

### 2. Matriks Penegakan Akses Berkas Aktual per Peran

| Operasi | Pengunjung Publik / Anonim | User Terdaftar Non-Tim / Anggota Dicabut | Admin KKN (`kkn`) | Admin Desa (`desa`) | Super Admin (`owner`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`storage.createFile` langsung ke Appwrite** | Ditolak (`401`) | Ditolak (`401`) | **Ditolak (`401`)** | **Ditolak (`401`)** | **Ditolak (`401`)** |
| **Upload via Gateway** (`/upload-chunk`, `X-Is-Public: false`) | Ditolak (`401`) | **Ditolak (`403`)** | **Sukses (`201`) -> Privat** `read("team:museum-admins")` | **Sukses (`201`) -> Privat** `read("team:museum-admins")` | **Sukses (`201`) -> Privat** `read("team:museum-admins")` |
| **Upload meminta `X-Is-Public: true` / spoof header role** | Ditolak (`401`) | Ditolak (`403`) | **Ditolak (`403`)** | Diteruskan ke langkah privat dahulu lalu `/publish` di UI | Diteruskan ke langkah privat dahulu lalu `/publish` di UI |
| **`storage.updateFile` langsung oleh KKN (`read("any")`)** | Ditolak (`401`) | Ditolak (`401`) | **Ditolak (`401`)** | Diizinkan ACL (`desa`) *(UI via Gateway)* | Diizinkan ACL (`owner`) *(UI via Gateway)* |
| **Publish / Unpublish via Gateway** (`/media/:id/publish\|unpublish`) | Ditolak (`401`) | Ditolak (`403`) | **Ditolak (`403`)** | **Sukses (`200`)** *(404 bila tanpa `media_assets`)* | **Sukses (`200`)** *(404 bila tanpa `media_assets`)* |
| **Hapus Permanen via Gateway** (`DELETE /media/:id`) | Ditolak (`401`) | Ditolak (`403`) | **Ditolak (`403`)** | **Ditolak (`403`)** | **Sukses (`200`)** *(hapus relasi, file, row, log)* |
| **Akses URL Storage berkas Privat** (`/files/:id/view`) | Ditolak (`404`) | Ditolak (`404`) | Diizinkan (sesi staf) | Diizinkan (sesi staf) | Diizinkan (sesi staf) |

---

### 3. Keadaan Berkas Bawaan & Catatan Transparansi

1. **Status 2 Berkas Bawaan Tahap 3 (`museum-media`) yang Dipertahankan:**
   - `public-motif-sample` (`public_motif_pattern.png`): menyimpan `$permissions = ["read(\"any\")", "update(\"team:museum-admins\")", "delete(\"team:museum-admins/owner\")"]`.
   - `private-kkn-archive` (`private_kkn_archive.pdf`): menyimpan `$permissions = ["read(\"team:museum-admins\")", "update(\"team:museum-admins\")", "delete(\"team:museum-admins/owner\")"]`.
   - Kedua berkas sampel tersebut **belum memiliki baris di `media_assets`** sehingga gateway menolak publikasi `/media/private-kkn-archive/publish` dengan `HTTP 404`, `museum-public-api` mengembalikan `HTTP 404` untuk `private-kkn-archive`, dan UI `AdminMediaPage` menampilkannya pada tabel audit berkas Storage tanpa metadata. Jika berkas sampel tersebut kelak akan dipublikasikan resmi lewat CMS, Admin Desa perlu mendaftarkan metadata `media_assets` atau menghapusnya lewat Super Admin.
   - *(Catatan: pada level file masing-masing berkas sampel bawaan Tahap 3 masih terdapat string `update("team:museum-admins")` warisan seed awal; berkas baru hasil unggahan gateway Tahap 5.2 **hanya** mendapat `["read(\"team:museum-admins\")"]` tanpa `update` untuk tim KKN.)*

2. **Batasan Teknis & Rekomendasi Tambahan:**
   - **Izin `update(desa/owner)` & `delete(owner)` pada Bucket:** Dipertahankan di bucket `museum-media` agar kompatibel dengan pengelolaan langsung melalui Appwrite Console bila diperlukan. Seluruh alur UI CMS (`setMediaFilePublicAccess`, `handleDelete`) telah diarahkan melalui Server Gateway (`museum-admin-media`) sehingga selalu menulis `audit_logs` server-side. Jika kelak pengelolaan langsung Console tidak lagi diperlukan untuk role non-owner, `update("team:museum-admins/desa")` pada level bucket dapat ikut dicabut agar mutasi hanya melalui gateway.
   - **Transformasi Gambar & Format Mobile:** Paket Appwrite Free/Starter tetap mengembalikan `403 storage_image_transformations_blocked` pada `/preview` (UI menggunakan `/view`). Bucket mendukung `jpg, jpeg, png, webp, svg, avif, tif, tiff, mp3, wav, aac, ogg, mp4, webm, pdf, zip` (format `.heic`/`.mov` tidak diaktifkan pada bucket).
   - **Keanggotaan Tim Aktif Saat Ini (`museum-admins`):** Tetap tepat 3 akun produksi: `superadmin-desa`, `admindesa-pringgasela`, dan `adminkkn-peneliti` (`abhyy333@gmail.com`).
