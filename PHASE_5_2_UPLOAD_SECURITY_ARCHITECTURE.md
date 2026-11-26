# Arsitektur Keamanan Unggahan Media Berotoritas Server (Tahap 5.2)
## Museum Digital Pringgasela Selatan

---

### 1. Latar Belakang Masalah

Pada Tahap 5.1, kontrol antarmuka CMS (`MediaUploader.tsx`, `AdminMediaPage.tsx`, `mediaAccess.ts`) telah menerapkan prinsip *Private by Default* dan memblokir akun Admin KKN dari menandai berkas sebagai publik di UI. Namun, bucket Appwrite Storage `museum-media` masih memiliki izin tingkat bucket `create("team:museum-admins")`, sehingga skrip klien non-UI yang memegang kredensial anggota tim tetap dapat memanggil `storage.createFile(..., ['read("any")'])` secara langsung ke Appwrite REST API dan membuat berkas publik sebelum melewati kurasi Admin Desa.

Tahap 5.2 menutup celah tersebut secara menyeluruh dengan memindahkan otoritas pembuatan berkas Storage ke sisi server melalui Appwrite Function **Museum Admin Media Gateway** (`museum-admin-media`), lalu mencabut izin `create("team:museum-admins")` dari bucket `museum-media`.

---

### 2. Arsitektur Gateway Unggahan Media

```text
[ Browser Admin CMS / Client ]
   │ 1. account.createJWT() -> JWT pendek milik user login
   │ 2. Potong berkas menjadi slice <= 5 MiB (Content-Range)
   ▼
[ HTTPS Proxy Domain: https://museum-admin-media-pringgasela.appwrite.network ]
   │ (Proxy Rule ID: 0e08cd6b6fb7b12b20e622b3f3346115)
   ▼
[ Appwrite Function: museum-admin-media v2.0.0 ]  <-- Deployment: 6b064772a59772b9f7ca
   │ 3. authenticateAdmin():
   │    - Verifikasi Bearer JWT via Account(userClient.setJWT(jwt)).get()
   │    - Query keanggotaan tim aktual Teams(adminClient).listMemberships('museum-admins')
   │      dan wajib confirm === true (abaikan header role dari klien)
   │ 4. Validasi ekstensi, konsistensi MIME <-> ekstensi, ukuran maks 50.000.000 B,
   │    serta tolak X-Is-Public: true dari peran Admin KKN (HTTP 403)
   ▼
[ Appwrite Server SDK (x-appwrite-key runtime scope) ]
   ├──► Storage bucket `museum-media` (permission dikunci server: ['read("team:museum-admins")'])
   ├──► TablesDB `media_assets` (ID baris = fileId 1:1; rollback Storage file bila gagal)
   └──► TablesDB `audit_logs` (catatan server-side create / publish / unpublish / delete)
```

---

### 3. Mengapa Pola Proxy Domain + Chunking 5 MiB Dipilih

Pengukuran empiris pada Appwrite Cloud Free/Starter Plan menunjukkan batasan mekanisme eksekusi standar:

| Jalur Pengiriman | Hasil Uji Ukuran Payload | Kesimpulan Teknis |
| :--- | :--- | :--- |
| `functions.createExecution()` (base64 JSON body) | Sukses hingga payload base64 ~8 MB (`6.144 KB` mentah); gagal **`502 Bad Gateway`** pada `16 MB`. Selain itu menolak header kustom berawalan `x-appwrite-*` (`HTTP 400`). | Tidak memadai untuk video/audio lapangan hingga `50 MB`. |
| HTTPS Proxy Domain (`*.appwrite.network`) kirim tunggal utuh (`req.bodyBinary`) | Sukses `1 MB` (~500 ms), `10 MB` (~1,48 s), dan `20 MB` (~2,63 s); gagal **`502 Bad Gateway`** pada `30 MB`. | Aman per potongan <= 20 MB, namun belum menjangkau batas `50 MB` bucket dalam sekali kirim. |
| **Proxy Domain + Server Chunking `5 MiB`** (`/upload-chunk` via `Content-Range` & `X-Upload-File-Id`) | Potongan biner maks `5 MiB` (5.242.880 B) diteruskan menggunakan `X-Appwrite-Key` ke REST Appwrite Storage; diuji nyata hingga `6.291.456 B` (6 MiB, 2 chunk `202` -> `201`) dan mendukung file hingga batas penuh bucket **`50.000.000 B`**. | **Dipilih.** Mempertahankan pemakaian memori ~5 MiB per permintaan dan tanpa base64 overhead. |

Catatan penting konfigurasi proxy Appwrite: router Open Runtimes (`0.10.96`) menolak panggilan domain kustom dengan `403 router_unauthorized_execution` bila `execute` disetel ke `["team:museum-admins"]` dan klien mengirim Bearer JWT (`Authorization: Bearer <jwt>`). Oleh karena itu, `execute` fungsi disetel `["any"]` pada lapisan router sementara **setiap endpoint operasional** (`/me`, `/upload-chunk`, `/media/:fileId/publish`, `/media/:fileId/unpublish`, `DELETE /media/:fileId`) memaksa validasi JWT + status aktif `museum-admins` sebelum memanggil resource apa pun (`HTTP 401` / `403`).

---

### 4. Kontrak Endpoint `museum-admin-media` v2.0.0

