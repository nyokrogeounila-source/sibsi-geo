import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default async function DashboardDosen() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'dosen') redirect('/login')

  const { data: asPb1 } = await supabase
    .from('mahasiswa').select('id').eq('pb1_id', user.id)

  const { data: asPb2 } = await supabase
    .from('mahasiswa').select('id').eq('pb2_id', user.id)

  const { data: asPenguji } = await supabase
    .from('mahasiswa').select('id').eq('penguji_id', user.id)

  const allIds = [
    ...(asPb1 || []).map(m => m.id),
    ...(asPb2 || []).map(m => m.id),
    ...(asPenguji || []).map(m => m.id),
  ]
  const uniqueIds = [...new Set(allIds)]

  // Ambil semua bimbingan yang ditujukan ke dosen ini
  const { data: semuaBimbingan } = await supabase
    .from('bimbingan')
    .select('id, mahasiswa_id, keputusan_bimbingan(*)')
    .eq('dosen_id', user.id)

  // Hitung menunggu review = bimbingan yang belum ada keputusan
  const menungguReview = (semuaBimbingan || []).filter(
    b => !b.keputusan_bimbingan || b.keputusan_bimbingan.length === 0
  ).length

  let mahasiswaList: any[] = []

  if (uniqueIds.length > 0) {
    const { data: ml } = await supabase
      .from('mahasiswa')
      .select('id, npm, angkatan, pb1_id, pb2_id, penguji_id')
      .in('id', uniqueIds)

    if (ml && ml.length > 0) {
      const { data: profilesMhs } = await supabase
        .from('profiles')
        .select('id, nama, foto_url')
        .in('id', ml.map(m => m.id))

      const { data: judulList } = await supabase
        .from('pengajuan_judul')
        .select('mahasiswa_id, judul_1, judul_2, judul_dipilih, status')
        .in('mahasiswa_id', ml.map(m => m.id))

      // Ambil keputusan bimbingan terbaru per mahasiswa
      const { data: bimbinganList } = await supabase
        .from('bimbingan')
        .select('mahasiswa_id, keputusan_bimbingan(*)')
        .eq('dosen_id', user.id)
        .in('mahasiswa_id', ml.map(m => m.id))
        .order('tanggal_bimbingan', { ascending: false })

      mahasiswaList = ml.map(m => {
  const bimbinganMhs = (bimbinganList || []).filter(b => b.mahasiswa_id === m.id)
  
  // Cek apakah ada bimbingan yang belum ada keputusan
  const adaYangMenunggu = bimbinganMhs.some(
    b => !b.keputusan_bimbingan || b.keputusan_bimbingan.length === 0
  )

  const keputusanTerbaru = adaYangMenunggu ? null : bimbinganMhs
    .flatMap(b => b.keputusan_bimbingan || [])
    .sort((a: any, b: any) => new Date(b.tanggal_keputusan).getTime() - new Date(a.tanggal_keputusan).getTime())[0]

  return {
    ...m,
    profiles: profilesMhs?.find(p => p.id === m.id) || null,
    pengajuan_judul: judulList?.filter(j => j.mahasiswa_id === m.id) || [],
    keputusanTerbaru: keputusanTerbaru || null,
    peran: m.pb1_id === user.id ? 'PB1' : m.pb2_id === user.id ? 'PB2' : 'Penguji',
  }
})
    }
  }

  const keputusanColor: Record<string, string> = {
    revisi_mayor: 'bg-red-100 text-red-700',
    revisi_minor: 'bg-orange-100 text-orange-700',
    accepted: 'bg-green-100 text-green-700',
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="dosen" nama={profile.nama} foto_url={profile.foto_url} />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">
            Selamat datang, {profile.nama.split(' ')[0]}!
          </h1>
          <p className="text-sm text-[#64748B]">
            Dashboard Dosen — Pendidikan Geografi FKIP Universitas Lampung
          </p>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Sebagai PB1</p>
            <p className="text-2xl font-bold text-[#0891B2]">{asPb1?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Sebagai PB2</p>
            <p className="text-2xl font-bold text-[#0369A1]">{asPb2?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Sebagai Penguji</p>
            <p className="text-2xl font-bold text-[#075985]">{asPenguji?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Menunggu Review</p>
            <p className="text-2xl font-bold text-amber-500">{menungguReview}</p>
          </div>
        </div>

        {/* Mahasiswa Bimbingan */}
        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
          <h2 className="font-semibold text-[#0C4A6E] mb-4">
            Mahasiswa Bimbingan
            <span className="ml-2 text-xs font-normal text-[#94A3B8]">
              ({mahasiswaList.length} total)
            </span>
          </h2>

          {mahasiswaList.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-8">Belum ada mahasiswa bimbingan</p>
          ) : (
            <>
              {/* Menunggu Review */}
              {mahasiswaList.filter(m => !m.keputusanTerbaru).length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-amber-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-400 rounded-full inline-block"></span>
                    Menunggu Review ({mahasiswaList.filter(m => !m.keputusanTerbaru).length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mahasiswaList.filter(m => !m.keputusanTerbaru).map((m) => (
                      <MahasiswaCard key={m.id} m={m} userId={user.id} keputusanColor={keputusanColor} />
                    ))}
                  </div>
                </div>
              )}

              {/* Revisi Mayor */}
              {mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'revisi_mayor').length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-red-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>
                    Revisi Mayor ({mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'revisi_mayor').length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'revisi_mayor').map((m) => (
                      <MahasiswaCard key={m.id} m={m} userId={user.id} keputusanColor={keputusanColor} />
                    ))}
                  </div>
                </div>
              )}

              {/* Revisi Minor */}
              {mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'revisi_minor').length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-orange-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full inline-block"></span>
                    Revisi Minor ({mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'revisi_minor').length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'revisi_minor').map((m) => (
                      <MahasiswaCard key={m.id} m={m} userId={user.id} keputusanColor={keputusanColor} />
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted */}
              {mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'accepted').length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-green-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                    Accepted ({mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'accepted').length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mahasiswaList.filter(m => m.keputusanTerbaru?.keputusan === 'accepted').map((m) => (
                      <MahasiswaCard key={m.id} m={m} userId={user.id} keputusanColor={keputusanColor} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function MahasiswaCard({ m, userId, keputusanColor }: { m: any, userId: string, keputusanColor: Record<string, string> }) {
  const nama = m.profiles?.nama ?? '—'
  const judul = m.pengajuan_judul?.[0]
  const judulDipilih = judul?.judul_dipilih === 1 ? judul?.judul_1 : judul?.judul_2

  return (
    <Link
      href={`/dashboard/dosen/bimbingan/${m.id}`}
      className="block border border-[#DAEAF7] rounded-xl p-4 hover:border-[#0891B2] hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        {m.profiles?.foto_url ? (
          <img src={m.profiles.foto_url} alt={nama}
            className="w-10 h-10 rounded-full object-cover border border-[#DAEAF7]" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
            <span className="text-[#0891B2] font-semibold text-sm">
              {nama?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0C4A6E] truncate">{nama}</p>
          <p className="text-xs text-[#94A3B8]">NPM: {m.npm} · {m.angkatan}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full">
          {m.peran}
        </span>
        {m.keputusanTerbaru ? (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${keputusanColor[m.keputusanTerbaru.keputusan]}`}>
            {m.keputusanTerbaru.keputusan.replace(/_/g, ' ').toUpperCase()}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            Menunggu Review
          </span>
        )}
      </div>

      {judulDipilih && (
        <p className="text-xs text-[#64748B] mt-2 line-clamp-2">{judulDipilih}</p>
      )}
    </Link>
  )
}