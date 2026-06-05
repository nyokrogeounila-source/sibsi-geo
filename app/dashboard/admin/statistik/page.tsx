'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

export default function StatistikAdmin() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMahasiswa: 0,
    totalProposal: 0,
    totalHasil: 0,
    totalKomprehensif: 0,
    totalCetak: 0,
  })
  const [perAngkatan, setPerAngkatan] = useState<Record<string, number>>({})
  const [perStatus, setPerStatus] = useState<Record<string, number>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

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

    const { data: mahasiswaData } = await supabase
      .from('mahasiswa')
      .select('angkatan')

    const angkatanMap: Record<string, number> = {}
    mahasiswaData?.forEach((m) => {
      const key = String(m.angkatan)
      angkatanMap[key] = (angkatanMap[key] || 0) + 1
    })

    const { data: judulData } = await supabase
      .from('pengajuan_judul')
      .select('status')

    const statusMap: Record<string, number> = {
      menunggu: 0,
      disetujui: 0,
      revisi: 0,
      ditolak: 0,
    }
    judulData?.forEach((j) => {
      statusMap[j.status] = (statusMap[j.status] || 0) + 1
    })

    setProfile(p)
    setStats({
      totalMahasiswa: totalMahasiswa ?? 0,
      totalProposal: totalProposal ?? 0,
      totalHasil: totalHasil ?? 0,
      totalKomprehensif: totalKomprehensif ?? 0,
      totalCetak: totalCetak ?? 0,
    })
    setPerAngkatan(angkatanMap)
    setPerStatus(statusMap)
    setLoading(false)
  }

  const maxAngkatan = Math.max(...Object.values(perAngkatan), 1)

  const statusColor: Record<string, string> = {
    menunggu: 'bg-yellow-400',
    disetujui: 'bg-green-400',
    revisi: 'bg-orange-400',
    ditolak: 'bg-red-400',
  }

  const statusLabel: Record<string, string> = {
    menunggu: 'Menunggu',
    disetujui: 'Disetujui',
    revisi: 'Revisi',
    ditolak: 'Ditolak',
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F7FF]">
        <p className="text-sm text-[#64748B]">Memuat...</p>
      </div>
    )
  }

  const totalJudul = Object.values(perStatus).reduce((a, b) => a + b, 0)

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Statistik</h1>
        <p className="text-sm text-[#64748B] mb-8">
          Rekap data bimbingan skripsi Pendidikan Geografi FKIP Unila
        </p>

        {/* Kartu Statistik Utama */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Mahasiswa', value: stats.totalMahasiswa, color: 'text-[#0C4A6E]' },
            { label: 'Seminar Proposal', value: stats.totalProposal, color: 'text-[#0891B2]' },
            { label: 'Seminar Hasil', value: stats.totalHasil, color: 'text-[#0369A1]' },
            { label: 'Ujian Komprehensif', value: stats.totalKomprehensif, color: 'text-[#075985]' },
            { label: 'Selesai Cetak', value: stats.totalCetak, color: 'text-green-600' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-[#DAEAF7] p-5">
              <p className="text-xs text-[#64748B] mb-1">{item.label}</p>
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Grafik Per Angkatan */}
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
            <h2 className="font-semibold text-[#0C4A6E] mb-6">Sebaran Mahasiswa Per Angkatan</h2>
            {Object.keys(perAngkatan).length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Belum ada data</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(perAngkatan)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([angkatan, jumlah]) => {
                    const pct = Math.round((jumlah / maxAngkatan) * 100)
                    return (
                      <div key={angkatan}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#334155]">
                            Angkatan {angkatan}
                          </span>
                          <span className="text-sm text-[#64748B]">{jumlah} mahasiswa</span>
                        </div>
                        <div className="w-full bg-[#F0F7FF] rounded-full h-3">
                          <div
                            className="bg-[#0891B2] h-3 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Grafik Status Pengajuan Judul */}
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
            <h2 className="font-semibold text-[#0C4A6E] mb-6">Status Pengajuan Judul</h2>
            {totalJudul === 0 ? (
              <p className="text-sm text-[#94A3B8]">Belum ada pengajuan judul</p>
            ) : (
              <>
                {/* Bar Chart */}
                <div className="flex items-end gap-4 h-40 mb-4">
                  {Object.entries(perStatus).map(([status, jumlah]) => {
                    const maxStatus = Math.max(...Object.values(perStatus), 1)
                    const pct = Math.round((jumlah / maxStatus) * 100)
                    return (
                      <div key={status} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-[#334155]">{jumlah}</span>
                        <div className="w-full flex items-end" style={{ height: '100px' }}>
                          <div
                            className={`w-full rounded-t-lg ${statusColor[status]}`}
                            style={{ height: `${Math.max(pct, 5)}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#64748B] text-center">
                          {statusLabel[status]}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {Object.entries(perStatus).map(([status, jumlah]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full ${statusColor[status]}`} />
                      <span className="text-xs text-[#64748B]">
                        {statusLabel[status]}: {jumlah}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Skripsi */}
        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
          <h2 className="font-semibold text-[#0C4A6E] mb-6">Progress Skripsi Mahasiswa</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Mahasiswa', value: stats.totalMahasiswa, icon: '👥', color: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' },
              { label: 'Seminar Proposal', value: stats.totalProposal, icon: '🎤', color: 'bg-blue-50', text: 'text-blue-600' },
              { label: 'Seminar Hasil', value: stats.totalHasil, icon: '📊', color: 'bg-purple-50', text: 'text-purple-600' },
              { label: 'Ujian Komprehensif', value: stats.totalKomprehensif, icon: '🎓', color: 'bg-amber-50', text: 'text-amber-600' },
              { label: 'Selesai Cetak', value: stats.totalCetak, icon: '✅', color: 'bg-green-50', text: 'text-green-600' },
            ].map((item, index) => (
              <div key={item.label} className="text-center">
                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <p className={`text-2xl font-bold ${item.text} mb-1`}>{item.value}</p>
                <p className="text-xs text-[#64748B]">{item.label}</p>
                {index < 4 && (
                  <div className="mt-3 flex justify-center">
                    <span className="text-[#DAEAF7] text-lg">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar Keseluruhan */}
          {stats.totalMahasiswa > 0 && (
            <div className="mt-6 pt-6 border-t border-[#F1F5F9]">
              <p className="text-xs text-[#64748B] mb-3">Persentase progress keseluruhan</p>
              <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-green-400 transition-all"
                  style={{ width: `${(stats.totalCetak / stats.totalMahasiswa) * 100}%` }}
                  title={`Selesai: ${stats.totalCetak}`}
                />
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${(stats.totalKomprehensif / stats.totalMahasiswa) * 100}%` }}
                  title={`Komprehensif: ${stats.totalKomprehensif}`}
                />
                <div
                  className="bg-purple-400 transition-all"
                  style={{ width: `${(stats.totalHasil / stats.totalMahasiswa) * 100}%` }}
                  title={`Seminar Hasil: ${stats.totalHasil}`}
                />
                <div
                  className="bg-blue-400 transition-all"
                  style={{ width: `${(stats.totalProposal / stats.totalMahasiswa) * 100}%` }}
                  title={`Seminar Proposal: ${stats.totalProposal}`}
                />
                <div className="bg-[#F0F7FF] flex-1" title="Belum mulai" />
              </div>
              <div className="flex gap-4 mt-2 flex-wrap">
                {[
                  { color: 'bg-green-400', label: 'Selesai cetak' },
                  { color: 'bg-amber-400', label: 'Ujian komprehensif' },
                  { color: 'bg-purple-400', label: 'Seminar hasil' },
                  { color: 'bg-blue-400', label: 'Seminar proposal' },
                  { color: 'bg-[#F0F7FF] border border-[#DAEAF7]', label: 'Belum mulai' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-[#64748B]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}