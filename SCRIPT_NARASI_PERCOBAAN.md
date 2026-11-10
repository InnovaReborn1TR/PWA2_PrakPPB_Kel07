# Script Narasi Percobaan

## Pembukaan

Pada percobaan ini, saya menambahkan empat fitur untuk meningkatkan
performa dan kemudahan penggunaan aplikasi, yaitu lazy load, query caching,
share link, dan paginasi.

## 1. Lazy Load

Pertama adalah lazy load. Sebelumnya, seluruh halaman aplikasi dapat dimuat
sekaligus. Sekarang, halaman seperti Catalog, Favorites, Profile, About,
Contact, dan detail produk dimuat hanya ketika dibutuhkan.

Implementasinya menggunakan `React.lazy()` dan `Suspense`. Ketika pengguna
berpindah halaman, aplikasi menampilkan status loading sementara modul halaman
tersebut diunduh.

Selain itu, gambar pada kartu produk menggunakan atribut `loading="lazy"`.
Artinya, gambar yang belum terlihat di layar tidak harus langsung dimuat.
Dengan cara ini, proses awal aplikasi menjadi lebih ringan.

## 2. Query Caching

Fitur kedua adalah query caching. Cache digunakan untuk menyimpan hasil
permintaan katalog selama tiga puluh detik.

Jika pengguna meminta data dengan parameter yang sama, seperti halaman,
pencarian, kategori, dan pengurutan yang sama, aplikasi dapat menggunakan data
dari cache tanpa mengirim request baru.

Request yang sama dan masih berjalan juga digabung menjadi satu request.
Namun, ketika ada proses tambah, ubah, atau hapus produk, cache dibersihkan
agar data yang ditampilkan tetap terbaru. Tombol Retry juga dapat digunakan
untuk memaksa pengambilan data baru.

## 3. Share Link

Fitur ketiga adalah share link. Pada setiap kartu produk dan halaman detail
terdapat tombol Share.

Ketika tombol ditekan, aplikasi membuat link berdasarkan ID produk. Jika
perangkat mendukung Web Share API, link dapat langsung dibagikan. Jika tidak,
aplikasi mencoba menyalin link ke clipboard.

Saat link tersebut dibuka, aplikasi membaca ID produk dari URL dan langsung
menampilkan halaman detail produk yang sesuai. Fitur ini dapat digunakan untuk
semua kategori katalog, seperti Pistol, Rifle, Shotgun, maupun produk dari API.

## 4. Paginasi

Fitur keempat adalah paginasi. Data katalog sekarang ditampilkan empat produk
per halaman.

Pengguna dapat menggunakan tombol Next untuk melihat halaman berikutnya dan
tombol Previous untuk kembali. Ketika pencarian, kategori, atau pengurutan
diubah, halaman otomatis dikembalikan ke halaman pertama.

Pada data dari API, nomor halaman dan jumlah data dikirim ke server. Pada
katalog lokal, data dipotong di sisi klien. Jadi, paginasi tetap dapat
digunakan meskipun server sedang tidak tersedia.

## Penutup

Dengan penambahan fitur-fitur ini, aplikasi menjadi lebih efisien saat
memuat halaman, mengurangi request yang sama, memudahkan pengguna membagikan
produk, dan membuat daftar katalog lebih teratur.

Implementasi kemudian diverifikasi menggunakan perintah `npm test`,
`npm run lint`, dan `npm run build`.
