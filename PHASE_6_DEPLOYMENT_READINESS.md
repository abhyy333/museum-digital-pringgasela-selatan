# Laporan Kesiapan Deployment & Go/No-Go (Phase 6)
## Museum Digital Pringgasela Selatan

**Tanggal:** 27 November 2026  
**Target Phase 6:** Persiapan Vercel Preview & Keputusan Kesiapan Controlled Pilot vs Production Launch

---

### 1. Status Build & Environment Configuration

- **Build Output (`npx tsc -b && vite build`):** Lulus tanpa error (`0` TS errors, bundle `dist/` dibangun dalam `8.29s`).
- **Source Maps:** Dinonaktifkan eksplisit (`build.sourcemap: false` pada [vite.config.ts](file:///home/aby/Antigravity_Project/vite.config.ts)) — `0` file `.map` di `dist/`.
- **Environment Variables:** [config.ts](file:///home/aby/Antigravity_Project/src/appwrite/config.ts) membaca variabel publik `VITE_APPWRITE_*` dan `VITE_SITE_URL` dengan fallback aman; templat didokumentasikan di [`.env.example`](file:///home/aby/Antigravity_Project/.env.example).
- **Audit Rahasia:** `0` Appwrite API Key, `0` `UPLOAD_SESSION_SECRET`, dan `0` kredensial hardcoded di `src/` maupun `dist/` (blok *Quick-Fill Presets* telah dihapus dari [AdminLoginPage.tsx](file:///home/aby/Antigravity_Project/src/pages/admin/AdminLoginPage.tsx)).
- **SPA Routing:** [vercel.json](file:///home/aby/Antigravity_Project/vercel.json) mengonfigurasi rewrite `/(.*) -> /index.html` sehingga rute langsung (`/motifs/:slug`, `/admin/media`, dll.) tidak terkena `404` pada refresh halaman.

---

### 2. Status Vercel Preview & Appwrite CORS Platforms

- **Vercel CLI Status di Lingkungan Lokal:** `Vercel CLI 65.16.0` terpasang, namun sesi terautentikasi sedang **Logged out** dan deployment anonim CLI telah kedaluwarsa (`Error: Your temporary deployment has expired. Run vercel login...`; selain itu mode `--temporary` tanpa login tidak mendukung `--environment preview`). **Oleh karena itu, belum ada URL `*.vercel.app` baru yang dideploy otomatis tanpa otorisasi akun Vercel Anda.**
- **Kesiapan CORS Appwrite Cloud (Terverifikasi):** Pemeriksaan `appwrite project list-platforms` mengonfirmasi dua platform Web telah aktif pada proyek `6affdaa0003c416ecdb0`:
  1. `localhost` (`6affdaa1001c1cfd19c4`) — digunakan untuk verifikasi preview lokal `http://localhost:4173` yang lolos 6/6 E2E Chrome.
  2. `*.vercel.app` (`vercel_wildcard_preview`) — sudah terdaftar sehingga setiap Preview URL Vercel (`https://<branch-preview>.vercel.app`) akan langsung diizinkan melakukan autentikasi Appwrite & pratinjau media privat tanpa kendala CORS.
- **Pratinjau Lokal Sementara yang Diverifikasi:** Server `vite preview` lokal berjalan di `http://localhost:4173` (terverifikasi full 6/6 Chrome E2E dengan Appwrite Cloud). *Tunnel Cloudflare lokal juga tersedia pada sesi kerja, namun domain `.trycloudflare.com` sengaja tidak didaftarkan ke CORS Appwrite.*

**Cara Menerbitkan Vercel Preview (Non-Production) dalam 1 Perintah:**
```bash
npx vercel login
npx vercel        # Tanpa --prod (otomatis menghasilkan URL Preview)
```

---

### 3. Status SEO & Kelayakan Pengindeksan

- **Yang Sudah Terpasang:**
  - `title`, `meta description`, `link rel="canonical"`, `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, serta `twitter:card`, `twitter:title`, `twitter:description` di [index.html](file:///home/aby/Antigravity_Project/index.html).
  - Judul halaman dinamis (`document.title`) di seluruh rute publik dan `<meta name="robots" content="noindex, nofollow">` di `/admin/*` ([i18n.ts](file:///home/aby/Antigravity_Project/src/utils/i18n.ts)).
  - `public/favicon.svg`, [public/robots.txt](file:///home/aby/Antigravity_Project/public/robots.txt) (`Disallow: /admin/`), dan [public/sitemap.xml](file:///home/aby/Antigravity_Project/public/sitemap.xml) (mencakup `/`, `/motifs`, `/crafts`, `/cultures`, `/history`, `/curatorial`, `/about`).
- **Keterbatasan Jujur:** Aplikasi ini adalah **React + Vite Single-Page Application (SPA)** tanpa SSR maupun *build-time prerendering*. Crawler yang tidak mengeksekusi JavaScript (termasuk pratinjau tautan WhatsApp/Facebook/X pada URL spesifik `/motifs/:slug`) hanya menerima HTML shell dasar `index.html`. Rekomendasi pasca-rilis awal: tambahkan Edge middleware OG meta dinamis di Vercel atau prerender rute statis bila dibutuhkan.

---

### 4. Production Blockers & Keputusan Go / No-Go

| Kategori Keputusan | Rekomendasi | Alasan Objektif |
| :--- | :---: | :--- |
| **Controlled Pilot (via Vercel Preview)** | **GO** | Seluruh alur publik (`museum-public-api v1.3.0`), CMS (`TablesDB`), upload berotoritas server (`museum-admin-media v4.0.0`), karantina (`>20 MB`/SVG/ZIP), rekonsiliasi, RBAC (`super_admin`/`admin_desa`/`admin_kkn`), dan keamanan bundle (`0` secret, `0` hardcoded credentials) terbukti lulus unit (10/10), API (12/12), dan Chrome E2E (6/6). |
| **Unconditional Production Launch** | **NO-GO (Menunggu Penyelesaian Blocker di Bawah)** | Belum layak dibuka sebagai rilis produksi penuh tanpa pengawasan sebelum langkah mandatory di bawah selesai. |

#### Blocker Wajib Sebelum Production Deployment:
1. **Terbitkan & Uji Vercel Preview oleh Staf Asli:** Lakukan `npx vercel login && npx vercel` (Preview), lalu minta akun nyata `Super Admin`, `Admin Desa`, dan `Admin KKN` melakukan pilot unggah media budaya nyata, cek rekonsiliasi, dan verifikasi kebersihan metadata.
2. **Daftarkan Domain Produksi di Appwrite Platforms:** Sebelum mengarahkan domain kustom (mis. `museum.pringgasela.desa.id`), tambahkan hostname produksi resmi ke **Appwrite Console → Settings → Platforms (Web)** agar Auth dan `/view` Storage tidak ditolak CORS browser.
3. **Tata Kelola `audit_logs` Non-Media:** Dokumentasikan secara resmi bahwa selama tabel non-media (motif, kriya, tradisi, sejarah) masih menulis `audit_logs` dari klien, hanya entri log gateway media (`via: "server-gateway"`) yang bersifat otoritatif; jadwalkan migrasi CRUD entitas ke Function gateway pada fase berikutnya.
4. **Pemisahan Environment Vercel Preview vs Production:** Atur environment variables `VITE_*` secara eksplisit di Dashboard Vercel Project Settings untuk target **Preview** dan **Production** agar konsisten dan terkontrol.
