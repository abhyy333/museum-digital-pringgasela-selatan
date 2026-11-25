# Laporan Validasi CMS & Perbaikan Arsitektural Tahap 5
## (Phase 5 CMS Validation Report) — Museum Digital Pringgasela Selatan

---

### 1. Tujuan & Cakupan Validasi

Pada Tahap 5 dilakukan pemeriksaan menyeluruh atas implementasi kode aktual frontend (`src/`) dan Appwrite Function (`functions/museum-public-api/src/main.js`) terhadap skema nyata 17 tabel `museum_digital` (`appwrite.config.json`) dan aturan akses Appwrite Cloud (`2.7.2`).

---

### 2. Cacat Kritis Pra-Perbaikan yang Ditemukan & Diselesaikan

| No | Area / Berkas | Temuan Masalah Sebelumnya | Perbaikan yang Diterapkan |
| :-: | :--- | :--- | :--- |
| 1 | `MediaUploader.tsx` & `schema.ts` | Mengirim `mediaType: 'photo'` yang ditolak server Appwrite (`HTTP 400`: enum wajib `'image' \| 'video' \| 'audio' \| 'document'`) dan menetapkan izin `owner` dari akun KKN (`HTTP 401`). ID baris `media_assets` tidak sinkron dengan `fileId`. | Menyelaraskan ke `mediaType: 'image'`, menetapkan ID baris `media_assets` 1:1 dengan `fileRes.$id`, membatasi izin file menjadi `read(any \| team)` + `update(user)`, memvalidasi ukuran maks `50.000.000` bytes dan 16 ekstensi bucket, serta mewajibkan kotak persetujuan unggahan publik. |
| 2 | `AdminCraftsPage.tsx` & UI Kriya (`schema.ts`, `CraftsPage.tsx`, `CraftCard.tsx`, `CraftDetailPage.tsx`, `HomePage.tsx`) | Menggunakan enum tidak valid `'tenun' \| 'batik' \| 'kerajinan_tangan'`, padahal skema DB mensyaratkan `'tenun_gedogan' \| 'tenun_sesek' \| 'batik_sasambo' \| 'anyaman' \| 'lainnya'`. Input `culturalMeaningId` dan terjemahan EN tidak dirender di UI modal. | Menyelaraskan seluruh opsi UI & tipe ke enum DB aktual, menambahkan input penuh ID + EN (6 kolom masing-masing), serta menyesuaikan tautan koleksi pada `HomePage.tsx` ke `/crafts?craftType=tenun_gedogan`. |
| 3 | `EntityMediaManager.tsx`, `cmsHelpers.ts`, `schema.ts` | Relasi `craft_media` mengirim `role: 'primary_photo'` atau `'process_step'`, sedangkan skema DB hanya mengizinkan `'cover' \| 'gallery' \| 'process' \| 'close_up'`. Sebelumnya form Motif, Kriya, dan Budaya tidak memiliki UI penautan/pengurutan multi-media. | Membangun komponen `EntityMediaManager.tsx` & utilitas `cmsHelpers.ts` (penautan multi-media, unggah langsung atau pilih pustaka, pengurutan `#1` cover, tombol jadikan utama, flag `isPatternDiagram` & `isAudioChant`). |
| 4 | `audit.ts` & halaman CMS | Mengirim `action: 'upload'` atau `'submit_review'` ke tabel `audit_logs`, sedangkan skema DB hanya menerima `'create' \| 'update' \| 'publish' \| 'unpublish' \| 'archive' \| 'delete'`. | Menormalkan seluruh pemanggilan `recordAuditLog` ke elemen enum sah (`'create' \| 'update' \| 'publish' \| 'unpublish' \| 'archive' \| 'delete'`). |
| 5 | `functions/museum-public-api/src/main.js` (v1.1.0, deployment `6b05de2b1e411bc6e51b`) | Hanya mengembalikan `mediaAssetId` mentah tanpa `fileId`/`mimeType`/caption, tidak menyaring berkas privat Storage dari respons publik, tidak melampirkan `media` pada daftar `/motifs`, `/crafts`, `/cultures`, dan tidak menyertakan `contributor` di detail budaya. | Memperbarui fungsi untuk menyelesaikan metadata `media_assets`, memverifikasi izin `read("any")` lewat `storage.getFile()` sehingga berkas privat tidak pernah tampil di publik, melampirkan pratinjau media ke endpoint daftar, serta memuat `contributor` pada detail tradisi budaya. |
| 6 | Detail & Kartu Publik (`MediaGalleryViewer.tsx`, `MotifCard.tsx`, `CraftCard.tsx`, `CultureCard.tsx`, `MotifDetailPage.tsx`, `CraftDetailPage.tsx`, `CultureDetailPage.tsx`) | Kartu dan detail memakai `mediaAssetId` langsung tanpa fallback `resolveMediaFileId`, tidak mendukung video/audio, serta tidak merender audio chant & contributor tradisi budaya. | Menggunakan `resolveMediaFileId(fileId \|\| mediaAssetId)` serta komponen terpadu `MediaGalleryViewer` (foto, `<video controls>`, `<audio controls>`, dokumen, caption dwibahasa, kredit fotografer) plus pemutar khusus Audio Zikir dan kartu Narasumber di `CultureDetailPage.tsx`. |
| 7 | `AdminMotifsPage.tsx`, `AdminCulturesPage.tsx`, `AdminHistoryPage.tsx` | Form motif mengunci status `draft` untuk KKN sehingga KKN tidak bisa mengajukan `in_review`, serta kurang field EN (`historicalUsageEn`, `originStoryEn`). Form sejarah awalnya default `status: 'published'` tanpa dropdown status dan menimpa `createdById` saat sunting. | Memperbaiki dropdown status sesuai RBAC (`draft`/`in_review` bagi KKN, `published`/`archived` bagi `canPublish`), menambahkan penanda `reviewedById`, meniadakan penimpaan `createdById`, melengkapi input EN & atribusi `contributorId`, menambahkan auto-save draf lokal `sessionStorage`, dan *cascade delete* terjemahan + relasi media. |
| 8 | `App.tsx`, `AdminLoginPage.tsx`, `AdminUsersPage.tsx`, `AdminSettingsPage.tsx`, `AdminDashboardPage.tsx`, `AdminCategoriesPage.tsx` | `ProtectedAdminRoute` hanya memeriksa `!user` tanpa memeriksa `role !== null`; `AdminUsersPage` menampilkan kolom kosong karena Appwrite menyamarkan data anggota tim; `AdminSettingsPage` tidak mengunci edit bagi non-Super Admin dan sempat memicu `isPublic`; `AdminDashboardPage` tidak merender log audit; belum ada halaman manajemen `categories`. | Menambahkan guard `!role` + UI penolakan akses; menggabungkan data tabel `profiles` dengan keanggotaan tim di `AdminUsersPage`; mengunci `AdminSettingsPage` untuk `!isSuperAdmin` dan menyelaraskan kolom `description`; merender tabel `audit_logs` & total `village_history` di dashboard; serta menambahkan modul penuh `/admin/categories`. |

