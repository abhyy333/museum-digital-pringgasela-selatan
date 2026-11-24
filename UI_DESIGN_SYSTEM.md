# Sistem Desain Antarmuka (UI Design System)
## Museum Digital Pringgasela Selatan
**Panduan Visual & Standar Komponen Kuratorial**

---

### 1. Filosofi Visual & Arah Artistik

Museum Digital Pringgasela Selatan mengusung estetika **Museum Budaya Kontemporer (*Contemporary Cultural Museum Aesthetic*)**. Desain ini dirancang secara khusus untuk memancarkan aura martabat, keagungan tradisi, dan kehangatan alam lereng Gunung Rinjani.

#### Prinsip Estetika Utama:
- **Bebas dari Klise "Tech / Neon":** Menghindari warna ungu neon, biru korporat dingin, gradien mencolok, atau estetika generik kecerdasan buatan.
- **Kedekatan Material Tradisional (*Tactile Earthiness*):** Mengambil inspirasi langsung dari serat kapas pintal tangan, pewarna alami tarum (indigo) dan kulit mahoni, kayu gedogan, serta anyaman bambu rumah adat Sasak.
- **Tipografi Berbobot Literer (*Editorial Typography*):** Perpaduan antara tajuk serif yang agung dengan teks isi sans-serif modern yang mudah dibaca (*high-legibility*).
- **Ruang Bernapas & Tata Letak Lapang (*Generous Whitespace*):** Menempatkan foto motif tenun dan warisan budaya sebagai subjek utama dengan penghormatan ruang layaknya pameran museum berkelas dunia.

---

### 2. Palet Warna Resmi (*Color Palette & Tokens*)

| Token Sistem | Nilai Hex | Peran Semantik & Representasi Budaya |
| :--- | :--- | :--- |
| `background` | `#F8F6F1` | Latar belakang utama (kertas serat kapas alami & kapur dinding adat) |
| `surface` | `#FFFFFF` | Permukaan kartu, panel kuratorial, dan formulir |
| `primary` | `#79543B` | Cokelat tanah lereng Rinjani & kayu jati gedogan (Aksi utama, tombol, navigasi aktif) |
| `secondary` | `#A47752` | Cokelat terakota muda & rebusan getah mahoni (Sub-judul, garis batas aktif, aksen sekunder) |
| `accent` | `#B86B4B` | Merah bata gerabah Sasak (Pemberian penekanan, sorotan motif istimewa, status) |
| `text` | `#292722` | Arang hitam kelabu tua alami (Teks utama dengan rasio kontras 11.2:1 terhadap latar) |
| `muted` | `#6E675F` | Abu-abu batu kali alami (Teks keterangan pendukung, metadata, takarir foto) |
| `border` | `#E8E2D8` | Garis pembatas warna pasir tenun halus |
| `sand-50` | `#FAF8F5` | Latar selang-seling tabel & panel catatan kurasi |
| `sand-100` | `#F4EFEA` | Latar wadah media & status draf |
| `sand-200` | `#E9DFD5` | Pembatas tegas pada elemen dialog modal |

---

### 3. Sistem Tipografi (*Typography Scale*)

Sistem menggunakan font serif terkemuka untuk tajuk budaya dan sans-serif geometris untuk teks teknis dan data:

- **Display & Headings:** `font-serif` (Playfair Display / Cormorant Garamond / Georgia)
  - `Display / Hero Title`: 40px – 56px (2.5rem – 3.5rem), `leading-tight`, `font-bold`
  - `H1 / Page Title`: 32px – 40px (2.0rem – 2.5rem), `font-bold`
  - `H2 / Section Title`: 24px – 30px (1.5rem – 1.875rem), `font-bold`
  - `H3 / Card Title`: 18px – 20px (1.125rem – 1.25rem), `font-semibold`
- **Body & Controls:** `font-sans` (Plus Jakarta Sans / Inter / system-ui)
  - `Body Large`: 16px (1.0rem), `leading-relaxed` (Teks narasi filosofi dan kajian budaya)
  - `Body Regular`: 14px (0.875rem), `leading-normal` (Antarmuka admin, tombol, label formulir)
  - `Caption / Meta`: 12px (0.75rem), `tracking-wide` (Badge, tanggal arsip, takarir foto)
- **Monospace:** `font-mono` (JetBrains Mono / monospace)
  - Digunakan khusus untuk kode registrasi katalog tenun (contoh: `SBN-01`, `KTP-02`).

---

### 4. Katalog Komponen Kuratorial

#### A. Tombol (*Buttons*)
- **Tombol Utama (`btn-primary`):** Latar `#79543B`, teks putih, sudut melengkung `rounded-xl`, bayangan halus `shadow-xs`, transisi interaktif `hover:bg-[#63442F]`.
- **Tombol Sekunder (`btn-secondary`):** Latar transparan dengan batas `border border-border`, teks `#292722`, `hover:bg-sand-100`.
- **Tombol Aksen (`btn-accent`):** Latar `#B86B4B`, teks putih untuk penandaan penting seperti tombol alih bahasa atau aksi darurat.

#### B. Kartu Budaya (*Cultural Cards*)
- **Kartu Motif Tenun (`MotifCard`):** 
  - Rasio gambar 4:3 dengan efek zoom halus pada interaksi kursor (*hover scale*).
  - Badge kategori dan status unggulan (*featured*).
  - Kode motif monospaced di sudut atas.
  - Nama motif dalam tipografi serif dan cuplikan filosofi satu kalimat.
  - Tautan langsung menuju halaman detail dokumentasi.

#### C. Lencana Status (*Badges*)
- **Published:** Latar hijau sage muda `bg-emerald-50 text-emerald-800 border-emerald-200`.
- **Draft:** Latar kuning gandum `bg-amber-50 text-amber-800 border-amber-200`.
- **Archived:** Latar abu-abu netral `bg-gray-100 text-gray-700 border-gray-200`.
- **Featured:** Latar merah bata `bg-[#B86B4B]/10 text-[#B86B4B] border-[#B86B4B]/30`.

#### D. Pengunggah Berkas Multimedia (`MediaUploader`)
- Area seret-dan-lepas (*drag-and-drop*) dengan indikasi visual batas putus-putus.
- Validasi tipe MIME klien (JPEG, PNG, WebP, SVG, PDF).
- Batas ukuran berkas 50 MB dengan peringatan langsung jika melampaui kapasitas.
- Indikator bilah progres persentase (*progress bar*) selama proses pengunggahan ke Appwrite Storage.

---

### 5. Pedoman Responsivitas & Aksesibilitas (WCAG 2.1 AA)

- **Kisi Tata Letak Responsif:**
  - Ponsel Pintar (< 640px): 1 kolom dengan menu bilah navigasi ringkas (*mobile drawer*).
  - Tablet (640px – 1024px): 2 kolom untuk kartu katalog kriya dan motif.
  - Komputer Meja (> 1024px): 3 hingga 4 kolom untuk katalog etalase, serta tata letak 12-kolom (7 kolom visual : 5 kolom kuratorial) pada halaman detail motif.
- **Rasio Kontras Warna:**
  - Teks utama `#292722` di atas `#F8F6F1`: Kontras **11.2:1** (Melampaui syarat minimum WCAG AA 4.5:1).
  - Teks tombol putih di atas `#79543B`: Kontras **5.1:1** (Lolos standar AA).
- **Aksesibilitas Navigasi:** Seluruh elemen interaktif memiliki fokus keyboard (*focus-visible ring*), target sentuh minimum 44×44 piksel pada perangkat layar sentuh, dan atribut ARIA semantik.
