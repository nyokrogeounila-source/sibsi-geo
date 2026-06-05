import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default async function DashboardAdmin() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  const { count: totalMahasiswa } = await supabase
    .from('mahasiswa')
    .select('*', { count: 'exact', head: true })

  const { count: totalProposal } = await supabase
    .from('jadwal_seminar')
    .select('*', { count: 'exact', head: true })
    .eq('jenis_seminar', 'proposal')
    .eq('status', 'disetujui')

  const { count: totalHasil } = await supabase
    .from('jadwal_seminar')
    .select('*', { count: 'exact', head: true })
    .eq('jenis_seminar', 'hasil')
    .eq('status', 'disetujui')

  const { count: totalKomprehensif } = await supabase
    .from('jadwal_seminar')
    .select('*', { count: 'exact', head: true })
    .eq('jenis_seminar', 'komprehensif')
    .eq('status', 'disetujui')

  const { count: totalCetak } = await supabase
    .from('persetujuan_cetak')
    .select('*', { count: 'exact', head: true })
    .eq('status_akhir', 'disetujui')

  const { count: totalPengajuanJudul } = await supabase
    .from('pengajuan_judul')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'menunggu')

  const { count: totalJadwalMenunggu } = await supabase
    .from('jadwal_seminar')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'menunggu')

  const { data: perAngkatan } = await supabase
    .from('mahasiswa')
    .select('angkatan')
    .order('angkatan', { ascending: true })

  const angkatanMap: Record<number, number> = {}
  perAngkatan?.forEach((m) => {
    angkatanMap[m.angkatan] = (angkatanMap[m.angkatan] || 0) + 1
  })

  const menuCepat = [
    { href: '/dashboard/admin/pengajuan-judul', label: 'Pengajuan Judul', icon: '📝', desc: 'Review & setujui judul' },
    { href: '/dashboard/admin/jadwal', label: 'Jadwal Seminar', icon: '📅', desc: 'Atur jadwal & ruangan' },
    { href: '/dashboard/admin/pengguna', label: 'Pengguna', icon: '👥', desc: 'Kelola mahasiswa & dosen' },
    { href: '/jadwal', label: 'Lihat Jadwal Publik', icon: '🗓️', desc: '14 hari ke depan' },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" nama={profile.nama} foto_url={profile.foto_url} />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Dashboard Admin</h1>
          <p className="text-sm text-[#64748B]">
            Pendidikan Geografi FKIP Universitas Lampung
          </p>
        </div>

        {((totalPengajuanJudul ?? 0) > 0 || (totalJadwalMenunggu ?? 0) > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-4">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Perlu perhatian:</p>
              <div className="flex gap-4 mt-1">
                {(totalPengajuanJudul ?? 0) > 0 && (
                  <Link href="/dashboard/admin/pengajuan-judul" className="text-xs text-amber-700 hover:underline">
                    {totalPengajuanJudul} pengajuan judul menunggu
                  </Link>
                )}
                {(totalJadwalMenunggu ?? 0) > 0 && (
                  <Link href="/dashboard/admin/jadwal" className="text-xs text-amber-700 hover:underline">
                    {totalJadwalMenunggu} jadwal seminar menunggu
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Total Mahasiswa</p>
            <p className="text-2xl font-bold text-[#0C4A6E]">{totalMahasiswa ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Seminar Proposal</p>
            <p className="text-2xl font-bold text-[#0891B2]">{totalProposal ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Seminar Hasil</p>
            <p className="text-2xl font-bold text-[#0369A1]">{totalHasil ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Ujian Komprehensif</p>
            <p className="text-2xl font-bold text-[#075985]">{totalKomprehensif ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Selesai Cetak</p>
            <p className="text-2xl font-bold text-green-600">{totalCetak ?? 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-6">
          <h2 className="font-semibold text-[#0C4A6E] mb-4">Sebaran Per Angkatan</h2>
          {Object.keys(angkatanMap).length === 0 ? (
            <p className="text-sm text-[#94A3B8]">Belum ada data mahasiswa</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(angkatanMap)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([angkatan, jumlah]) => {
                  const max = Math.max(...Object.values(angkatanMap))
                  const pct = Math.round((jumlah / max) * 100)
                  return (
                    <div key={angkatan} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-[#334155] w-12">
                        {angkatan}
                      </span>
                      <div className="flex-1 bg-[#F0F7FF] rounded-full h-2">
                        <div
                          className="bg-[#0891B2] h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-[#64748B] w-8 text-right">
                        {jumlah}
                      </span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuCepat.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl border border-[#DAEAF7] p-5 hover:border-[#0891B2] hover:shadow-sm transition-all"
            >
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <p className="text-sm font-medium text-[#0C4A6E] mb-1">{item.label}</p>
              <p className="text-xs text-[#94A3B8]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}