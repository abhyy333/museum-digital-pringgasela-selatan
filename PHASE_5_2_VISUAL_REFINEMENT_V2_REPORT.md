# Laporan Refinement Visual V2 (Tahap 5.2): Tekstur Tekstil, Layering 3D & Koreksi Tata Letak
## Museum Digital Pringgasela Selatan

---

### 1. Ringkasan Audit IMAGE A vs IMAGE B

Perbandingan langsung antara kondisi implementasi sebelumnya (**IMAGE A** / `v2_before_*`) dan desain target (**IMAGE B**) mengidentifikasi 6 sumber deviasi utama yang telah diperbaiki:

1. **Tabrakan Kepala Pengrajin dengan Sticky Header (`headerGapToWeaver: -19px s/d -21px`):** Penempatan `weaver-foreground` menggunakan `sm:-bottom-1 lg:-bottom-2` tanpa kunci proporsi aspek mengakibatkan puncak sanggul pengrajin terdorong ke atas memasuki ruang header (`y = 56–58px` di bawah `headerBottom = 77px`). Diperbaiki dengan wadah *aspect-locked* `aspect-[1.64/1]` dan `pt-4 xl:pt-6`, sehingga **ruang aman antara header dan puncak kepala menjadi `+24px` pada semua desktop**.
2. **Ilusi 3D Frame Foto Arsip & Overlap Pengrajin:** Frame latar (`Layer 2/3`) sebelumnya nyaris setinggi kepala pengrajin dan memakai border tipis datar. Diperbaiki dengan meletakkan `hero-background.webp` (`2560×1600`) + `paper-frame.webp` (`2560×1600` RGBA bertepi irregular/deckled hangat) pada `top-[13%]`, sehingga **kepala, bahu, alat tenun, dan kain benar-benar keluar menembus bagian atas dan kiri frame** sambil dipadukan lapisan kain depan (`woven-fabric-foreground.webp`, `3000×1833`) serta bayangan kontak directional (`Layer 6`).
3. **Ornamen Pinggir Datar vs Serat Kain Nyata:** Pola kiri sebelumnya memakai `<svg>` wireframe geometris datar (`#leftWarpFiligree`), sementara pita kanan berupa stiker persegi panjang tajam. Kedua sisi diganti **tekstur fotografi tenun indigo teranyam bertepi benang pakan rumbai asli (RGBA alpha transparan)** (`woven-border-right.webp` & `woven-border-left.webp`) dengan mode padu `mix-blend-multiply` langsung ke atas kertas linen.
4. **Kertas Latar Arsip & Kontinuitas Permukaan:** Tekstur lama memiliki simetri pantulan tengah dan area Hero tampak polos karena gradien pencerah di atas `body`. Digantikan dengan `linen-paper-texture.webp` (`2048×2048` toroidal seamless tanpa sambungan) yang konsisten di Header, Hero, Koleksi, dan Kuratorial, serta tepi lembut kiri pada `village-landscape.webp`.
5. **Keterpotongan Koleksi di Viewport Awal `1366×768`:** Pada `1366×768`, `Header` (`65px`), penuh `Hero`, dan seluruh 4 kartu + judul `Ragam Warisan Pringgasela` kini berakhir bersih di `y = 718px` (`< 768px`) tanpa terpotong container maupun tepi layar.
6. **Stabilitas Navbar di Lebar `1024px`:** Tautan `Cerita & Tradisi` sebelumnya membungkus menjadi 3 baris di `1024px`. Diperbaiki memakai `whitespace-nowrap`, `gap-4 xl:gap-8`, dan padding adaptif (`lg:px-8 xl:px-14`).

---

### 2. Daftar Komponen & Berkas yang Diubah

