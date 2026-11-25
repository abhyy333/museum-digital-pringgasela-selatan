# Panduan Operasional Pengelola CMS Museum Digital Pringgasela Selatan
## (Museum Admin Operating Guide)

---

### 1. Akses Panel & Peran Pengelola

- **Alamat Login CMS:** `/admin/login`
- **Tim Appwrite Resmi:** `museum-admins` (akun di luar tim ini otomatis ditolak masuk ke panel admin).

| Peran CMS | Kode Tim Appwrite | Tugas Harian | Batasan Sistem |
| :--- | :---: | :--- | :--- |
| **Super Admin** | `owner` | Pengelolaan penuh sistem, konfigurasi global, manajemen kategori, kurasi/publikasi, dan penghapusan permanen arsip/media. | — |
| **Admin Desa** | `desa` | Kurasi ilmiah/adat, sunting seluruh entri, manajemen kategori budaya, tinjau log aktivitas, ubah status ke `published` atau `archived`. | Tidak bisa menghapus permanen (`deleteRow`) atau mengubah `/admin/settings`. |
| **Admin KKN** | `kkn` | Dokumentasi lapangan: tambah profil tokoh baru, input draf Motif/Kriya/Budaya/Sejarah, unggah media, ajukan ke `in_review`. | Tidak dapat menerbitkan (`published`), mengarsipkan, membaca log audit, mengelola kategori, mengubah pengaturan global, atau menghapus entri. |

*(Catatan Operasional Keamanan: Segera ubah kata sandi awal akun bawaan melalui Konsol Appwrite sebelum pengoperasian produksi publik).*

---

### 2. Alur Kerja Kurasi & Penerbitan Konten

```
[Admin KKN / Staf]               [Admin Desa / Super Admin]
   Input Draf         ──>         Verifikasi Substansi & Adat
 (status: draft)                   (tinjau status: in_review)
       │                                      │
       └─ Ajukan Verifikasi ──────────────────┴──> Terbitkan (published)
                                              └──> Arsipkan (archived)
```

1. **Menambahkan Data Lapangan (KKN / Admin Desa):**
   - Pastikan profil maestro/tokoh adat sudah terdaftar di menu **Tokoh & Pengrajin** (`/admin/contributors`) agar dapat dikaitkan ke koleksi.
   - Isi **Slug URL** dengan huruf kecil dan tanda hubung (contoh: `motif-keker-pringgasela`).
   - Isi **Konten Bahasa Indonesia (Wajib)** serta **English Translation** apabila sudah siap.
   - Sistem otomatis menyimpan ketikan sementara formulir Anda di peramban (`sessionStorage`), sehingga apabila sesi atau jaringan terputus sementara, tombol **"Pulihkan Draf"** akan muncul saat formulir dibuka kembali.
2. **Menautkan & Mengurutkan Galeri Media:**
   - Pada bagian **"Galeri Foto & Dokumentasi Multimedia"**, klik **Unggah Baru** atau **Pilih dari Pustaka Media**.
   - Gunakan ikon panah naik/turun atau tombol bintang (**Jadikan Foto Utama**) untuk menempatkan foto utama di urutan **#1**.
   - Untuk **Motif Tenun**, centang **Diagram Pola** bila berkas tersebut adalah sketsa geometris/ragam hias.
   - Untuk **Kriya & Tenun**, pilih tipe resmi (`tenun_gedogan`, `tenun_sesek`, `batik_sasambo`, `anyaman`, `lainnya`) dan tentukan peran tiap foto (`Foto Sampul`, `Galeri`, `Tahap Proses`, atau `Detail Close-Up`).
   - Untuk **Tradisi Budaya**, unggah rekaman suara lalu centang **Audio Zikir/Lantunan** agar pemutar audio tampil otomatis pada halaman publik.
3. **Verifikasi & Publikasi (Admin Desa / Super Admin):**
   - Buka daftar entri berstatus `in_review` atau `draft`.
   - Periksa kebenaran isi, ejaan istilah Sasak, kelengkapan foto publik (berkas privat tidak akan tampil di publik), lalu ubah status ke **Published** dan klik **Simpan**. ID kurator penyetuju tercatat pada `reviewedById`.

---

### 3. Pengelolaan Pustaka Media (`museum-media`) & Penghapusan Aman

- **Berkas Publik vs Privat:** Hanya unggahan dengan akses **Publik** yang dapat ditampilkan pada halaman koleksi pengunjung melalui `museum-public-api`. Berkas **Privat** (misal PDF transkrip internal) hanya dapat dibuka saat login di CMS.
- **Penghapusan Media (Khusus Super Admin):** Menghapus aset dari `/admin/media` otomatis memutus tautannya di tabel `motif_media`, `craft_media`, dan `culture_media` terlebih dahulu sebelum menghapus berkas di Storage dan `media_assets` agar tidak meninggalkan tautan rusak di galeri.

---

### 4. Protokol Serah Terima & Pencabutan Akses Mahasiswa KKN

1. Saat masa tugas mahasiswa KKN selesai, pencabutan akses dilakukan dengan mengeluarkan akun mahasiswa KKN dari tim `museum-admins` di Appwrite Console (menu **Pengguna & Akses** di `/admin/users` menampilkan panduan ringkasnya).
2. Seluruh data budaya, foto, dan narasi yang diinput mahasiswa **tetap tersimpan aman** dan atribusi `createdById` tetap utuh.
3. Konten sejarah desa tidak lagi menimpa `createdById` asli saat disunting Admin Desa di masa mendatang.
