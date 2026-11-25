# Laporan Implementasi Tahap 5.2: Server-Authoritative Media Upload Security
## Museum Digital Pringgasela Selatan

---

### 1. Ringkasan Eksekutif

Tahap 5.2 menutup celah keamanan arsitektural terakhir dari Tahap 5.1 dengan menghilangkan hak `create("team:museum-admins")` dari bucket Appwrite Storage `museum-media` dan memusatkan seluruh operasi unggah, publikasi, pencabutan akses publik, serta penghapusan permanen melalui gateway backend **Appwrite Function `museum-admin-media` v2.0.0**.

Seluruh 16 kasus pengujian keamanan dan regresi browser (termasuk uji bypass `storage.createFile` langsung untuk semua role, pemblokiran unggahan `X-Is-Public: true` dari KKN, unggahan video *multi-chunk* `6 MiB`, penolakan tipe berkas/MIME palsu, rollback saat metadata gagal, dan alur penuh UI CMS di Google Chrome) lulus 100% terhadap proyek Appwrite Cloud `6affdaa0003c416ecdb0`.

---

### 2. Rincian Perubahan Infrastruktur & Kode

| Komponen / Berkas | Deskripsi Perubahan |
| :--- | :--- |
| **Appwrite Function `museum-admin-media`** | Dideploy aktif ke **v2.0.0** (`deploymentId: 6b064772a59772b9f7ca`, runtime `node-22`, timeout `30s`) dengan domain proxy HTTPS terverifikasi `https://museum-admin-media-pringgasela.appwrite.network` (`proxy rule ID: 0e08cd6b6fb7b12b20e622b3f3346115`). |
| [functions/museum-admin-media/src/main.js](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/main.js) | Gateway Server SDK lengkap: verifikasi Bearer JWT + keanggotaan aktif `museum-admins`, validasi 16 ekstensi + MIME map, dukungan *chunked upload* 5 MiB hingga 50 MB, pemaksaan izin awal `read("team:museum-admins")`, pembuatan `media_assets` atomik dengan rollback Storage, serta endpoint RBAC `/publish`, `/unpublish`, `DELETE /media/:fileId`, `/me`, `/health`, dan `audit_logs` server-side. |
| [functions/museum-admin-media/package.json](file:///home/aby/Antigravity_Project/functions/museum-admin-media/package.json) | Konfigurasi dependensi `node-appwrite: ^32.0.0` untuk Appwrite Function gateway. |
| **Bucket Storage `museum-media`** | Izin `create("team:museum-admins")` dicabut via CLI; `$permissions` aktif menjadi `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` dengan `fileSecurity: true` & `maximumFileSize: 50000000`. |
| [src/appwrite/config.ts](file:///home/aby/Antigravity_Project/src/appwrite/config.ts) | Menambahkan `adminMediaFunctionId` (`museum-admin-media`) dan `adminMediaGatewayUrl` (`https://museum-admin-media-pringgasela.appwrite.network`). |
| [src/appwrite/adminMediaApi.ts](file:///home/aby/Antigravity_Project/src/appwrite/adminMediaApi.ts) | Modul klien baru: autentikasi `account.createJWT()`, pemecah potongan biner 5 MiB (`GATEWAY_CHUNK_BYTES`), `uploadMediaViaGateway()`, `setMediaVisibilityViaGateway()`, dan `deleteMediaViaGateway()` tanpa satu pun API Key di kode frontend. |
| [src/components/admin/MediaUploader.tsx](file:///home/aby/Antigravity_Project/src/components/admin/MediaUploader.tsx) | Menghapus `storage.createFile` & `tablesDB.createRow` sisi klien; seluruh unggahan diproses via `uploadMediaViaGateway()` dan publikasi eksplisit opsional (khusus kurator berwenang) dirangkai lewat `setMediaVisibilityViaGateway()`. |
| [src/utils/mediaAccess.ts](file:///home/aby/Antigravity_Project/src/utils/mediaAccess.ts) | Mengalihkan `setMediaFilePublicAccess()` untuk memanggil `setMediaVisibilityViaGateway()` sehingga perubahan status publikasi & pencatatan audit terjadi terpusat di server. |
| [src/pages/admin/AdminMediaPage.tsx](file:///home/aby/Antigravity_Project/src/pages/admin/AdminMediaPage.tsx) | Mengalihkan `handleDelete()` untuk memanggil `deleteMediaViaGateway()` (pembersihan relasi galeri + file Storage + row `media_assets` + `audit_logs` atomik di server). |
| [appwrite.config.json](file:///home/aby/Antigravity_Project/appwrite.config.json) | Disinkronkan agar mencerminkan penghapusan `create("team:museum-admins")` pada `museum-media` dan definisi fungsi `museum-admin-media`. |

---

### 3. Status Tampilan Publik & Kesiapan Operasional

* **Visual Beranda & Website Publik:** Desain visual `HomePage.tsx` dan fungsi `museum-public-api` v1.2.0 tetap utuh tanpa perubahan visual maupun regresi (`0` gambar rusak, `0` error konsol); build frontend diverifikasi lokal tanpa melakukan deployment produksi hosting web.
* **Dokumen Terkait Tahap 5.2:**
  * [PHASE_5_2_UPLOAD_SECURITY_ARCHITECTURE.md](file:///home/aby/Antigravity_Project/PHASE_5_2_UPLOAD_SECURITY_ARCHITECTURE.md)
  * [PHASE_5_2_PERMISSION_ENFORCEMENT_REPORT.md](file:///home/aby/Antigravity_Project/PHASE_5_2_PERMISSION_ENFORCEMENT_REPORT.md)
  * [PHASE_5_2_SECURITY_TEST_REPORT.md](file:///home/aby/Antigravity_Project/PHASE_5_2_SECURITY_TEST_REPORT.md)
  * [PHASE_5_2_IMPLEMENTATION_REPORT.md](file:///home/aby/Antigravity_Project/PHASE_5_2_IMPLEMENTATION_REPORT.md)
