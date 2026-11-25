# Pedoman Konten & Kurasi Budaya Museum Digital Pringgasela Selatan
## (Museum Content Guideline)

---

### 1. Prinsip Dasar Dokumentasi Budaya

1. **Keotentikan & Kejujuran Ilmiah:** Seluruh narasi motif, filosofi, teknik tenun, riwayat tokoh, dan sejarah desa wajib bersumber dari wawancara langsung dengan maestro penenun, tokoh adat (*keliang* / pemuka masyarakat), pembatik, pelaku Dzikir Saman, atau dokumen arsip resmi Desa Pringgasela Selatan.
2. **Dilarang Mengarang Konten:** Jika informasi sejarah atau makna filosofis suatu sub-bagian belum terkonfirmasi oleh narasumber setempat, biarkan status entri pada **`draft`** atau **`in_review`** dan catat kekurangan sumber di catatan lapangan hingga diverifikasi.
3. **Pelestarian Istilah Asli Sasak:** Istilah tradisional tidak diterjemahkan secara harfiah yang mengaburkan makna. Cantumkan istilah asli dalam tanda miring diikuti penjelasan ringkas:
   - *Gedogan* / *Cag-cag* (alat tenun ikat pinggang tradisional).
   - *Sungkit* (teknik penyisipan benang pakan hias ekstra).
   - *Tarum* / indigo alami, kulit kayu mahoni, kunyit.
   - *Subahnale* (motif tenun sakral bernuansa tasbih *Subhanallah*).
   - *Dzikir Saman* (kesenian vokal zikir gerak komunal).
   - *Batik Sasambo* (kreasi batik khas Sasak–Samawa–Mbojo).

---

### 2. Standar Penulisan Dwibahasa (Indonesia & Inggris)

| Entitas | Kolom Wajib (`id`) | Kolom Pelengkap (`en`) yang Diharapkan Sebelum Rilis Penuh |
| :--- | :--- | :--- |
| **Motif Tenun** | `name`, `philosophy`, `visualDescription`, `technique`, `historicalUsage`, `originStory` (sebutkan sumber lisan) | `name`, `philosophy`, `visualDescription`, `technique`, `historicalUsage`, `originStory` |
| **Kriya & Batik** | `title`, `summary`, `description`, `technique`, `materials`, `culturalMeaning` | `title`, `summary`, `description`, `technique`, `materials`, `culturalMeaning` |
| **Tradisi Budaya** | `title`, `summary`, `description` (sertakan lokasi dusun & sumber informasi), `ritualProcedure`, `spiritualValue` | `title`, `summary`, `description`, `ritualProcedure`, `spiritualValue` |
| **Sejarah Desa** | `eraTitle`, `narrative` (cantumkan sumber sejarah/tutur), `keyFigures`, `legacyToday` | `eraTitle`, `narrative`, `keyFigures`, `legacyToday` |

---

### 3. Standar Fotografi, Video & Rekaman Audio Lapangan

1. **Format & Batas Teknis Bucket (`museum-media`):**
   - **Gambar:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg`, `.tif`, `.tiff`. Gunakan bidang datar penuh (*flat-lay* tegak lurus) untuk foto utama (`#1`) dan foto makro detail benang/alat tenun untuk foto ke-2 dst.
   - **Video:** `.mp4`, `.webm` (rekaman proses menenun, membatik, atau tradisi gerak dalam kondisi pencahayaan alami tanpa musik latar berhak cipta).
   - **Audio:** `.mp3`, `.wav`, `.aac`, `.ogg` (rekaman *Dzikir Saman* atau wawancara lisan jernih tanpa kebisingan berlebih). Tandai kotak centang **"Audio Zikir/Lantunan"** pada entri Budaya agar pemutar audio tampil khusus di halaman publik.
   - **Dokumen Riset:** `.pdf`, `.zip` (transkrip wawancara mentah atau catatan KKN). **Wajib disetel sebagai Privat (Hanya Tim Kurator)** jika berisi catatan sensitif atau mentah.
   - **Batas ukuran per berkas:** Maksimal **`50.000.000` bytes (~47,6 MiB)**.

2. **Aturan Privasi & Persetujuan Narasumber (*Informed Consent*):**
   - Setiap unggahan bertanda **Publik** di CMS mewajibkan pencentangan persetujuan bahwa subjek (penenun/narasumber) dan pemilik hak foto mengizinkan penayangan publik.
   - Catat selalu **Nama Pengambil Foto / Dokumentator** (`photographer`) dan keterangan foto dwibahasa (`captionId` & `captionEn`).
   - Foto potret tokoh pada modul **Tokoh & Pengrajin** (`contributors.photoFileId`) hanya boleh dipasang setelah tokoh bersangkutan menyetujui pemuatan wajah dan biodatanya.
