# Catatan Setup & Deploy — Eiko Visual

Catatan ini berisi cara kerja deploy website Eiko Visual (`eikovisual.com`), setting `.htaccess` di cPanel DomaiNesia, cara pakai Pages CMS, dan cara mengembalikan website ke WordPress kalau dibutuhkan.

---

## 1. Cara Kerja Deploy

1. **Tambah atau edit konten lewat Pages CMS**
   - Buka [app.pagescms.org](https://app.pagescms.org), login pakai GitHub, lalu tambah atau edit **Blog** / **Project**.
   - Saat klik **Save**, Pages CMS langsung menyimpan file `.md` dan gambar ke repo GitHub.
2. **Build & upload otomatis lewat GitHub Actions**
   - Setiap ada perubahan di branch `master` atau `main`, GitHub Actions (`.github/workflows/deploy.yml`) otomatis jalan:
     1. Install package (`npm ci`).
     2. Jalankan `npm run optimize-media` untuk mengubah gambar `.jpg`/`.png` baru di folder blog & projects menjadi `.webp`, menghapus file aslinya, dan mengubah link gambarnya di file `.md`.
     3. Simpan hasil `.webp` dan `.md` yang sudah diubah balik ke GitHub (pakai `[skip ci]` biar tidak build ulang dua kali).
     4. Jalankan `npm run build` untuk membuat file website di folder `dist/`.
     5. Kirim isi folder `dist/` ke cPanel lewat SSH `rsync` (port `64000`) ke folder `~/public_html/astro_dist/dist/`.
3. **Tampil di cPanel DomaiNesia**
   - File `/public_html/.htaccess` mengarahkan pengunjung `eikovisual.com` ke folder `/public_html/astro_dist/dist/`.
   - File WordPress lama di `/public_html/` tidak dihapus dan tidak tertimpa.

---

## 2. File Penting di Project

| File | Kegunaan |
|---|---|
| `.pages.yml` | Pengaturan form Blog (`src/content/blog`) dan Projects (`src/content/projects`) di Pages CMS. Upload gambar blog masuk ke `public/assets/blog`, gambar project masuk ke `public/assets/projects`. |
| `.github/workflows/deploy.yml` | Script GitHub Actions untuk convert gambar, build Astro, dan upload `dist/` ke cPanel via SSH. |
| `scripts/optimize-media.mjs` | Script convert gambar `.jpg`, `.jpeg`, `.png`, `.tif`, `.bmp` ke `.webp` (`quality: 80`, max lebar `1200px` untuk blog dan `1400px` untuk project) sekaligus update path di file `.md`. |
| `src/content.config.ts` | Validasi isi frontmatter `.md` untuk Blog dan Projects. Sudah disesuaikan supaya format tanggal & field kosong dari Pages CMS tidak bikin error build. |
| `astro.config.mjs` | Setting utama Astro (`inlineStylesheets`, sitemap, dan `allowedHosts` untuk preview lokal pakai Pinggy). |

---

## 3. Setting SSH & GitHub Secrets

### Di cPanel DomaiNesia
1. Masuk ke **SSH Access** → **Manage SSH Keys**.
2. Pastikan status Public Key yang dipakai sudah **`authorized`** (*Manage → Authorize*).
3. Port SSH DomaiNesia: **`64000`**.
4. Folder tujuan deploy: **`~/public_html/astro_dist/dist/`**.

### Di GitHub (`Settings → Secrets and variables → Actions`)

| Nama Secret | Isi |
|---|---|
| `SSH_HOST` | `202.155.137.48` |
| `SSH_PORT` | `64000` |
| `SSH_USER` | Username login cPanel |
| `SSH_PRIVATE_KEY` | Isi lengkap Private Key SSH (dari `-----BEGIN ...` sampai `-----END ...`) |
| `SSH_PASSPHRASE` | Password key SSH *(isi kalau waktu generate key di cPanel pakai password; kalau tanpa password, tidak perlu)* |

> Saat upload, `rsync` sudah memakai `--exclude` untuk `.well-known/`, `cgi-bin/`, dan `.htaccess` supaya SSL dan setting cPanel tidak ikut terhapus.

---

## 4. Setting `.htaccess` di `/public_html/.htaccess`

Taruh kode ini di **paling atas** file `/public_html/.htaccess` (tepat di atas `# BEGIN LSCACHE` / `# BEGIN WordPress`):

```apache
DirectoryIndex index.html index.php

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# 1. Biarkan halaman admin & file WordPress tetap bisa dibuka
RewriteCond %{REQUEST_URI} ^/(wp-admin|wp-login\.php|wp-content|wp-includes|sapp-wp-signon\.php) [NC]
RewriteRule ^ - [L]

# 2. Arahkan halaman utama eikovisual.com ke homepage Astro
RewriteCond %{HTTP_HOST} ^(www\.)?eikovisual\.com$ [NC]
RewriteCond %{REQUEST_URI} !^/astro_dist/dist/
RewriteRule ^$ /astro_dist/dist/index.html [L]

# 3. Arahkan halaman Astro lain (misal /tentang-kami/ atau /blogs/)
RewriteCond %{HTTP_HOST} ^(www\.)?eikovisual\.com$ [NC]
RewriteCond %{REQUEST_URI} !^/astro_dist/dist/
RewriteCond %{DOCUMENT_ROOT}/astro_dist/dist/$1/index.html -f
RewriteRule ^(.+?)/?$ /astro_dist/dist/$1/index.html [L]

# 4. Arahkan file statis Astro (gambar, PDF, sitemap, dll)
RewriteCond %{HTTP_HOST} ^(www\.)?eikovisual\.com$ [NC]
RewriteCond %{REQUEST_URI} !^/astro_dist/dist/
RewriteCond %{DOCUMENT_ROOT}/astro_dist/dist/$1 -f
RewriteRule ^(.+)$ /astro_dist/dist/$1 [L]
</IfModule>
```

> Jangan tulis `DirectoryIndex /astro_dist/dist/index.html` karena akan membuat semua URL lain ikut membuka homepage.

---

## 5. Cara Tambah / Edit Blog & Project

1. Buka [app.pagescms.org](https://app.pagescms.org) dan login pakai GitHub.
2. Pilih **Blog & Artikel** atau **Portfolio Projects**.
3. Isi judul, gambar, dan konten seperti biasa, lalu klik **Save**.
4. Tunggu sekitar 1–2 menit sampai GitHub Actions selesai build dan upload ke cPanel.
5. Refresh halaman website (`Cmd + Shift + R` kalau masih nyangkut cache).

---

## 6. Cara Balik ke WordPress Lagi

Karena file WordPress lama masih utuh di `/public_html/`, cara mengembalikannya cukup 2 langkah:

1. Buka `/public_html/.htaccess` di File Manager cPanel, lalu **hapus blok kode Astro** di bagian paling atas (dari `DirectoryIndex index.html index.php` sampai `</IfModule>` sebelum `# BEGIN LSCACHE`). Simpan file.
2. Bersihkan cache di **LiteSpeed Cache** (Purge All) lalu cek di browser Incognito.
3. *(Opsional)* Hapus folder `/public_html/astro_dist/` kalau sudah tidak dipakai, dan matikan workflow di tab **Actions** GitHub biar tidak upload lagi.

---

## 7. Kalau Ada Masalah

- **Halaman masih tampil versi lama setelah deploy:** Tunggu sekitar 30 detik lalu Hard Refresh (`Cmd + Shift + R`) atau buka di Incognito.
- **Build gagal di GitHub Actions karena error isi `.md`:** Buka log error di tab **Actions** untuk lihat field wajib apa yang belum diisi di Pages CMS.
- **Gagal konek SSH (`Permission denied`):** Cek lagi apakah Public Key di cPanel sudah `authorized` dan `SSH_PRIVATE_KEY` / `SSH_PASSPHRASE` di GitHub Secrets sudah benar.
- **Kalau repo pindah organization atau ganti nama:** Update remote lokal dengan `git remote set-url origin <URL_REPO_BARU>`, lalu buka ulang akses **Pages CMS** ke repo/organization barunya.
- **Coba convert gambar & build di laptop:**
  ```bash
  npm run optimize-media
  npm run build
  ```
