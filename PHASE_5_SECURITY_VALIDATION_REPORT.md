# Laporan Validasi Keamanan Tahap 5
## (Phase 5 Security Validation Report) — Museum Digital Pringgasela Selatan

---

### 1. Verifikasi Arsitektur Tanpa-Rahasia (*Zero-Secret Frontend*)

1. Seluruh akses publik ke data koleksi dan media menggunakan endpoint terisolasi Appwrite Function `museum-public-api` (`v1.1.0`, deployment aktif `6b05de2b1e411bc6e51b`).
2. Tidak ada API key Appwrite maupun kredensial admin dalam bundel klien (`src/` dan `dist/`), dibuktikan lewat pemindaian langsung `grep -rn -i "APPWRITE_API_KEY" src/ dist/` (`NO_SECRETS`).

---

### 2. Verifikasi Isolasi Basis Data & Public API

| Lapisan Kontrol | Perilaku Teramati Saat Pengujian Langsung (Appwrite 2.7.2) | Kesimpulan |
| :--- | :--- | :---: |
| Tabel konten dengan `rowSecurity: true` (`weaving_motifs`, `crafts`, `cultures`, `village_history`, `museum_settings`, dll.) | Panggilan anonim `tablesDB.listRows()` mengembalikan `total: 0, rows: []`; panggilan langsung `getRow('motif-subahnale')` diblokir oleh Appwrite. | Aman |
| Tabel `audit_logs` (`rowSecurity: false`, izin baca `owner`/`desa`) | Klien anonim maupun akun `admin_kkn` menerima penolakan resmi `HTTP 401 user_unauthorized` saat mencoba membaca log audit. | Aman |
| Public API (`/motifs`, `/motifs/:slug`, `/history`) | Filter `Query.equal('status', 'published')` diterapkan di server Appwrite Function. Draf (`motif-draft-rahasia`), antrean `in_review`, dan sejarah `draft` menghasilkan HTTP `404` saat diminta melalui slug. | Aman |
| Resolusi media publik pada `museum-public-api` v1.1.0 | Sebelum mengembalikan `media[]`, fungsi memeriksa izin berkas via `storage.getFile()`. Berkas tanpa `read("any")` (misal PDF internal `private-kkn-archive` atau dokumen KKN internal) disaring keluar dari respons JSON publik. | Aman |

---

### 3. Verifikasi Kontrol Akses Storage (`museum-media`)

1. **Bucket Setting:** `fileSecurity: true`, batas ukuran `50.000.000` bytes (~47,6 MiB), hanya 16 ekstensi sah (`jpg`, `jpeg`, `png`, `webp`, `svg`, `avif`, `tif`, `tiff`, `mp3`, `wav`, `aac`, `ogg`, `mp4`, `webm`, `pdf`, `zip`).
2. **Isolasi Publik vs Privat:**
   - Berkas berizin `read("any")` (`public-motif-sample`) dapat diakses anonim (`HTTP 200`).
   - Berkas berizin `read("team:museum-admins")` (`private-kkn-archive`) menghasilkan `HTTP 404` saat diakses tanpa sesi kurator aktif.
3. **Perbaikan Izin Klien Unggah:**
   - Izin file klien pada `MediaUploader.tsx` dibatasi hanya pada `[Permission.read(Role.any() | Role.team(...)), Permission.update(Role.user(userId))]`, sesuai batas Appwrite yang melarang akun `kkn`/`desa` menyematkan role di atas miliknya, sementara izin tingkat bucket tetap memberikan hak mutakhir `desa`/`owner` dan hak hapus eksklusif `owner`.

---

### 4. Verifikasi RBAC & Proteksi UI Pengelola

1. **Pengguna Terautentikasi Non-Anggota (`role === null`):**
   - `AdminLoginPage.tsx` dan `ProtectedAdminRoute` di `App.tsx` memeriksa `Boolean(user && role)` sehingga akun Appwrite biasa di luar tim `museum-admins` ditolak masuk ke panel CMS dengan opsi keluar akun.
2. **Admin KKN (`kkn`):**
   - Diizinkan membuat draf (`weaving_motifs`, `crafts`, `cultures`, `village_history`, `contributors`), mengelola lampiran media draf miliknya sendiri (`buildCreatorRowPermissions` + `delete(Role.user(userId))` pada tabel relasi media), mengajukan `in_review`, serta mencatat log audit (`create`/`update`).
   - Diblokir secara UI maupun server (`HTTP 401`) dari publikasi, membaca `audit_logs`, menulis `categories`, mengubah `museum_settings`, maupun menghapus permanen.
3. **Admin Desa (`desa`):**
   - Diizinkan mengurasi, menyetujui (`reviewedById`), menerbitkan (`published`), mengarsipkan (`archived`), membaca `audit_logs`, dan mengelola `categories`.
   - Diblokir dari menghapus permanen (`deleteRow`) dan mengubah `museum_settings`.
4. **Super Admin (`owner`):**
   - Pemegang kendali penuh termasuk pengaturan global museum dan penghapusan permanen bersyarat (*cascade delete*) atas entitas maupun media Storage.
