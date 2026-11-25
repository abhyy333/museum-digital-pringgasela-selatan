# Audit Keamanan Penyimpanan & Akses File (Phase 5.1 Storage Security Audit)
## Museum Digital Pringgasela Selatan

---

### 1. Ringkasan Eksekutif Audit

Audit keamanan dilakukan langsung terhadap bucket Appwrite Storage `museum-media` pada proyek `6affdaa0003c416ecdb0` (Singapore), konfigurasi tabel `media_assets`, relasi galeri (`motif_media`, `craft_media`, `culture_media`), `contributors.photoFileId`, kode unggahan & manajemen media frontend (`src/`), serta Appwrite Function `museum-public-api`.

Audit ini mengidentifikasi **4 celah keamanan & keandalan utama** pada implementasi Phase 5 sebelum pengumpulan dokumentasi foto, video, dan audio asli masyarakat dimulai, serta memvalidasi perbaikannya terhadap Appwrite Cloud.

---

### 2. Inventaris & Klasifikasi File Aktual di Bucket `museum-media`

Pemeriksaan via Appwrite CLI (`storage list-files` & `storage get-file`) terhadap bucket `museum-media` (`fileSecurity: true`, `maximumFileSize: 50000000`, 16 ekstensi diizinkan):

#### A. Konfigurasi Tingkat Bucket (`museum-media`)
- `create("team:museum-admins")` — Semua pengelola (`owner`, `desa`, `kkn`) dapat mengunggah.
- `update("team:museum-admins/desa")` — Hanya Admin Desa dapat memodifikasi metadata/permission berkas di bucket.
- `update("team:museum-admins/owner")` — Hanya Super Admin dapat memodifikasi berkas di bucket.
- `delete("team:museum-admins/owner")` — Hanya Super Admin yang dapat menghapus berkas permanen.

#### B. Pengelompokan Seluruh Berkas Aktual Saat Audit

| Kelompok | File ID | Nama Berkas & MIME | `$permissions` Aktual | Terhubung ke `media_assets` / Entitas? | Evaluasi & Status Keamanan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Media Publik Disetujui Publikasi** | *(Belum ada)* | — | — | — | Belum ada dokumentasi asli masyarakat yang diterbitkan. |
| **2. Media Privat / Belum Diverifikasi** | *(0 produksi; file uji privat diverifikasi di Sesi Uji)* | — | — | — | Upload baru kini wajib berstatus Privat (`read("team:museum-admins")`). |
| **3. Media Belum Terhubung Entitas / Tanpa Metadata** | `public-motif-sample` | `public_motif_pattern.png` (`image/png`, 68 bytes) | `["read(\"any\")", "update(\"team:museum-admins\")", "delete(\"team:museum-admins/owner\")"]` | Tidak ada baris di `media_assets`; tidak terhubung ke entitas mana pun. | File sampel/uji Tahap 3. Terisolasi dari Public API karena Public API memeriksa keberadaan baris `media_assets`. Kini tampil pada tabel audit file tanpa metadata di `/admin/media`. |
| **4. File Sampel / Uji Privat** | `private-kkn-archive` | `private_kkn_archive.pdf` (`application/pdf`, 313 bytes) | `["read(\"team:museum-admins\")", "update(\"team:museum-admins\")", "delete(\"team:museum-admins/owner\")"]` | Tidak ada baris di `media_assets`; tidak terhubung ke entitas mana pun. | File uji arsip internal Tahap 3. Terbukti menghasilkan HTTP `404` bagi pengunjung anonim. |

*Catatan: Tidak ada dokumentasi asli masyarakat pada bucket saat audit dilakukan; kedua file sampel bawaan Tahap 3 tetap dipertahankan utuh.*

---

### 3. Celah Keamanan & Keandalan Pra-Perbaikan (Before State)