| Berkas | Ringkasan Perubahan |
| :--- | :--- |
| [ArchiveHeroSection.tsx](file:///home/aby/Antigravity_Project/src/components/hero/ArchiveHeroSection.tsx) | Rekonstruksi komposisi 6 lapis 3D (`hero-background`, `paper-frame`, `weaver-foreground` 3000px, `woven-fabric-foreground`, `Layer 6` bayangan kontak/directional), *aspect-locked stage*, tipografi fluida `clamp(32px, 3.25vw, 52px)`, dan clearance kepala `+24px` dari header. |
| [HomePage.tsx](file:///home/aby/Antigravity_Project/src/pages/public/HomePage.tsx) | Penggantian seluruh motif SVG pinggir dengan pita tenun kain indigo transparan ber-rumbai (`woven-border-left.webp`, `woven-border-right.webp`, variasi skala atas/bawah, serta strip sempit bebas overflow di mobile), kalibrasi ritme Koleksi Unggulan agar utuh pada `1366×768`, serta kalibrasi jarak Kuratorial. |
| [Navbar.tsx](file:///home/aby/Antigravity_Project/src/components/common/Navbar.tsx) | Penyesuaian tinggi header `h-[60px] lg:h-[64px]`, jarak tautan responsif `gap-4 xl:gap-8`, dan `whitespace-nowrap` untuk menjaga kelurusan satu baris dari `1024px` hingga desktop lebar. |
| [index.css](file:///home/aby/Antigravity_Project/src/index.css) | Penerapan `linen-paper-texture.webp` seragam pada `body` dan `.surface-*`, penghapusan lapisan gradien pemucat Hero, dan penambahan *feathered alpha mask* tepi kiri `.landscape-organic-crop` untuk lanskap kuratorial. |

---

### 3. Inventaris Aset Gambar & Resolusi Aktual

| Berkas Aset | Resolusi | Format & Kanal | Peran |
| :--- | :---: | :---: | :--- |
| `public/images/hero/weaver-foreground.webp` & `.png` | **3000 × 1833** | WebP / PNG RGBA (transparan) | Master *cutout* pengrajin & alat tenun *gedogan* (*placeholder kuratorial terkurasi*) |
| `public/images/hero/woven-fabric-foreground.webp` | **3000 × 1833** | WebP RGBA (transparan) | Lapisan kain tenun indigo menjulur ke kiri bawah (*Layer 5*) |
| `public/images/hero/hero-background.webp` & `weaver-background.webp` | **2560 × 1600** | WebP | Foto latar sepia rumah tenun Sasak (*Layer 2*) |
| `public/images/hero/paper-frame.webp` | **2560 × 1600** | WebP RGBA (transparan) | Bingkai kertas arsip krem bertepi *deckled* organik (*Layer 3*) |
| `public/images/patterns/linen-paper-texture.webp` (& `textures/paper-texture.webp`) | **2048 × 2048** | WebP *seamless tile* | Tekstur kertas kapas-linen arsip bebas lipatan cermin |
| `public/images/patterns/woven-border-right.webp` (& `indigo-woven-texture.webp`, `textures/indigo-textile.webp`) | **499 × 1376** | WebP RGBA (transparan) | Tekstur pita kain tenun indigo ber-rumbai benang pakan sisi kanan |
| `public/images/patterns/woven-border-left.webp` | **238 × 1376** | WebP RGBA (transparan) | Selvedge tenun indigo pudar berserat sisi kiri & aksen kanan bawah |
| `public/images/editorial/village-landscape.webp` | **2000 × 1200** | WebP | Foto lanskap lembah pedesaan untuk blok Kuratorial |
| `public/images/collections/{motif-tenun,alat-tenun,pewarna-alami,arsitektur-desa}.webp` | **1600 × 1000** | WebP | 4 gambar berbeda kategori koleksi museum |

---

### 4. Hasil Build & Visual Regression Across 8 Viewports (Putaran 1 -> 2 -> 3)

* **Build Produksi:** `npx tsc -b && npm run build` sukses dalam `5.74s` (`0` TypeScript/bundler error).
* **Putaran Perbaikan:**
  * **Putaran 1:** Memperbaiki tabrakan header `-21px` -> `+28px`, membangun aset frame kertas 3D + hero 3000px + tekstur kertas linen seamless, membuat seluruh 4 koleksi tampak utuh di `1366×768`.
  * **Putaran 2:** Memperbaiki posisi motif tenun kanan agar motif belah ketupat tampil penuh bersama benang rumbai, menghilangkan artefak kotak bayangan miring di kiri bawah kain dengan blur terkurung aman, menyempurnakan *mask* lembut foto lanskap kuratorial, serta menambahkan aksen motif ringkas non-overflow di mobile.
  * **Putaran 3:** Mengatasi pembungkusan 3 baris menu Navbar pada lebar `1024px` (`whitespace-nowrap`), menyatukan substrat tekstur kertas linen pada Hero dengan Header, serta merapikan keseimbangan tinggi blok Kuratorial di `1536×1024`.

| Resolusi | `overflowX` | `headerBottom` | `weaverTop` (Jarak Header) | `colCardsBottom` | `brokenCount` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1536 × 1024** | `false` | `65px` | `89px` (`+24px`) | `728px` | `0` |
| **1440 × 900** | `false` | `65px` | `89px` (`+24px`) | `728px` | `0` |
| **1366 × 768** | `false` | `65px` | `89px` (`+24px`) | `718px` | `0` |
| **1280 × 800** | `false` | `65px` | `89px` (`+24px`) | `697px` | `0` |
| **1024 × 768** | `false` | `65px` | `85px` (`+20px`) | `577px` | `0` |
| **768 × 1024** | `false` | `61px` | `378px` (`+317px`) | `1467px` | `0` |
| **390 × 844** | `false` | `61px` | `363px` (`+302px`) | `1776px` | `0` |
| **360 × 800** | `false` | `61px` | `418px` (`+357px`) | `1736px` | `0` |

* **Console / Runtime Error:** `0` (`CONSOLE_ERRORS: 0`, `PAGE_ERRORS: 0`).
* **Integrasi Sistem & Keamanan:** Drawer mobile (`390×844`), switch bahasa `ID | EN`, rute `/motifs`, `/crafts`, `/cultures`, `/curatorial`, `/about`, `/admin/login`, gateway `museum-admin-media` v2.0.0 (`/health: 200`), `museum-public-api` v1.2.0 (`200`), ACL bucket `museum-media` tanpa `create`, serta pemindaian zero secret pada `src/`/`dist/` terverifikasi utuh.

---

### 5. Catatan & Masalah yang Masih Tersisa

1. **Deployment ke Production Vercel:** Seluruh perbaikan telah lolos pada build lokal (`vite build` & `vite preview`), namun belum dipush ke GitHub / di-redeploy ke URL Vercel `museum-digital-pringgasela-selatan.vercel.app`.
2. **Aset Fotografi Dokumentasi Masyarakat:** Aset Hero, lanskap, dan empat kategori saat ini menggunakan aset visual kuratorial internal resolusi tinggi hingga foto asli berizin milik penenun Desa Pringgasela Selatan diunggah melalui CMS terotorisasi (`museum-admin-media`).
3. **Batas Bawah Kuratorial pada Laptop `1366×768`:** Pada resolusi vertikal `768px`, `Header + Hero + full Koleksi Unggulan` mengisi viewport awal dengan bersih, sementara bagian *Kuratorial & Jelajah Museum* berada tepat di bawah fold (`curHeadingTop: 804px`) dan diakses mulus melalui scroll normal.
