# Buku Panduan Pengguna Admin CMS (Admin User Guide)
## Museum Digital Pringgasela Selatan
**Pedoman Operasional Pengelolaan Arsip Budaya & Kurasi Digital**

---

### 1. Pendahuluan & Sasaran Pengguna

Buku panduan ini disusun sebagai rujukan resmi bagi seluruh pengelola platform Museum Digital Pringgasela Selatan. Sistem manajemen konten (CMS) ini dirancang khusus untuk memastikan dokumentasi warisan luhur Desa Pringgasela Selatan—termasuk Tenun Tradisional, Batik Sasambo, Ensiklopedia Motif, Seni Sakral Dzikir Saman, serta Sejarah Desa—dapat dikelola secara berkelanjutan antar-generasi.

Sistem membedakan tiga tingkatan peran pengguna (*Roles*):
1. **Super Admin (Kepala Desa / Koordinator Pengelola):** Penanggung jawab umum, memiliki wewenang penuh termasuk penghapusan data dan konfigurasi museum.
2. **Admin Desa (Aparatur / Staf Kebudayaan Desa):** Kurator utama, berwenang memverifikasi draf, menyunting data teknis, dan menerbitkan konten (*publish*) ke website publik.
3. **Admin KKN (Mahasiswa Kuliah Kerja Nyata / Peneliti Lapangan):** Pengumpul data lapangan, berwenang mencatat hasil wawancara sesepuh adat, menginput draf motif baru, dan mengunggah dokumentasi foto/audio.

---

### 2. Akses & Autentikasi Sistem

1. **Alamat Masuk Panel Admin:** Buka peramban dan tuju rute `/admin/login`.
2. **Login Akun:**
   - Masukkan alamat email kedinasan/resmi yang terdaftar pada tim `museum-admins`.
   - Masukkan kata sandi rahasia.
   - Klik tombol **"Masuk ke Panel Kurasi"**.
3. **Akun Pengujian / Rintisan (*Seed Accounts*):**
   - Super Admin: `superadmin@pringgasela.desa.id`
   - Admin Desa: `admindesa@pringgasela.desa.id`
   - Admin KKN: `kkn@pringgasela.desa.id`
4. **Keluar Sistem (*Logout*):** Klik tombol **"Keluar"** di sudut bawah bilah navigasi kiri (sidebar). Sesi peramban akan langsung ditutup secara aman.

---

### 3. Matriks Hak Akses & Pembagian Wewenang

| Modul & Aksi | Super Admin | Admin Desa | Admin KKN |
| :--- | :---: | :---: | :---: |
| Input Draf Motif / Kriya / Tradisi Baru | Ya | Ya | Ya |
| Unggah Foto & Media Dokumentasi | Ya | Ya | Ya |
| Sunting Konten Draf Sendiri | Ya | Ya | Ya |
| Verifikasi Kurasi Kebudayaan | Ya | Ya | Tidak (Perlu Tinjauan Desa) |
| Mengubah Status Menjadi **Terbit (*Published*)** | Ya | Ya | Tidak (Terkunci Draf) |
| Menghapus Data Permanen | Ya | Tidak (Hanya Arsip) | Tidak |
| Mengubah Pengaturan Global Museum | Ya | Tidak | Tidak |
| Melihat Daftar Anggota Tim Admin | Ya | Ya | Ya |

---

### 4. Prosedur Pendokumentasian Motif Tenun (Langkah Demi Langkah)

Pendokumentasian motif tenun adalah modul paling penting dalam platform ini. Ikuti alur kerja berikut untuk mendaftarkan motif tenun baru:

#### Langkah 1: Kumpulkan Data Lapangan
Pastikan Anda telah mewawancarai maestro penenun atau sesepuh adat terkait:
- Nama motif lokal dan seruan adatnya.
- Penenun yang merajut (nama, dusun, lama pengalaman).
- Alat tenun yang digunakan (Gedogan / ATBM) dan pewarna (Alami / Sintetis).
- Makna filosofis, doa, atau pesan moral di balik pola ragam hias.
- Foto beresolusi tinggi (tampak bidang datar simetris dan detail pakan-lungsi).

#### Langkah 2: Buka Menu Motif Tenun
- Klik menu **"Motif Tenun"** pada sidebar admin (`/admin/motifs`).
- Klik tombol **"+ Tambah Motif Tenun"** di kanan atas.

