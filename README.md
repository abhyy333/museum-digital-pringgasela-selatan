# Museum Digital Pringgasela Selatan

> **Platform Preservasi & Ensiklopedia Budaya Digital Berstandar Kuratorial Kontemporer**  
> Mendokumentasikan Tenun Tradisional Gedogan Pringgasela, Batik Sasambo, Ensiklopedia Ragam Hias Motif, Kesenian Sakral Dzikir Saman, dan Sejarah Desa Pringgasela Selatan, Kabupaten Lombok Timur, Nusa Tenggara Barat.

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Appwrite](https://img.shields.io/badge/Appwrite-Cloud_v29-FD366E?logo=appwrite&logoColor=white)](https://appwrite.io/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 🏛️ Latar Belakang & Visi Proyek

Desa Pringgasela Selatan merupakan salah satu episentrum tertua tradisi tenun gedogan di Pulau Lombok dengan kekayaan kriya tekstil yang telah diwariskan turun-temurun sejak era Kesultanan Selaparang. Platform **Museum Digital Pringgasela Selatan** dibangun untuk:
1. **Penyelamatan Warisan Takbenda (*Intangible Cultural Heritage*):** Mendokumentasikan makna filosofis, doa spiritual, dan kosmologi ragam hias motif tenun kuno sebelum punah tergerus zaman.
2. **Atribusi & Perlindungan Hak Cipta Penenun:** Memastikan karya para maestro penenun tradisional diakui dengan mencatat nama, dusun, dan riwayat keahlian menenun secara transparan.
3. **Pemberdayaan Ekonomi Budaya & Literasi Global:** Menyediakan platform dwibahasa (Indonesia - Inggris) berstandar editorial museum dunia yang menghubungkan warisan desa dengan periset, kurator, dan wisatawan global.

---

## ✨ Fitur Utama

### 1. Website Publik (Bilingual ID / EN)
- **Beranda Kuratorial (`/`):** Ringkasan statistik budaya, sorotan motif unggulan (*featured*), cuplikan Dzikir Saman, dan timeline sejarah desa.
- **Ensiklopedia Motif Tenun (`/motifs` & `/motifs/:slug`):**
  - Kajian morfologi visual dan struktur simetri pola ornamen.
  - Filosofi luhur dan makna spiritual Sasak di balik setiap nama motif.
  - Rancang bangun teknik tenun pakan-lungsi dan alat tenun gedogan (*cag-cag*).
  - Penggunaan busana adat pada upacara daur hidup masyarakat.
  - Asal-usul lisan dan riwayat sejarah Kesultanan Selaparang.
  - Atribusi maestro penenun tradisional (nama, dusun, tahun pengalaman).
  - Galeri visual beresolusi tinggi dengan penampil gambar responsif.
- **Kriya Tekstil Tradisional (`/crafts` & `/crafts/:slug`):** Dokumentasi Tenun Pringgasela dan Batik Sasambo.
- **Kesenian Sakral & Tradisi Hidup (`/cultures` & `/cultures/:slug`):** Penjelasan mendalam seni vokal zikir komunal Dzikir Saman Pringgasela beserta prosedur ritual dan nilai spiritualnya.
- **Linimasa Sejarah Desa (`/history`):** Eksplorasi kronologis babak era peradaban desa.
- **Profil Museum & Geografis (`/about`):** Visi-misi, koordinat desa, dan tata kelola adat.

### 2. Panel Admin CMS Terkelola
- **Keamanan Berbasis Peran (RBAC):** Super Admin (Kepala Desa), Admin Desa (Aparatur/Kurator), dan Admin KKN (Mahasiswa Pengabdi).
- **Alur Kerja Kurasi Ketat:** Entri data lapangan disimpan sebagai `draft` sebelum diverifikasi menjadi `reviewed` dan disahkan menjadi `published`.
- **Pengunggah Media Terpusat:** Pengunggahan foto/dokumen berkapasitas hingga 50 MB dengan validasi tipe berkas dan pemantauan bilah progres ke Appwrite Storage.
- **Protokol Transisi KKN:** Pedoman serah terima digital antar-periode mahasiswa KKN demi menjamin integritas data berkelanjutan.

---

## 🔒 Arsitektur Keamanan Bebas-Rahasia (*Zero-Secret Architecture*)

Frontend tidak pernah menyimpan atau memuat *Server API Key* atau kredensial rahasia apa pun:
- Pengunjung umum membaca data terbitan melalui **Appwrite Function** terisolasi (`museum-public-api`).
- Administrator masuk menggunakan sesi akun Appwrite resmi (`account.createEmailPasswordSession`) dengan otorisasi berbasis tim (`museum-admins`).
- Berkas media dilindungi oleh *File-Level Security* pada *bucket* `museum-media`.

---

## 🛠️ Tumpukan Teknologi

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router v6.
- **Backend:** Appwrite Cloud (Wilayah: Singapore / `sgp`).
  - **TablesDB:** Database `museum_digital` (17 Tabel Terverifikasi).
  - **Storage:** Bucket `museum-media` (Keamanan berkas aktif, kapasitas maks 50 MB/file).
  - **Authentication & Teams:** Appwrite Auth & Team RBAC (`museum-admins`).
  - **Functions:** Node.js 18 Function Gateway (`museum-public-api`).

---

## 🚀 Memulai Proyek (*Getting Started*)

### Prasyarat
- Node.js versi 18 ke atas (disarankan Node.js v20+)
- npm / pnpm / yarn

### Instalasi & Menjalankan Mode Pengembangan
```bash
# 1. Kloning repositori
git clone https://github.com/abhyy333/museum-digital-pringgasela-selatan.git
cd museum-digital-pringgasela-selatan

# 2. Instalasi dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```

### Membangun Bundel Produksi & Pratinjau
```bash
# Bangun bundel teroptimasi
npm run build

# Jalankan server pratinjau lokal
npm run preview
```

---

## 📚 Dokumentasi Teknis

Dokumentasi arsitektur dan pedoman sistem tersedia lengkap pada direktori proyek:
- [`FRONTEND_ARCHITECTURE.md`](./FRONTEND_ARCHITECTURE.md) — Arsitektur sistem frontend, modularitas, dan diagram aliran data.
- [`UI_DESIGN_SYSTEM.md`](./UI_DESIGN_SYSTEM.md) — Filosofi estetika museum kontemporer, palet warna tanah lereng Rinjani, dan token desain.
- [`API_INTEGRATION.md`](./API_INTEGRATION.md) — Spesifikasi integrasi Public Content API Gateway dan Admin SDK.
- [`ADMIN_USER_GUIDE.md`](./ADMIN_USER_GUIDE.md) — Pedoman operasional kurasi untuk perangkat desa dan mahasiswa KKN.
- [`FRONTEND_TEST_REPORT.md`](./FRONTEND_TEST_REPORT.md) — Laporan pengujian 18 kasus uji mutu, keamanan, dan kinerja (100% PASS).
- [`PHASE_4_IMPLEMENTATION_REPORT.md`](./PHASE_4_IMPLEMENTATION_REPORT.md) — Laporan komprehensif implementasi Tahap 4.

---

## 👥 Pengelola & Tim Pengembang

- **Pemerintah Desa Pringgasela Selatan**, Kec. Pringgasela, Kab. Lombok Timur, NTB.
- **Tim Mahasiswa Kuliah Kerja Nyata (KKN)** & Pendamping Budaya.
- **Lead Architect & Developer:** Antigravity AI Assistant & Engineering Team.
