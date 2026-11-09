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

## Penjelasan Source Code

### A. Source code lazy load

Pada `src/App.jsx`, halaman tidak diimpor secara langsung, tetapi menggunakan
`lazy()`:

```jsx
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
```

Komponen tersebut dibungkus dengan `Suspense`:

```jsx
<Suspense fallback={<div>Loading page…</div>}>
  {/* halaman aplikasi */}
</Suspense>
```

Jadi, `lazy()` menunda import halaman, sedangkan `Suspense` menampilkan
tampilan sementara sampai proses import selesai. Pada
`src/components/gun/GunCard.jsx`, gambar juga menggunakan:

```jsx
<img src={imgSrc} loading="lazy" alt={gun.name} />
```

### B. Source code query caching

File `src/utils/queryCache.js` menyediakan cache sederhana berbasis `Map`.
Setiap data disimpan bersama waktu kedaluwarsanya:

```js
const cached = entries.get(key)
if (cached && cached.expiresAt > Date.now()) {
  return Promise.resolve(cached.value)
}
```

Pada `src/services/gunService.js`, parameter query dibuat menjadi key yang
konsisten. Jika key sama, hasil sebelumnya dapat digunakan kembali:

```js
return queryCache.fetch(queryKey, async () => {
  return apiClient.get('/api/v1/recipes', { params: clean })
}, options)
```

Setelah operasi create, update, atau delete selesai, fungsi
`invalidateGunQueries()` membersihkan cache agar daftar katalog tidak
menampilkan data lama.

### C. Source code share link

File `src/utils/shareLink.js` membuat URL berdasarkan ID produk:

```js
export function createGunShareUrl(gun, currentUrl) {
  const url = new URL(currentUrl)
  url.searchParams.set('gun', String(gun.id))
  return url.toString()
}
```

Fungsi tersebut digunakan oleh `src/components/common/ShareButton.jsx`.
Komponen mencoba `navigator.share()` terlebih dahulu, kemudian menggunakan
`navigator.clipboard.writeText()` jika Web Share API tidak tersedia.

Ketika link dibuka, `src/App.jsx` membaca parameter `gun`:

```js
const sharedGunId =
  new URLSearchParams(window.location.search).get('gun')
```

ID lokal seperti `local-0` dicari dari data lokal, sedangkan ID dari server
diambil menggunakan `gunService.getGunById()`. Setelah data ditemukan,
aplikasi mengubah mode menjadi detail produk.

### D. Source code paginasi

Pada `src/pages/Catalog.jsx`, ukuran halaman ditetapkan menjadi empat:

```js
const PAGE_SIZE = 4
const [currentPage, setCurrentPage] = useState(1)
```

Parameter halaman dikirim ke hook:

```js
const queryParams = {
  page: currentPage,
  limit: PAGE_SIZE,
  search,
  category: activeCategory,
}
```

Pada `src/services/gunService.js`, parameter tersebut diteruskan ke API.
Untuk Supabase, posisi data dihitung dengan rumus:

```js
const offset = (page - 1) * limit
```

Untuk katalog lokal, fungsi `paginateItems()` di
`src/utils/helpers.js` mengambil bagian array sesuai halaman:

```js
items.slice((page - 1) * pageSize, page * pageSize)
```

Tombol Next dan Previous mengubah nilai `currentPage`, sedangkan perubahan
filter mengembalikan nilainya ke `1`.

## Penutup

Dengan penambahan fitur-fitur ini, aplikasi menjadi lebih efisien saat
memuat halaman, mengurangi request yang sama, memudahkan pengguna membagikan
produk, dan membuat daftar katalog lebih teratur.

Implementasi kemudian diverifikasi menggunakan perintah `npm test`,
`npm run lint`, dan `npm run build`.