#### Langkah 3: Isi Formulir Identitas Motif
- **Nama Motif (Indonesia):** Contoh: `Motif Subahnale`
- **Motif Name (English):** Contoh: `Subahnale Motif`
- **Slug URL Unik:** Karakter huruf kecil dan tanda hubung tanpa spasi, contoh: `motif-subahnale`.
- **Kode Registrasi:** Kode katalog internal, contoh: `SBN-01`.
- **Kategori:** Pilih kategori tenun yang sesuai (misal: `Tenun Gedogan Tradisional`).
- **Tokoh Adat / Penenun:** Pilih nama maestro penenun yang telah terdaftar di sistem.
- **Pewarna Alami:** Centang jika menggunakan bahan nabati (tarum, kayu mahoni, kemiri).
- **Tandai Unggulan (*Featured*):** Centang jika motif ini merupakan mahakarya ikonik desa untuk ditampilkan di halaman beranda.

#### Langkah 4: Isi Uraian Kuratorial Dwibahasa
- **Morfologi Visual:** Uraikan struktur geometris garis, bidang belah ketupat, dan tata letak ornamen.
- **Filosofi & Makna Spiritual:** Jelaskan pesan filosofis leluhur Sasak yang terkandung di dalamnya.
- **Teknik & Rancang Bangun Tenun:** Jelaskan perhitungan pakan-lungsi dan keahlian tangan penenun.
- **Penggunaan Adat & Daur Hidup:** Sebutkan upacara apa yang mewajibkan busana motif ini.
- **Asal-Usul & Tutur Lisan:** Catat riwayat sejarah atau cerita rakyat yang melatarbelakangi penamaan motif.

#### Langkah 5: Simpan & Tinjau Status
- Klik **"Simpan Draf Motif"**.
- Admin KKN: Status otomatis tersimpan sebagai **Draf**. Laporkan kepada Admin Desa untuk diverifikasi.
- Admin Desa / Super Admin: Setelah diverifikasi bersama sesepuh desa, ubah status publikasi menjadi **Terbit (*Published*)** agar langsung muncul di website museum publik.

---

### 5. Prosedur Pendokumentasian Kriya, Tradisi, & Sejarah Desa

1. **Kriya Budaya (`/admin/crafts`):**
   - Digunakan untuk mencatat jenis kerajinan seperti Tenun Gedogan Pringgasela dan Batik Sasambo.
   - Sertakan perkiraan waktu pembuatan, alat kerja, dan daftar bahan baku lokal.
2. **Tradisi Komunal & Dzikir Saman (`/admin/cultures`):**
   - Catat periodisitas (rutin mingguan, perayaan maulid, atau insidental).
   - Cantumkan tata cara ritual, susunan jamaah, dan makna spiritual pembersihan kalbu.
3. **Linimasa Sejarah Desa (`/admin/history`):**
   - Catat babak sejarah (contoh: Era Kerajaan Selaparang 1820–1900, Era Pembentukan Desa Mandiri).
   - Masukkan urutan penomoran (*Sort Order*) agar linimasa tampil runtut secara kronologis.

---

### 6. Pengelolaan Repositori Media (`/admin/media`)

1. **Batas Ukuran Berkas:** Maksimal **50 MB** per berkas (disesuaikan dengan kapasitas paket penyimpanan Appwrite Free-Tier).
2. **Format yang Didukung:** Foto (JPG, PNG, WebP), Vektor/Diagram (SVG), Dokumen Transkrip Adat (PDF).
3. **Resolusi yang Dianjurkan:** Foto kain tenun sebaiknya diambil pada resolusi minimal 1920×1080 piksel dengan pencahayaan alami agar warna serat asli tidak terdistorsi.
4. **Keamanan Berkas:** Seluruh media yang diunggah ke *bucket* `museum-media` dilindungi keamanan tingkat berkas (*File-Level Security*). Berkas publik dapat dilihat oleh pengunjung umum melalui URL aman, sementara hak hapus dilindungi hanya untuk Super Admin.

---

### 7. Protokol Transisi Mahasiswa KKN (*KKN Cohort Handover Protocol*)

Setiap pergantian periode mahasiswa KKN, lakukan prosedur serah terima berikut demi menjamin integritas data:
1. **Penyelesaian Seluruh Draf:** Sebelum masa tugas KKN berakhir, pastikan seluruh draf wawancara lapangan telah dilengkapi dan diberi catatan sumber informan yang jelas.
2. **Sidang Verifikasi Desa:** Mahasiswa KKN memaparkan draf dokumentasi baru di hadapan Kepala Desa, Kaur Kesra, dan Tokoh Lembaga Adat Desa Pringgasela Selatan.
3. **Pengesahan Publikasi:** Admin Desa mengubah status draf yang lolos verifikasi menjadi **Published**.
4. **Penonaktifan Akun Angkatan:** Super Admin menonaktifkan akun KKN angkatan sebelumnya atau memperbarui kata sandi untuk diserahkan secara resmi kepada koordinator KKN angkatan berikutnya melalui Berita Acara Serah Terima Digital.
