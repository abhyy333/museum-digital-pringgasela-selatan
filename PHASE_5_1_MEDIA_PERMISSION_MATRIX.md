# Matriks Izin & Siklus Hidup Media (Phase 5.1 Media Permission Matrix)
## Museum Digital Pringgasela Selatan

---

### 1. Kebijakan Dasar: Private By Default & Single Source of Truth

1. **Status Bawaan (*Default*):** Seluruh unggahan media baru otomatis berstatus **Privat (Hanya Tim Kurator)** dengan permission Storage tepat: `["read(\"team:museum-admins\")"]`.
2. **Sumber Kebenaran Tunggal:** Status akses publik maupun privat dibaca langsung dari `$permissions` Appwrite Storage (`read("any")`) tanpa menduplikasi kolom status di `media_assets`, sehingga mencegah inkonsistensi status antara database dan bucket penyimpanan (*no schema drift*).
3. **Independensi Relasi Entitas:** Menautkan berkas media Privat ke `weaving_motifs`, `crafts`, `cultures`, atau `contributors.photoFileId` **TIDAK PERNAH** mengubah permission Storage menjadi publik secara otomatis.

---

### 2. Perbandingan Kondisi Permission Sebelum vs Sesudah Perbaikan

| Aksi / Status Media | Sebelum Phase 5.1 (*Before*) | Sesudah Phase 5.1 (*After*) |
| :--- | :--- | :--- |
| **Nilai default `MediaUploader`** | `defaultPublic = true` (langsung `Publik`) | `defaultPublic = false` (**Privat (Staf)**) |
| **Permission upload oleh Admin KKN** | `["read(\"any\")", "update(\"user:<kkn>\")"]` atau `read(team) + update(user)` | `["read(\"team:museum-admins\")"]` (**tanpa** `read("any")` dan **tanpa** `update(user)`) |
| **Kemampuan KKN mengubah file via `storage.updateFile`** | Diizinkan oleh `update(user:<kkn>)` | **Ditolak Server Appwrite (`HTTP 401`)** |
| **Kemampuan Admin Desa mempublikasikan media** | Tidak ada UI; file KKN tidak memiliki izin update untuk non-owner user permission | Tersedia aksi eksplisit **Publikasikan Media** (konfirmasi + verifikasi Storage -> `["read(\"any\")", "read(\"team:museum-admins\")"]`) |
| **Pencabutan akses publik media (*Unpublish*)** | Tidak tersedia di CMS | Tersedia aksi **Tarik ke Privat** (`canPublish` -> kembali `["read(\"team:museum-admins\")"]` + audit `unpublish`) |
| **Unggah potret tokoh (`AdminContributorsPage`)** | `defaultPublic={true}` | `defaultPublic={false}` + status akses & toggle eksplisit `canPublish` |
| **File tanpa baris `media_assets`** | Tidak terdeteksi di UI; berpotensi lolos pada `photoFileId` | Ditampilkan pada tabel audit khusus di `/admin/media`; ditolak otomatis oleh `museum-public-api` |
| **Pembaruan `museum-public-api`** | v1.1.0 (limit list relasi `3`; `photoFileId` tidak difilter) | **v1.2.0** (limit list relasi `20`; filter ketat `read("any")` & metadata `media_assets` termasuk `contributors.photoFileId`) |

---

### 3. Matriks Kontrol Akses per Peran (Appwrite Storage + CMS)

| Operasi / Hak Akses | Pengunjung Anonim | Admin KKN (`kkn`) | Admin Desa (`desa`) | Super Admin (`owner`) |
| :--- | :---: | :---: | :---: | :---: |
| **Lihat / Unduh Media Publik (`read("any")`)** | Diizinkan (`HTTP 200`) | Diizinkan | Diizinkan | Diizinkan |
| **Lihat / Pratinjau Media Privat (`read("team:museum-admins")`)** | **Ditolak (`HTTP 404`)** | Diizinkan (CMS terautentikasi) | Diizinkan (CMS terautentikasi) | Diizinkan (CMS terautentikasi) |
| **Unggah Berkas Baru ke `museum-media`** | **Ditolak (`HTTP 401`)** | Diizinkan (**Terkunci Privat**) | Diizinkan (**Default Privat**, opsi Publik + konfirmasi) | Diizinkan (**Default Privat**, opsi Publik + konfirmasi) |
| **Ubah Permission ke Publik (`read("any")`)** | **Ditolak** | **Ditolak UI & Server (`401`)** | Diizinkan (dengan konfirmasi + log `publish`) | Diizinkan (dengan konfirmasi + log `publish`) |
| **Tarik Media Publik Menjadi Privat (`unpublish`)** | **Ditolak** | **Ditolak UI & Server (`401`)** | Diizinkan (dengan konfirmasi + log `unpublish`) | Diizinkan (dengan konfirmasi + log `unpublish`) |
| **Tautkan Media ke Draf / Entitas (`EntityMediaManager`)** | **Ditolak** | Diizinkan pada draf/karya miliknya (tidak mengubah izin publik) | Diizinkan (peringatan tampil bila media masih Privat) | Diizinkan (peringatan tampil bila media masih Privat) |
| **Hapus Permanen File Storage & `media_assets`** | **Ditolak (`HTTP 401`)** | **Ditolak (`HTTP 401`)** | **Ditolak (`HTTP 401`)** | Diizinkan (`delete` berantai relasi + Storage + row) |

---

### 4. Kebijakan Penanganan Inkonsistensi & Kegagalan Perubahan Permission

1. **Verifikasi Paska-Update (`setMediaFilePublicAccess`):** Setelah memanggil `storage.updateFile(...)`, sistem memeriksa langsung `isStorageFilePublic(updated.$permissions)` dari respons server Appwrite.
2. **Penolakan State Palsu:** Apabila panggilan Storage gagal (jaringan putus atau `HTTP 401`) atau nilai `$permissions` kembalian tidak cocok dengan target, fungsi melempar eksepsi eksplisit dan state antarmuka tidak diperbarui (tidak pernah menampilkan lencana `Publik` palsu).
3. **Berkas Hilang / Tanpa Metadata:** Apabila baris `media_assets` menunjuk ke `fileId` yang tidak ditemukan di Storage, `AdminMediaPage` dan `EntityMediaManager` menandainya sebagai **Hilang**, dan `museum-public-api` mengabaikannya secara aman tanpa menggagalkan keseluruhan respons JSON.
