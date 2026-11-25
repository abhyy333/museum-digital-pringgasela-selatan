# Laporan Implementasi Tahap 5.1: Penguatan Keamanan Media & Storage
## (Phase 5.1 Implementation Report) — Museum Digital Pringgasela Selatan

---

### 1. Ringkasan Eksekutif

Tahap 5.1 mengamankan seluruh jalur unggahan, pratinjau internal, publikasi eksplisit, dan pengiriman publik berkas foto, video, audio, serta dokumen pada bucket Appwrite Storage `museum-media` dan API `museum-public-api`. Prinsip **Private by Default -> Explicit Authorized Publication -> Verified Access Control -> Regression Safety** kini ditegakkan baik di antarmuka CMS maupun di tingkat kontrol akses Appwrite Storage.

Selain mengamankan permission, pengujian langsung browser Chrome pada tahap ini juga menemukan dan memperbaiki masalah kompatibilitas Appwrite Cloud Starter Plan di mana endpoint transformasi gambar `/preview` ditolak (`HTTP 403 storage_image_transformations_blocked`) sehingga pratinjau seluruh gambar Storage di publik & CMS diarahkan ke `/view` yang stabil (`HTTP 200`).

---

### 2. Rincian Perubahan Berkas

| Berkas / Komponen | Ringkasan Perubahan |
| :--- | :--- |
| [src/utils/mediaAccess.ts](file:///home/aby/Antigravity_Project/src/utils/mediaAccess.ts) | Modul keamanan media baru: `isStorageFilePublic()`, `buildPrivateMediaPermissions()` (tanpa `update(user)`), `buildPublicMediaPermissions()`, `fetchBucketFileAccessMap()`, dan `setMediaFilePublicAccess()` dengan verifikasi ulang `$permissions` dari server serta audit log (`publish` / `unpublish`). |
| [src/components/common/AuthorizedMediaPreview.tsx](file:///home/aby/Antigravity_Project/src/components/common/AuthorizedMediaPreview.tsx) | Komponen pratinjau aman bagi gambar, video, audio, dan dokumen CMS: menggunakan URL langsung untuk berkas publik dan `fetch` terautentikasi (`X-Fallback-Cookies` -> URL `blob:`) untuk berkas privat tanpa memicu error jaringan di console browser. |
| [src/components/admin/MediaUploader.tsx](file:///home/aby/Antigravity_Project/src/components/admin/MediaUploader.tsx) | Mengubah `defaultPublic = false` (Private by Default), menonaktifkan pilihan `"Publik"` bagi akun KKN, menambahkan dialog konfirmasi bila Admin Desa/Super Admin memilih unggah langsung sebagai Publik, serta menghapus `Permission.update(Role.user)` agar KKN tidak bisa mempublikasikan file via API. |
| [src/pages/admin/AdminMediaPage.tsx](file:///home/aby/Antigravity_Project/src/pages/admin/AdminMediaPage.tsx) | Menggabungkan `media_assets` dengan `$permissions` aktual `storage.listFiles()`, menambahkan filter `Semua / Privat / Publik / Bermasalah`, tombol eksplisit **Publikasikan Media** & **Tarik ke Privat** khusus `canPublish`, pembedaan `Salin URL Publik` vs `Salin URL Staf`, serta panel audit **Berkas Storage Tanpa Metadata**. |
| [src/components/admin/EntityMediaManager.tsx](file:///home/aby/Antigravity_Project/src/components/admin/EntityMediaManager.tsx) | Memuat status akses asli dari Storage untuk pustaka & galeri terlampir, menampilkan lencana `Publik` / `Privat (Staf)` / `File Hilang`, banner peringatan bila entri memiliki lampiran Privat, serta tombol publikasi eksplisit opsional bagi `canPublish` (penautan entri tidak pernah mempublikasikan file otomatis). |
| [src/pages/admin/AdminContributorsPage.tsx](file:///home/aby/Antigravity_Project/src/pages/admin/AdminContributorsPage.tsx) | Mengubah unggahan foto tokoh ke `defaultPublic={false}`, menampilkan pratinjau aman `<AuthorizedMediaPreview />`, lencana status akses foto potret, dan kontrol publikasi eksplisit bagi `canPublish`. |
| [functions/museum-public-api/src/main.js](file:///home/aby/Antigravity_Project/functions/museum-public-api/src/main.js) | Memperbarui `museum-public-api` ke **v1.2.0** (deployment `6b06405ef41e827d8977`): menambahkan `sanitizeContributor()` untuk memverifikasi `media_assets` + `read("any")` sebelum mengembalikan `photoFileId`, menyelaraskan pengecekan persis `read("any")` + `bucketId` pada `resolvePublicMedia()`, serta meningkatkan limit daftar relasi galeri list dari `3` menjadi `20`. |
| [src/utils/media.ts](file:///home/aby/Antigravity_Project/src/utils/media.ts) | Menyelaraskan `getFilePreviewUrl()` untuk mengembalikan `/view` (`getFileViewUrl`) karena endpoint `/preview` mengembalikan `HTTP 403 storage_image_transformations_blocked` pada paket Appwrite Starter/Free. |
| [src/utils/cmsHelpers.ts](file:///home/aby/Antigravity_Project/src/utils/cmsHelpers.ts) | Mengubah lookup `media_assets` per-ID menjadi query batch (`Query.equal('$id', assetIds)`) sehingga aset yatim/hilang tertangani bersih tanpa menimbulkan HTTP 404 pada jaringan CMS. |

---

### 3. Kebutuhan Perubahan Schema

**Kesimpulan Evaluasi Schema:** Tidak ada perubahan skema Appwrite TablesDB (`0` kolom ditambah/diubah). Penggunaan `$permissions` asli Appwrite Storage (`storage.listFiles` / `storage.updateFile`) sebagai *single source of truth* sepenuhnya mencukupi tanpa menimbulkan risiko sinkronisasi ganda (*split-brain*) dengan tabel `media_assets`, sejalan dengan batasan *"Jangan mengubah schema tanpa alasan yang jelas"*.

---

### 4. Status Kesiapan Sebelum Penerimaan Media Lapangan

Sistem dinyatakan **siap dan aman secara arsitektural** untuk mulai menerima dokumentasi foto, video, dan audio masyarakat Desa Pringgasela Selatan oleh Tim KKN, dengan persetujuan kurasi & publikasi terpusat di Admin Desa dan Super Admin.

Dokumen rujukan lengkap Tahap 5.1:
- [PHASE_5_1_STORAGE_SECURITY_AUDIT.md](file:///home/aby/Antigravity_Project/PHASE_5_1_STORAGE_SECURITY_AUDIT.md)
- [PHASE_5_1_MEDIA_PERMISSION_MATRIX.md](file:///home/aby/Antigravity_Project/PHASE_5_1_MEDIA_PERMISSION_MATRIX.md)
- [PHASE_5_1_SECURITY_TEST_REPORT.md](file:///home/aby/Antigravity_Project/PHASE_5_1_SECURITY_TEST_REPORT.md)
- [PHASE_5_1_IMPLEMENTATION_REPORT.md](file:///home/aby/Antigravity_Project/PHASE_5_1_IMPLEMENTATION_REPORT.md)
