# Laporan Lengkap Tahap 5.3: Storage Mutation Lockdown & File Integrity
## Museum Digital Pringgasela Selatan

---

## Bagian 1 — Ringkasan Eksekutif Implementasi

Tahap 5.3 menyempurnakan isolasi keamanan Appwrite Storage sehingga **tidak ada peran CMS (Admin KKN, Admin Desa, maupun Super Admin) yang dapat melakukan `createFile`, `updateFile`, maupun `deleteFile` secara langsung** melalui Client SDK maupun REST API. Seluruh mutasi media serta pengambilan inventaris berkas Admin Media kini terpusat dan terverifikasi pada **Appwrite Function `museum-admin-media` v3.0.0** (`deploymentId: 6b0856da55305f225a4e`).

Selain mengunci penuh bucket (`$permissions: []`) dan kedua berkas sampel bawaan (`public-motif-sample` dan `private-kkn-archive`), gateway v3.0.0 menegakkan inspeksi *magic bytes* biner, pemblokiran polyglot dan XSS SVG, pemblokiran aksi aktif PDF & entri eksekusi dalam ZIP, perlindungan anti *chunk-hijack*, penyempitan scope API Key server, serta pengayaan payload `audit_logs`. Halaman beranda publik ([HomePage.tsx](file:///home/aby/Antigravity_Project/src/pages/public/HomePage.tsx)) tetap utuh tanpa satu baris pun diubah dan tanpa deployment frontend produksi.

---

## Bagian 2 — Lockdown Permission Bucket Storage (`museum-media`)

### 2.1 Kondisi Sebelum vs Sesudah Bucket

| Properti Bucket | Sebelum (Akhir Tahap 5.2) | Sesudah (Tahap 5.3) | Status |
| :--- | :--- | :--- | :---: |
| `$id` | `museum-media` | `museum-media` | Tetap |
| **`$permissions` (Bucket ACL)** | `update("team:museum-admins/desa")`, `update("team:museum-admins/owner")`, `delete("team:museum-admins/owner")` | **`[]` (Kosong — 0 permission klien)** | **Terkunci Total** |
| `fileSecurity` | `true` | `true` | Aktif |
| `maximumFileSize` | `50000000` (50 MB) | `50000000` (50 MB) | Tetap |
| `allowedFileExtensions` | 16 ekstensi (`jpg, jpeg, png, webp, svg, avif, tif, tiff, mp3, wav, aac, ogg, mp4, webm, pdf, zip`) | Sama (16 ekstensi) | Tetap |
| `encryption` / `antivirus` / `transformations` | `true` / `true` / `true` | `true` / `true` / `true` | Tetap |

Sumber konfigurasi telah disinkronkan di Appwrite Cloud (`appwrite push bucket`) dan [appwrite.config.json](file:///home/aby/Antigravity_Project/appwrite.config.json#L1928-L1958).

### 2.2 Dampak Pembacaan, Pratinjau CMS & Scope Minimal Gateway

* **Listing Inventaris CMS:** Karena `$permissions` bucket kini `[]`, gateway [main.js](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/main.js) menambahkan endpoint terautentikasi `GET /media` (wajib Bearer JWT + keanggotaan aktif `museum-admins`) dan dibaca melalui [`listMediaFilesViaGateway()`](file:///home/aby/Antigravity_Project/src/appwrite/adminMediaApi.ts#L211-L231) di [mediaAccess.ts](file:///home/aby/Antigravity_Project/src/utils/mediaAccess.ts), menjaga `AdminMediaPage`, `EntityMediaManager`, dan `AdminContributorsPage` tetap berfungsi penuh tanpa izin bucket apa pun.
* **Pratinjau Media Privat & Publik:** `<AuthorizedMediaPreview />` tetap memuat file privat memakai *session cookie fallback* resmi terhadap izin file `read("team:museum-admins")`, sedangkan berkas publik memakai `read("any")`.
* **Prinsip Hak Akses Minimal Function (`museum-admin-media`):** Scope API Key fungsi dikurangi di Appwrite Cloud dan [appwrite.config.json](file:///home/aby/Antigravity_Project/appwrite.config.json#L96-L104) dari 9 scope menjadi **7 scope minimal** (`files.read`, `files.write`, `databases.read`, `tables.read`, `rows.read`, `rows.write`, `teams.read`), menghapus `databases.write` dan `tables.write` yang tidak diperlukan.

---

## Bagian 3 — Audit & Lockdown Permission Tingkat File

### 3.1 Inventarisasi Seluruh Berkas Bucket `museum-media`

| Kategori | File ID | Nama Berkas | MIME & Ukuran | Metadata `media_assets` |
| :--- | :--- | :--- | :--- | :--- |
| **Sampel Publik (Tanpa Metadata)** | `public-motif-sample` | `public_motif_pattern.png` | `image/png` (68 B) | Belum terdaftar (sampel bawaan Tahap 3) |
| **Sampel Privat (Tanpa Metadata)** | `private-kkn-archive` | `private_kkn_archive.pdf` | `application/pdf` (313 B) | Belum terdaftar (sampel bawaan Tahap 3) |
| **Unggahan Baru via Gateway** | *(Dinamis saat produksi)* | Foto / Video / Audio / Dokumen | Maks. 50.000.000 B | Terdaftar 1:1 oleh server gateway saat selesai upload |

### 3.2 Audit Permission File (Sebelum vs Sesudah)

| File ID | Sebelum (Temuan Audit Awal 5.3) | Celah yang Ditutup | Sesudah (Verifikasi Langsung Appwrite Cloud) |
| :--- | :--- | :--- | :--- |
| **`public-motif-sample`** | `read("any")`, **`update("team:museum-admins")`**, **`delete("team:museum-admins/owner")`** | Admin KKN & kurator memiliki hak `update` langsung; Super Admin bisa `delete` tanpa gateway/log. | **`["read(\"any\")", "read(\"team:museum-admins\")"]`** |
| **`private-kkn-archive`** | `read("team:museum-admins")`, **`update("team:museum-admins")`**, **`delete("team:museum-admins/owner")`** | **Kritis:** Admin KKN bisa memanggil `storage.updateFile` langsung untuk menyuntikkan `read("any")` ke berkas privat ini. | **`["read(\"team:museum-admins\")"]`** |
| **Unggahan Baru via Gateway** | `["read(\"team:museum-admins\")"]` | Perlindungan lanjutan chunk dan penegasan izin privat tunggal. | **`["read(\"team:museum-admins\")"]`** (+ verifikasi ulang `$permissions` + guard `409` file selesai) |

Isi biner `public-motif-sample` (`signature: 91e42db1c66c0b276abf6234dc50b2eb`, 68 B) dan `private-kkn-archive` (`signature: 60bd6c3960c05c33b41255aa65a10536`, 313 B) tetap utuh tanpa modifikasi.

---

## Bagian 4 — Validasi Integritas Berkas & Anti-Polyglot Gateway

Fungsi [`validateChunkIntegrity()`](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/main.js#L122) memeriksa biner aktual potongan awal (`rangeStart === 0`) di sisi server tanpa mengandalkan nama file, ekstensi, ataupun header MIME klien:

| Format | Pemeriksaan Biner & Kebijakan Server | Perilaku Saat Gagal |
| :--- | :--- | :--- |
| **Pre-Guard Polyglot (Non-SVG)** | Menolak signature executable PE (`MZ`), ELF (`\x7FELF`), shebang skrip (`#!`), HTML/JS (`<!doctype html`, `<html`, `<script`), serta PHP (`<?php`). | Tolak `HTTP 400` sebelum menyentuh Storage. |
| **Gambar Raster (`jpg/jpeg`, `png`, `webp`, `avif`, `tif/tiff`)** | Cocokkan *magic bytes*: JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), WebP (`RIFF....WEBP`), AVIF (`ftyp` + `avif/avis/mif1`), TIFF (`II*\0` / `MM\0*`). | Tolak `HTTP 400`. |
| **SVG (`svg`)** | Dibatasi maks **2 MiB (`2.097.152 B`)** agar 100% dokumen XML terbaca dalam 1 potongan; wajib mengandung tag `<svg`; menolak `<script>`, event handler `\bon[a-z]+=`, `javascript:`, `vbscript:`, `<foreignObject>`, `<iframe>`, `<object>`, `<embed>`, `<!ENTITY>`, `data:text/html`. | Tolak `HTTP 400` / `HTTP 413`. |
| **PDF (`pdf`)** | Wajib diawali `%PDF-`; memindai instruksi berisiko (`/JavaScript`, `/JS`, `/OpenAction`, `/Launch`, `/RichMedia`). | Tolak `HTTP 400`. |
| **ZIP (`zip`)** | Wajib diawali `PK\x03\x04` atau `PK\x05\x06`; memindai nama entri header `PK\x03\x04` agar bebas *false positive* byte terkompresi dan menolak entri berbahaya (`.exe`, `.dll`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.js`, `.html`, `.svg`, `.php`, dll). | Tolak `HTTP 400`. |
| **Audio (`wav`, `ogg`, `mp3`, `aac`)** | Memeriksa `RIFF....WAVE`, `OggS`, `ID3`/MPEG sync `FF E0`, serta ADTS `FF F0`/container `ftyp`. | Tolak `HTTP 400`. |
| **Video (`mp4`, `webm`)** | Memeriksa box ISO-BMFF `ftyp` pada offset `4..7` (MP4) dan header EBML `1A 45 DF A3` (WebM). | Tolak `HTTP 400`. |
| **Guard Chunk Continuity (`rangeStart > 0`)** | Memeriksa sesi target lewat `storage.getFile()`: menolak `HTTP 409` jika file telah selesai (`chunksUploaded >= chunksTotal`) atau `HTTP 400` jika ukuran total berbeda (anti timpa file existing). | Tolak `HTTP 404` / `409` / `400`. |

### Kebijakan & Keterbatasan Pemindaian Virus (> 20 MB / Arsip) — Analisis Statis

1. **Cakupan Appwrite Antivirus (`> 20 MB`):** Konfigurasi `antivirus: true` aktif pada bucket, namun Appwrite Cloud secara desain **melewati pemindaian ClamAV bawaan untuk berkas di atas `20 MB`**. Gateway mencatat status `antivirusCoverage` di `audit_logs` (`appwrite-av-eligible` vs `over-20mb-unscanned-private-quarantine`) dan menyimpan seluruh unggahan > 20 MB dalam mode **Privat/Karantina (`read("team:museum-admins")`)**.
2. **Keterbatasan Inspeksi Sekunder:** Gateway memvalidasi *magic bytes* potongan awal (`<= 5 MiB`) serta header entri ZIP pada chunk pertama tanpa melakukan dekompresi penuh ZIP besar ataupun pemindaian heuristik ClamAV sekunder di dalam runtime Function (`s-0.5vcpu-512mb`). Apabila kelak menerima arsip `.zip`/`.pdf` tak tepercaya dari luar tim, disarankan menonaktifkan `.zip` pada bucket atau memasang scanner eksternal sebelum publikasi.

---

## Bagian 5 — Hasil Pengujian Keamanan Nyata & Rangkuman Perubahan

* **Lingkungan Uji Nyata (`2026-11-26T16:01:14Z`):** Appwrite Cloud `6affdaa0003c416ecdb0`, bucket `museum-media` (`$permissions: []`), gateway `museum-admin-media` v3.0.0 (`6b0856da55305f225a4e`), `museum-public-api` v1.2.0, serta Google Chrome headless (`vite preview`). Akun produksi `adminkkn-peneliti` (`abhyy333@gmail.com`) tidak disentuh (memakai akun uji sementara `uat-kkn-*` yang langsung dihapus).
* **Hasil Build & Hygiene:** `npx tsc -b && npm run build` sukses bersih (`8.21s`), pemindaian `APPWRITE_API_KEY` pada `src/` & `dist/` = `0` temuan (`NO_SECRETS_IN_SRC_OR_DIST`).

| Skenario Uji | Jalur Uji | Hasil Aktual | Status |
| :--- | :--- | :--- | :---: |
| **Bucket, Scopes & Sample Lockdown (`M-01`)** | Appwrite CLI + `/health` | Bucket `$permissions: []`, 7 scope minimal, sampel hanya `read` | **LULUS** |
| **KKN / Desa / Super Admin direct `updateFile` (`M-03`)** | Web SDK & REST API `PUT` | **`HTTP 401`** (file baru maupun `private-kkn-archive`) | **LULUS** |
| **KKN / Desa / Super Admin direct `deleteFile` (`M-03`)** | Web SDK & REST API `DELETE` | **`HTTP 401`** | **LULUS** |
| **Anonymous direct mutation (`M-03`)** | REST API `PUT` / `DELETE` | **`HTTP 401`** | **LULUS** |
| **KKN / Desa / Super Admin upload via gateway (`M-02`)** | `POST /upload-chunk` (JWT) | **`HTTP 201`**, `$permissions = ['read("team:museum-admins")']` | **LULUS** |
| **KKN publish via gateway (`M-04`)** | `POST /media/:id/publish` | **`HTTP 403`** (ditolak server) | **LULUS** |
| **Desa & Super Admin publish/unpublish (`M-04`)** | Gateway `/publish` & `/unpublish` | **`HTTP 200`**, publik `200` → kembali privat `404` | **LULUS** |
| **Super Admin delete via gateway (`M-04`)** | `DELETE /media/:id` | Super Admin **`HTTP 200`**, Desa **`HTTP 403`** | **LULUS** |
| **Publik membaca media privat vs publik (`M-04`)** | Anonymous `GET .../view` | Privat (`private-kkn-archive`): **`HTTP 404`**; Publik (`public-motif-sample`): **`HTTP 200`** | **LULUS** |
| **Validasi Magic Bytes & Integrity (`M-05`)** | `POST /upload-chunk` | Ditolak `400`: HTML-in-PNG, PE `MZ`-in-JPG, shebang-in-MP4, XSS SVG, PDF `/OpenAction /JS`, `backdoor.exe`-in-ZIP; chunk hijack ke `public-motif-sample`: **`409`**. Diterima `201`: SVG/PDF/WAV/ZIP bersih & MP4 6 MiB multi-chunk (`202`→`201`). | **LULUS** |
| **Inventory `GET /media`, Audit Log & Chrome UI (`M-06`, `M-07`)** | Gateway, `audit_logs`, Chrome headless, `museum-public-api` | Anon `/media` `401`, Staf `200`; `audit_logs` memuat `role`, `timestamp`, `via: "server-gateway"`, `integrityCheck`, `antivirusCoverage`; Chrome UI `0` mutasi Storage langsung, `0` error console/page, Public API `200`. | **LULUS** |

### Daftar Berkas Terkait & Keadaan Pasca-Uji

* **Berkas Kode & Konfigurasi Diubah:** [main.js](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/main.js), [adminMediaApi.ts](file:///home/aby/Antigravity_Project/src/appwrite/adminMediaApi.ts), [mediaAccess.ts](file:///home/aby/Antigravity_Project/src/utils/mediaAccess.ts), [AdminMediaPage.tsx](file:///home/aby/Antigravity_Project/src/pages/admin/AdminMediaPage.tsx), dan [appwrite.config.json](file:///home/aby/Antigravity_Project/appwrite.config.json).
* **Keadaan Appwrite Cloud Pasca-Pembersihan:** `usersTotal = 3`, `bucketPermissions = []`, `public-motif-sample = ["read(\"any\")", "read(\"team:museum-admins\")"]`, `private-kkn-archive = ["read(\"team:museum-admins\")"]`, `mediaAssetsTotal = 0`, `auditLogsTotal = 0`.