Implementasi utama berada di [main.js](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/main.js):

1. **`GET /` dan `GET /health`** — Probe liveness minimal (`{ status: "ok", service: "Museum Admin Media Gateway", version: "2.0.0" }`). Tidak membocorkan ID proyek, konfigurasi database, bucket, maupun environment.
2. **`GET /me`** — Mengembalikan `{ userId, role, canPublish, canDelete }` berdasarkan keanggotaan live Appwrite Team (`owner` -> `super_admin`, `desa` -> `admin_desa`, `kkn` -> `admin_kkn`).
3. **`POST /upload-chunk`** —
   - Menolak `X-Is-Public: true` jika `canPublish === false` (`HTTP 403`).
   - Memvalidasi ekstensi terhadap daftar 16 ekstensi bucket dan kecocokan tabel `ALLOWED_MIME_MAP` (`HTTP 400`).
   - Memvalidasi `X-File-Size` (> 0 dan <= `50.000.000` B -> `HTTP 413`), ukuran potongan (`<= 5.242.880 B` -> `HTTP 413`), dan integritas header `Content-Range` (`HTTP 400`).
   - Mengunggah menggunakan Server SDK (`<= 5 MiB`) atau `fetch` Storage `Content-Range` dengan `permissions = ['read("team:museum-admins")']` (selalu privat saat dibuat).
   - Pada chunk terakhir, membuat baris `media_assets` dengan rollback `storage.deleteFile()` bila pembuatan baris metadata gagal, lalu mencatat `audit_logs` (`action: 'create'`).
4. **`POST /media/:fileId/publish` & `POST /media/:fileId/unpublish`** —
   - Hanya `super_admin` dan `admin_desa` (`HTTP 403` untuk `admin_kkn`).
   - Sebelum `publish`, memverifikasi keberadaan baris `media_assets` untuk `fileId` target (`HTTP 404` bila berkas belum terdaftar).
   - Memperbarui `$permissions` Storage menjadi `['read("any")', 'read("team:museum-admins")']` atau `['read("team:museum-admins")']`, memverifikasi ulang hasil `$permissions` dari server, dan mencatat `audit_logs`.
5. **`DELETE /media/:fileId`** —
   - Khusus `super_admin` (`HTTP 403` untuk `admin_desa` dan `admin_kkn`).
   - Membersihkan relasi pada `motif_media`, `craft_media`, `culture_media`, menghapus berkas Storage serta baris `media_assets`, dan mencatat `audit_logs` (`action: 'delete'`).

---

### 5. Evaluasi Kebutuhan Perubahan Schema

**Kesimpulan:** Tidak ada perubahan skema Appwrite TablesDB (`0` kolom ditambah/diubah). Kolom existing pada tabel `media_assets` (`fileId`, `bucketId`, `mediaType`, `mimeType`, `fileSizeBytes`, `altTextId`, `altTextEn`, `captionId`, `captionEn`, `photographer`, `createdById`) dan `audit_logs` sudah sepenuhnya kompatibel dengan penulisan atomik dari server gateway.

---

### 6. Pembaruan Keamanan Phase 5.4 (`museum-admin-media v4.0.0` & `museum-public-api v1.3.0`)

Pada Phase 5.4, gateway ditingkatkan dari `v2.0.0`/`v3.0.0` ke **`v4.0.0`** (Deployment `6b085d18b66fb6708142`, **5 minimal API Key scopes**: `files.read`, `files.write`, `rows.read`, `rows.write`, `teams.read`):

1. **Sesi Upload Terikat HMAC-SHA256 (`UPLOAD_SESSION_SECRET`)**: Menerbitkan `sessionToken` (`X-Upload-Session-Token`) pada chunk 0 dengan masa berlaku 20 menit (`HTTP 410` saat kedaluwarsa), isolasi lintas pengguna (`HTTP 403`), penguncian metadata sesi (`HTTP 409`), lock konkurensi paralel (`HTTP 409`), penolakan duplikasi/lompatan chunk (`HTTP 409`), serta verifikasi `X-File-Sha256` / `X-File-Md5`.
2. **Karantina Keras (`HTTP 422`)**: File `> 20.000.000` bytes (melewati batas AV Appwrite Cloud), `image/svg+xml`, dan `application/zip` dikunci sebagai arsip privat; permintaan `POST /media/:fileId/publish` diblokir dengan `HTTP 422`, serta `museum-public-api v1.3.0` menolak item karantina lewat `isPublicStorageFile()`.
3. **Inspeksi Parser Struktural ([security.js](file:///home/aby/Antigravity_Project/functions/museum-admin-media/src/security.js))**: XML tag-whitelist untuk SVG (`<!DOCTYPE`/`<!ENTITY`/`<![CDATA[`/event handler/skema URI terlarang), pemindai LFH + Central Directory ZIP terhadap path traversal, nested archive, zip-bomb ratio, dan ekstensi eksekusi, serta inspeksi `IHDR`/`IEND` PNG, payload pasca-`EOI` JPEG, dan `/AA` + `%%EOF` PDF.
4. **Rekonsiliasi & Ketahanan Operasional**: Rate limiter jendela geser (`HTTP 429` + `Retry-After`), sanitasi error `500`, `GET /media/reconcile` (`admin_desa`/`super_admin`), dan `POST /media/cleanup-incomplete` (`super_admin`).
