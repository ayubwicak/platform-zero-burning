/**
 * Data testimoni partisipan program Zero Burning.
 * Catatan integritas: Testimoni hanya ditampilkan ke publik bila `verified: true`.
 * Testimoni placeholder/draf ditandai `verified: false` agar tidak menampilkan testimoni fiktif sebagai nyata.
 */
export const testimonials = [
  {
    id: 'testimoni-1',
    nama: 'Kuswanto',
    peran: 'Petani Padi Organik',
    lokasi: 'Kec. Losarang, Indramayu',
    kutipan: 'Sebelumnya jerami sisa panen selalu dibakar karena keterbatasan waktu olah tanah. Setelah ada pendampingan pengomposan dan insentif benih, biaya musim tanam berikutnya berkurang nyata.',
    fotoOpsional: null,
    verified: false,
  },
  {
    id: 'testimoni-2',
    nama: 'Rahmat Hidayat',
    peran: 'Petani Padi Sawah',
    lokasi: 'Kec. Telagasari, Karawang',
    kutipan: 'Sistem foto dengan titik lokasi 50 meter memastikan tidak ada klaim palsu. Kami yang sungguh-sungguh tidak membakar merasa kerja keras kami dihargai.',
    fotoOpsional: null,
    verified: false,
  },
  {
    id: 'testimoni-3',
    nama: 'Supriyadi',
    peran: 'Ketua Kelompok Tani',
    lokasi: 'Kec. Sukamandi, Subang',
    kutipan: 'Bantuan peminjaman alat cacah jerami sangat membantu kelompok kami mempercepat dekomposisi jerami tanpa perlu satu pun titik api.',
    fotoOpsional: null,
    verified: false,
  },
];