1. **`MediaUploader.tsx` & `AdminContributorsPage.tsx` Tidak Privat Secara Default:**
   - `defaultPublic = true` membuat unggahan baru default ke `read("any")`.
   - `AdminContributorsPage.tsx` meneruskan `defaultPublic={true}` pada unggahan foto potret tokoh.
   - **Admin KKN (`kkn`)** tidak dikunci dari tombol `"Publik"` sehingga dapat langsung mengunggah file dengan `Permission.read(Role.any())` sebelum verifikasi Admin Desa.
2. **Pemberian `Permission.update(Role.user)` Memungkinkan KKN Mempublikasikan File Sendiri via SDK:**
   - Sebelumnya `MediaUploader.tsx` menyertakan `Permission.update(Role.user(user.$id))` pada file Storage. Hal tersebut memberi pengunggah KKN hak memanggil `storage.updateFile()` untuk menambahkan `read("any")` secara sepihak melalui Appwrite API.
3. **Ketiadaan Kontrol Inspeksi, Publikasi, & Pencabutan Akses Media pada CMS:**
   - `AdminMediaPage.tsx` dan `EntityMediaManager.tsx` sebelumnya hanya membaca tabel `media_assets` dan tidak memeriksa `$permissions` nyata dari Appwrite Storage. Admin Desa / Super Admin tidak memiliki aksi eksplisit untuk mempublikasikan media privat maupun menarik media publik ke privat.
   - Tidak ada peringatan saat media Privat ditautkan ke entitas berstatus `published`.
4. **Celah Kebocoran Foto Profil (`contributors.photoFileId`) & Transformasi `/preview` `HTTP 403`:**
   - `museum-public-api` mengembalikan `contributors.photoFileId` secara langsung tanpa memverifikasi `read("any")` dan keberadaan metadata di `media_assets`.
   - Endpoint `/motifs`, `/crafts`, `/cultures` (mode list) hanya mengambil 3 relasi media sebelum menyaring file privat, berisiko menyembunyikan foto publik di urutan `>= 4`.
   - Pada paket Appwrite Starter/Free, pemanggilan `/preview` untuk thumbnail gambar ditolak dengan **`HTTP 403 storage_image_transformations_blocked`**, sedangkan `/view` berjalan normal (`HTTP 200`).

---

### 4. Keterbatasan Arsitektural yang Masih Ada & Rekomendasi Lanjutan

1. **Batas `create("team:museum-admins")` pada Client SDK (`storage.createFile`):**
   - Selama bucket memiliki `create("team:museum-admins")` dengan `fileSecurity: true`, batas izin Appwrite Storage mengizinkan pemanggil REST API langsung menyertakan `read("any")` saat *creation* awal jika melewati UI resmi CMS. Antarmuka CMS saat ini memblokir dan menghapus opsi tersebut bagi KKN serta mencatat seluruh publikasi di `audit_logs`, namun penegakan 100% di API gateway memerlukan penghapusan hak `create` bucket dan pengalihan unggahan via Appwrite Function Server SDK (dibatasi ukuran body Function dibanding limit 50 MB upload langsung paket gratis).
2. **Pemrosesan Thumbnail Tanpa Paket Berbayar Image Transformations:**
   - Karena endpoint `/preview` diblokir pada paket Starter, `getFilePreviewUrl()` menggunakan `/view`. Penyelenggara konten disarankan mengunggah gambar berukuran wajar terkompresi (`WebP`/`JPEG` di bawah 1–2 MB) agar halaman publik tetap ringan.
3. **Pratinjau Berkas Privat Lintas-Origin:**
   - Tanpa Custom Domain Appwrite (cookie sesi lintas-origin dibatasi browser), `AuthorizedMediaPreview.tsx` memuat media privat lewat `fetch` terautentikasi (`X-Fallback-Cookies`) menjadi URL `blob:`. Untuk video privat berkapasitas besar (~50 MB), disarankan mengaktifkan Custom Domain di Konsol Appwrite agar streaming native peramban aktif sepenuhnya.
