import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F0F7FF]">
      {/* Header */}
      <header className="bg-white border-b border-[#DAEAF7]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0891B2] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SG</span>
            </div>
            <div>
              <h1 className="font-semibold text-[#0C4A6E] text-sm leading-tight">SIBSI GEO</h1>
              <p className="text-xs text-[#64748B]">Pendidikan Geografi FKIP Unila</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <span className="inline-block bg-[#E0F2FE] text-[#0369A1] text-xs font-medium px-3 py-1 rounded-full mb-4">
          Sistem Informasi Bimbingan Skripsi
        </span>
        <h2 className="text-4xl font-bold text-[#0C4A6E] mb-4 leading-tight">
          SIBSI GEO
        </h2>
        <p className="text-[#334155] text-lg mb-2">
          Program Studi Pendidikan Geografi
        </p>
        <p className="text-[#64748B] text-sm mb-10">
          Jurusan Pendidikan IPS — Fakultas Keguruan dan Ilmu Pendidikan — Universitas Lampung
        </p>

        {/* Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Link href="/login?role=mahasiswa">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#DAEAF7] hover:shadow-md hover:border-[#0891B2] transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-[#E0F2FE] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#BAE6FD] transition-colors">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="font-semibold text-[#0C4A6E] mb-2">Mahasiswa</h3>
              <p className="text-sm text-[#64748B]">Pengajuan judul, bimbingan, dan jadwal seminar</p>
            </div>
          </Link>

          <Link href="/login?role=dosen">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#DAEAF7] hover:shadow-md hover:border-[#0891B2] transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-[#E0F2FE] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#BAE6FD] transition-colors">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="font-semibold text-[#0C4A6E] mb-2">Dosen</h3>
              <p className="text-sm text-[#64748B]">Kelola bimbingan dan berikan keputusan</p>
            </div>
          </Link>

          <Link href="/login?role=admin">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#DAEAF7] hover:shadow-md hover:border-[#0891B2] transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-[#E0F2FE] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#BAE6FD] transition-colors">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="font-semibold text-[#0C4A6E] mb-2">Admin</h3>
              <p className="text-sm text-[#64748B]">Kelola data, jadwal, dan pengguna sistem</p>
            </div>
          </Link>
        </div>

        {/* Jadwal & Panduan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/jadwal">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DAEAF7] hover:shadow-md hover:border-[#0891B2] transition-all cursor-pointer text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E0F2FE] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0C4A6E] mb-1">Jadwal Seminar</h3>
                  <p className="text-sm text-[#64748B]">Lihat jadwal seminar proposal, hasil, dan ujian komprehensif 14 hari ke depan</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/panduan">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DAEAF7] hover:shadow-md hover:border-[#0891B2] transition-all cursor-pointer text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E0F2FE] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0C4A6E] mb-1">Panduan Penyusunan Skripsi</h3>
                  <p className="text-sm text-[#64748B]">Panduan lengkap tahapan penyusunan skripsi Pendidikan Geografi</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-[#94A3B8]">
        © 2025 SIBSI GEO — Program Studi Pendidikan Geografi FKIP Universitas Lampung
      </footer>
    </main>
  )
}