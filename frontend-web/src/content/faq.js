/**
 * Daftar pertanyaan yang sering diajukan (FAQ) program Zero Burning.
 * Diringkas menjadi butir-butir paling esensial untuk kemudahan membaca bagi petani.
 */
export const faqCategories = [
  { id: 'semua', label: 'Semua Pertanyaan' },
  { id: 'pendaftaran', label: 'Pendaftaran' },
  { id: 'verifikasi', label: 'Foto & Verifikasi' },
  { id: 'insentif', label: 'Insentif' },
  { id: 'keamanan', label: 'Data & Keamanan' },
];

export const faqs = [
  {
    id: 'faq-1',
    category: 'pendaftaran',
    categoryLabel: 'Pendaftaran',
    q: 'Siapa yang dapat mendaftar dan apakah dipungut biaya?',
    a: 'Setiap petani dapat mendaftar mandiri secara 100% gratis tanpa dipungut biaya apa pun. Dokumen yang diperlukan cukup Nomor Induk Kependudukan (NIK 16 digit), nomor telepon/email aktif, dan data dasar lahan (nama lahan, perkiraan luas, jenis tanaman, serta titik koordinat lahan).',
  },
  {
    id: 'faq-4',
    category: 'verifikasi',
    categoryLabel: 'Foto & Verifikasi',
    q: 'Bagaimana cara mengambil foto bukti lahan yang sah dan valid?',
    a: 'Foto wajib diambil langsung di area lahan saat pengolahan tanpa bakar berlangsung. Posisi GPS perangkat ponsel Anda harus berada dalam radius maksimal 50 meter dari titik koordinat lahan yang terdaftar. Format berkas yang didukung adalah JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.',
  },
  {
    id: 'faq-5',
    category: 'verifikasi',
    categoryLabel: 'Foto & Verifikasi',
    q: 'Berapa lama proses verifikasi dan apa yang dilakukan bila foto ditolak?',
    a: 'Proses verifikasi membutuhkan waktu 1 hingga 3 hari kerja oleh sistem dan petugas lapangan. Jika foto ditolak (misalnya posisi GPS melenceng atau foto buram), Anda dapat membaca catatan alasan penolakan di dashboard dan mengunggah foto baru yang lebih jelas selama periode olah lahan masih aktif.',
  },
  {
    id: 'faq-8',
    category: 'insentif',
    categoryLabel: 'Insentif',
    q: 'Bagaimana cara klaim insentif dan apa saja pilihan bantuannya?',
    a: 'Setelah lahan Anda memiliki foto berstatus "Terverifikasi", buka menu Klaim Insentif di dashboard. Pilihan bantuan dapat diambil dari katalog yang tersedia, seperti benih padi unggul bersertifikat, pupuk organik hayati, atau peminjaman alat pengolah tanah.',
  },
  {
    id: 'faq-10',
    category: 'keamanan',
    categoryLabel: 'Data & Keamanan',
    q: 'Apakah data pribadi dan titik koordinat lahan saya aman?',
    a: 'Sangat aman. Kata sandi dienkripsi dengan standar keamanan modern (hash), lalu lintas data dilindungi SSL, dan data pribadi tidak pernah diperjualbelikan kepada pihak lain. Rincian hak pengguna dan tata kelola perlindungan data dapat dibaca pada halaman Kebijakan Privasi.',
  },
];
