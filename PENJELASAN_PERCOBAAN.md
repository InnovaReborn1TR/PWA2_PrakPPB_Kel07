# Penjelasan Percobaan

Dokumen ini menjelaskan implementasi **lazy load**, **query caching**,
**share link**, dan **paginasi** pada aplikasi Bore & Barrel.

## 1. Lazy Load

Lazy load digunakan agar semua halaman tidak dimuat sekaligus saat aplikasi
pertama kali dibuka.

- Halaman seperti Catalog, Favorites, Profile, About, Contact, dan halaman
  detail diimpor menggunakan `React.lazy()`.
- `Suspense` menampilkan teks **Loading page…** selama modul sedang dimuat.
- Gambar pada kartu katalog menggunakan `loading="lazy"` sehingga gambar yang
  belum terlihat dapat ditunda pemuatannya oleh browser.

**Cara mencoba:** buka aplikasi, lalu pindah ke tab Favorites atau About.
Pada panel Network browser, halaman tersebut akan dimuat ketika dibutuhkan.

## 2. Query Caching

Query caching menyimpan hasil permintaan katalog sementara di memori.

- Query yang sama dapat menggunakan hasil cache selama 30 detik.
- Permintaan yang sama dan masih berjalan digabung menjadi satu request.
- Cache dibedakan berdasarkan halaman, pencarian, kategori, pengurutan, dan
  ukuran halaman.
- Setelah produk dibuat, diubah, atau dihapus, cache dibersihkan agar data
  berikutnya tetap terbaru.
- Tombol Retry memaksa pengambilan data baru.

**Manfaat:** perpindahan kembali ke query yang sama menjadi lebih cepat dan
request API yang tidak perlu dapat dikurangi.

## 3. Share Link untuk Setiap Katalog

Setiap kartu produk dan halaman detail memiliki tombol **Share**.

1. Aplikasi membuat URL dengan parameter ID produk, misalnya
   `?gun=local-0`.
2. Jika tersedia, aplikasi menggunakan Web Share API.
3. Jika tidak tersedia, URL disalin menggunakan Clipboard API.
4. Jika Clipboard API juga tidak tersedia, URL ditampilkan agar dapat disalin
   secara manual.
5. Saat URL dibuka, aplikasi membaca ID tersebut dan langsung menampilkan
   detail produk yang sesuai.

Fitur ini berlaku untuk semua kategori katalog, seperti Pistol, Rifle,
Shotgun, maupun produk lain yang berasal dari API.

**Cara mencoba:** tekan tombol Share pada kartu produk, salin link yang
dihasilkan, kemudian buka link tersebut di tab baru.

## 4. Paginasi

Paginasi membatasi jumlah produk yang ditampilkan dalam satu halaman menjadi
empat item.

- Tombol **Previous** digunakan untuk kembali ke halaman sebelumnya.
- Tombol **Next** digunakan untuk membuka halaman berikutnya.
- Saat filter pencarian, kategori, atau pengurutan berubah, halaman kembali
  ke halaman pertama.
- Untuk API, halaman dikirim menggunakan parameter `page` dan `limit`.
- Untuk Supabase, data diambil menggunakan `limit` dan `offset`.
- Jika server tidak tersedia, katalog lokal tetap dapat dipaginasi di sisi
  klien.

**Cara mencoba:** gunakan katalog lokal atau matikan koneksi API, lalu tekan
**Next** untuk melihat produk pada halaman kedua.

## Verifikasi

Perintah berikut digunakan untuk memeriksa implementasi:

```bash
npm test
npm run lint
npm run build
```

Pengujian unit mencakup cache query, pembuatan share link, dan pemotongan data
berdasarkan halaman.