---

### 3. Hasil Validasi Modul CMS

| Rute & Modul | Status Implementasi | Hak Akses Terverifikasi |
| :--- | :---: | :--- |
| `/admin/login` | Lulus Uji | Sesi persisten Appwrite (`account.createEmailPasswordSession`), menolak akun tanpa peran tim (`role === null`). |
| `/admin` (`AdminDashboardPage`) | Lulus Uji | Ringkasan 7 metrik (termasuk `village_history` & `draft + in_review`), matriks izin, dan log aktivitas kurasi (`canPublish`). |
| `/admin/motifs` (`AdminMotifsPage`) | Lulus Uji | CRUD penuh, galeri multi-foto + diagram pola, alur `draft -> in_review -> published -> archived`, EN lengkap, cascade delete. |
| `/admin/crafts` (`AdminCraftsPage`) | Lulus Uji | CRUD Kriya/Batik Sasambo sesuai enum DB, galeri multi-media `cover/gallery/process/close_up`, terjemahan ID+EN lengkap. |
| `/admin/cultures` (`AdminCulturesPage`) | Lulus Uji | CRUD Tradisi Budaya, narasumber adat (`contributorId`), galeri foto/video + flag Audio Zikir (`isAudioChant`), ID+EN lengkap. |
| `/admin/history` (`AdminHistoryPage`) | Lulus Uji | Kronologi desa aman (default `draft`, tidak menimpa `createdById`, validasi `endYear >= startYear`), terjemahan ID+EN. |
| `/admin/contributors` (`AdminContributorsPage`) | Lulus Uji | Profil penenun/tokoh adat dengan unggah foto potret + pemberitahuan persetujuan publikasi, biografi ID+EN. |
| `/admin/categories` (`AdminCategoriesPage`) | Lulus Uji | CRUD kategori untuk `motif`, `craft`, `culture`, dan `history` (`canPublish` untuk tulis, `canDelete` untuk hapus, baca untuk KKN). |
| `/admin/media` (`AdminMediaPage`) | Lulus Uji | Unggah publik/privat ke `museum-media`, pratinjau gambar/video/audio, pembersihan relasi galeri sebelum hapus file (Super Admin). |
| `/admin/users` (`AdminUsersPage`) | Lulus Uji | Daftar staf `profiles` + keanggotaan `museum-admins` beserta protokol preservasi peneliti KKN. |
| `/admin/settings` (`AdminSettingsPage`) | Lulus Uji | Pengeditan konfigurasi global terkunci khusus `isSuperAdmin` (`owner`); mode baca-saja bagi Admin Desa dan KKN. |

---

### 4. Verifikasi Kompilasi & Kebersihan Kode

- `npx tsc -b && npm run build`: **Lulus (0 galat TypeScript, build Vite `5.56s`)**.
- Pemindaian rahasia (`grep -rn -i "APPWRITE_API_KEY" src/ dist/`): **Bersih (`NO_SECRETS`)**.
