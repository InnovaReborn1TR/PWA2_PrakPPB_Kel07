# Bore & Barrel

A dummy gunshop storefront built as a Progressive Web App. It runs offline
with an app shell, a web app manifest, and a service worker, and uses React +
Vite + Tailwind CSS.

## Setup

```bash
npm install
npm run dev      # dev server with HMR
```

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # oxlint
npm test         # unit tests
```

## Structure

```
.
├── index.html              # HTML shell
├── vite.config.js          # Vite + vite-plugin-pwa (manifest + service worker)
├── public/                 # static assets served at /
│   ├── icon-192.png / icon-512.png / icon.svg
│   └── guns/               # product images
└── src/
    ├── main.jsx            # entry, mounts <App/>
    ├── App.jsx             # app shell: tab state, header/nav/content/footer
    ├── App.css             # app shell styles
    ├── index.css           # global styles
    ├── components/
    │   ├── Header.jsx      # brand + nav
    │   ├── GunCard.jsx     # single product card
    │   ├── common/
    │   │   └── ShareButton.jsx
    │   └── Footer.jsx
    ├── data/
    │   └── guns.js         # dummy product data
    └── pages/
        ├── Catalog.jsx     # product grid
        ├── About.jsx
        └── Contact.jsx
```

## Percobaan: lazy load, cache query, share link, dan paginasi

### 1. Lazy load

Halaman katalog, favorit, profil, formulir, detail produk, About, dan Contact
diimpor dengan `React.lazy()` di `src/App.jsx`. Komponen halaman baru diunduh
dan dievaluasi saat dibuka; selama proses itu, `Suspense` menampilkan status
"Loading page…". Foto pada kartu produk juga memakai atribut HTML
`loading="lazy"` di `src/components/gun/GunCard.jsx`, sehingga browser dapat
menunda pemuatan gambar yang belum dekat dengan area layar.

Cara mencoba: buka tab Catalog, lalu pilih Favorites atau About dan perhatikan
chunk halaman yang dimuat melalui panel Network browser. Service worker PWA
dapat melakukan precache untuk mendukung offline; `React.lazy()` tetap menunda
pemuatan/evaluasi modul oleh aplikasi sampai halaman tersebut diperlukan.

### 2. Cache query

`src/utils/queryCache.js` menyimpan hasil query dalam memori selama 30 detik.
Kunci cache katalog dibuat dari parameter query (halaman, pencarian, kategori,
pengurutan, dan ukuran halaman), sehingga query yang sama dapat memakai hasil
yang tersimpan. Request yang sama dan masih berjalan juga digabung menjadi satu
request. `src/services/gunService.js` membersihkan cache setelah create, update,
atau delete agar perubahan data tidak tertutup hasil lama; tombol Retry
memaksa pengambilan data baru.

Cara mencoba: buka satu halaman katalog, pindah ke tab lain lalu kembali dalam
30 detik, atau kembali ke kombinasi filter/halaman yang sama. Query tersebut
dapat dilayani dari cache. Setelah produk diubah, query berikutnya mengambil
data baru.

### 3. Share link untuk setiap produk/kategori

Tombol Share tersedia pada setiap kartu dan halaman detail, sehingga item
Pistol, Rifle, Shotgun, maupun kategori lain yang berasal dari API dapat
dibagikan. `src/components/common/ShareButton.jsx` membuat URL dengan
parameter `?gun=<id>`, menggunakan Web Share API bila tersedia, lalu Clipboard
API; jika keduanya tidak tersedia, URL ditampilkan agar dapat disalin manual.
Saat URL dibuka, `src/App.jsx` mencari item lokal berdasarkan ID `local-N`
atau memuat item server berdasarkan ID produk. Jadi link membuka detail item,
bukan hanya halaman katalog umum.

Cara mencoba: tekan ikon Share pada kartu atau tombol Share di detail, salin
tautan, lalu buka di tab/browser baru. Tautan katalog lokal memakai ID contoh
seperti `local-0`; item API memakai ID dari server.

### 4. Paginasi

`src/pages/Catalog.jsx` menampilkan 4 item per halaman. Ketika memakai API,
`src/hooks/useGuns.js` mengirim nomor halaman, ukuran halaman, pencarian,
kategori, dan urutan ke `src/services/gunService.js`. Adapter Supabase memakai
`limit` dan `offset` (mengambil satu item tambahan untuk mengetahui apakah
halaman berikutnya ada); API REST juga meminta satu item tambahan, kecuali
metadata `hasMore` atau `total` sudah tersedia dari server. Jika katalog lokal
digunakan, pencarian/kategori/pengurutan diterapkan sebelum daftar dipotong ke
halaman yang dipilih. Mengubah filter mengembalikan tampilan ke halaman
pertama.

Cara mencoba: katalog lokal contoh berisi enam produk; gunakan Previous/Next
untuk melihat item pada halaman berikutnya. Pencarian, kategori, dan
pengurutan juga dapat dicoba sebelum berpindah halaman.
