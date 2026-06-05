import Link from 'next/link'

export default function PanduanPage() {
  const tahapan = [
    {
      nomor: '01',
      judul: 'Pengajuan Judul',
      icon: '📝',
      deskripsi: 'Mahasiswa mengajukan dua judul skripsi beserta alasan pemilihan dan rumusan masalah melalui sistem SIBSI GEO.',
      detail: [
        'Login ke SIBSI GEO sebagai mahasiswa',
        'Buka menu Pengajuan Judul',
        'Isi judul pertama dan kedua beserta alasan dan rumusan masalah',
        'Klik Kirim Pengajuan dan tunggu persetujuan admin',
      ],
    },
    {
      nomor: '02',
      judul: 'Penetapan Pembimbing',
      icon: '👨‍🏫',
      deskripsi: 'Admin meninjau pengajuan judul, memilih salah satu judul yang disetujui, dan menetapkan Pembimbing 1 serta Pembimbing 2 (jika ada).',
      detail: [
        'Admin memilih judul yang disetujui',
        'Admin menetapkan Pembimbing 1 (wajib)',
        'Admin menetapkan Pembimbing 2 (opsional)',
        'Mahasiswa mendapat notifikasi status pengajuan',
      ],
    },
    {
      nomor: '03',
      judul: 'Bimbingan Proposal',
      icon: '📚',
      deskripsi: 'Mahasiswa melakukan bimbingan proposal kepada Pembimbing 1 dan/atau Pembimbing 2 hingga mendapat keputusan Accepted.',
      detail: [
        'Ajukan bimbingan proposal melalui menu Pengajuan Bimbingan',
        'Lampirkan link Google Drive dokumen skripsi',
        'Dosen memberikan keputusan: Revisi Mayor, Revisi Minor, atau Accepted',
        'Lakukan revisi dan ajukan kembali hingga Accepted',
      ],
    },
    {
      nomor: '04',
      judul: 'Seminar Proposal',
      icon: '🎤',
      deskripsi: 'Setelah bimbingan proposal Accepted, mahasiswa dapat mengajukan jadwal Seminar Proposal.',
      detail: [
        'Buka menu Pengajuan Jadwal',
        'Pilih Seminar Proposal dan tanggal yang diusulkan',
        'Admin menetapkan ruangan dan dosen penguji',
        'Jadwal akan muncul di halaman Jadwal Seminar publik',
      ],
    },
    {
      nomor: '05',
      judul: 'Bimbingan Hasil Penelitian',
      icon: '🔬',
      deskripsi: 'Setelah seminar proposal, mahasiswa melanjutkan penelitian dan mengajukan bimbingan hasil penelitian.',
      detail: [
        'Lakukan penelitian di lapangan',
        'Ajukan bimbingan hasil penelitian ke pembimbing',
        'Dosen memberikan keputusan bimbingan',
        'Lakukan revisi hingga Accepted',
      ],
    },
    {
      nomor: '06',
      judul: 'Seminar Hasil',
      icon: '📊',
      deskripsi: 'Setelah bimbingan hasil penelitian Accepted, mahasiswa dapat mengajukan jadwal Seminar Hasil.',
      detail: [
        'Ajukan jadwal Seminar Hasil melalui sistem',
        'Admin menetapkan jadwal dan ruangan',
        'Lakukan presentasi hasil penelitian',
        'Lakukan perbaikan pasca seminar',
      ],
    },
    {
      nomor: '07',
      judul: 'Bimbingan Pasca Seminar Hasil',
      icon: '✏️',
      deskripsi: 'Mahasiswa melakukan bimbingan pasca seminar hasil untuk perbaikan skripsi sebelum ujian komprehensif.',
      detail: [
        'Ajukan bimbingan pasca seminar hasil',
        'Dapat ditujukan ke PB1, PB2, atau Penguji',
        'Lakukan perbaikan sesuai masukan',
        'Tunggu keputusan Accepted dari pembimbing',
      ],
    },
    {
      nomor: '08',
      judul: 'Ujian Komprehensif',
      icon: '🎓',
      deskripsi: 'Setelah bimbingan pasca seminar hasil Accepted, mahasiswa mengajukan jadwal Ujian Komprehensif.',
      detail: [
        'Ajukan jadwal Ujian Komprehensif melalui sistem',
        'Admin menetapkan jadwal dan ruangan',
        'Lakukan ujian komprehensif',
        'Lakukan perbaikan akhir skripsi',
      ],
    },
    {
      nomor: '09',
      judul: 'Persetujuan Cetak',
      icon: '🖨️',
      deskripsi: 'Langkah terakhir adalah mengajukan persetujuan cetak skripsi kepada Pembimbing 1, Pembimbing 2, dan Penguji.',
      detail: [
        'Buka menu Persetujuan Cetak Skripsi',
        'Lampirkan link skripsi final',
        'Pembimbing 1, 2, dan Penguji memberikan persetujuan',
        'Setelah semua menyetujui, skripsi siap dicetak',
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-[#F0F7FF]">
      {/* Header */}
      <header className="bg-white border-b border-[#DAEAF7]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0891B2] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">SG</span>
            </div>
            <div>
              <p className="font-semibold text-[#0C4A6E] text-sm">SIBSI GEO</p>
              <p className="text-xs text-[#64748B]">Panduan Penyusunan Skripsi</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-[#64748B] hover:text-[#0891B2] transition">
            ← Beranda
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#0C4A6E] mb-2">
            Panduan Penyusunan Skripsi
          </h1>
          <p className="text-sm text-[#64748B]">
            Program Studi Pendidikan Geografi — FKIP Universitas Lampung
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Garis vertikal */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#DAEAF7]" />

          <div className="space-y-6">
            {tahapan.map((tahap, index) => (
              <div key={index} className="relative flex gap-6">
                {/* Nomor */}
                <div className="w-16 h-16 rounded-2xl bg-[#0891B2] flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                  <div className="text-center">
                    <p className="text-white text-xs opacity-75">{tahap.nomor}</p>
                    <p className="text-white text-xl leading-none">{tahap.icon}</p>
                  </div>
                </div>

                {/* Konten */}
                <div className="flex-1 bg-white rounded-2xl border border-[#DAEAF7] p-6 mb-2">
                  <h2 className="font-semibold text-[#0C4A6E] text-base mb-2">
                    {tahap.judul}
                  </h2>
                  <p className="text-sm text-[#64748B] mb-4 leading-relaxed">
                    {tahap.deskripsi}
                  </p>
                  <div className="space-y-2">
                    {tahap.detail.map((d, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#0891B2] text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-xs text-[#64748B]">{d}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-10 bg-[#E0F2FE] rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-[#0369A1] mb-1">
            Butuh bantuan?
          </p>
          <p className="text-xs text-[#0369A1]">
            Hubungi admin atau koordinator skripsi Program Studi Pendidikan Geografi FKIP Universitas Lampung
          </p>
        </div>
      </div>
    </main>
  )
}