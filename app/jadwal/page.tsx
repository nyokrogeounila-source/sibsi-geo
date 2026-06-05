import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function JadwalPublik() {
  const supabase = await createClient()

  const today = new Date()
  const in14Days = new Date()
  in14Days.setDate(today.getDate() + 14)

  const todayStr = today.toISOString().split('T')[0]
  const in14DaysStr = in14Days.toISOString().split('T')[0]

  const { data: jadwalList } = await supabase
    .from('jadwal_seminar')
    .select(`
      *,
      mahasiswa:mahasiswa_id(
        npm, angkatan,
        profiles!mahasiswa_id_fkey(nama, foto_url)
      ),
      ruangan(*),
      pb1:pb1_id(id, profiles!dosen_id_fkey(nama, foto_url)),
      pb2:pb2_id(id, profiles!dosen_id_fkey(nama, foto_url)),
      penguji:penguji_id(id, profiles!dosen_id_fkey(nama, foto_url))
    `)
    .eq('status', 'disetujui')
    .gte('tanggal_disetujui', todayStr)
    .lte('tanggal_disetujui', in14DaysStr)
    .order('tanggal_disetujui', { ascending: true })

  const jenisSeminarLabel: Record<string, string> = {
    proposal: 'Seminar Proposal',
    hasil: 'Seminar Hasil',
    komprehensif: 'Ujian Komprehensif',
  }

  const jenisSeminarColor: Record<string, string> = {
    proposal: 'bg-blue-100 text-blue-700',
    hasil: 'bg-purple-100 text-purple-700',
    komprehensif: 'bg-green-100 text-green-700',
  }

  // Group by tanggal
  const grouped: Record<string, any[]> = {}
  jadwalList?.forEach((item) => {
    const tgl = item.tanggal_disetujui
    if (!grouped[tgl]) grouped[tgl] = []
    grouped[tgl].push(item)
  })

  const formatTanggal = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const DosenAvatar = ({ dosen, label }: { dosen: any; label: string }) => {
    if (!dosen) return null
    const nama = dosen.profiles?.nama ?? '—'
    return (
      <div className="flex items-center gap-2">
        {dosen.profiles?.foto_url ? (
          <img
            src={dosen.profiles.foto_url}
            alt={nama}
            className="w-7 h-7 rounded-full object-cover border border-[#DAEAF7]"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
            <span className="text-[#0891B2] font-semibold text-xs">
              {nama.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="text-xs text-[#94A3B8]">{label}</p>
          <p className="text-xs font-medium text-[#334155]">{nama}</p>
        </div>
      </div>
    )
  }

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
              <p className="text-xs text-[#64748B]">Jadwal Seminar</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-[#64748B] hover:text-[#0891B2] transition"
          >
            ← Beranda
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0C4A6E] mb-2">Jadwal Seminar</h1>
          <p className="text-sm text-[#64748B]">
            Jadwal seminar proposal, hasil, dan ujian komprehensif — 14 hari ke depan
          </p>
        </div>

        {/* Legenda */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {Object.entries(jenisSeminarLabel).map(([key, label]) => (
            <span
              key={key}
              className={`text-xs px-3 py-1 rounded-full font-medium ${jenisSeminarColor[key]}`}
            >
              {label}
            </span>
          ))}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DAEAF7] p-16 text-center">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-sm font-medium text-[#334155] mb-1">
              Tidak ada jadwal seminar
            </p>
            <p className="text-xs text-[#94A3B8]">
              Dalam 14 hari ke depan belum ada jadwal seminar yang dijadwalkan
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tanggal, items]) => (
                <div key={tanggal}>
                  {/* Tanggal Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#0891B2] text-white rounded-xl px-4 py-2 text-center min-w-16">
                      <p className="text-lg font-bold leading-none">
                        {new Date(tanggal).getDate()}
                      </p>
                      <p className="text-xs opacity-80">
                        {new Date(tanggal).toLocaleDateString('id-ID', { month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0C4A6E] text-sm">
                        {formatTanggal(tanggal)}
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        {items.length} seminar
                      </p>
                    </div>
                  </div>

                  {/* Kartu Seminar */}
                  <div className="space-y-4 ml-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-[#DAEAF7] p-6"
                      >
                        {/* Header Kartu */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {item.mahasiswa?.profiles?.foto_url ? (
                              <img
                                src={item.mahasiswa.profiles.foto_url}
                                alt={item.mahasiswa.profiles.nama}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#DAEAF7]"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                                <span className="text-[#0891B2] font-bold text-lg">
                                  {item.mahasiswa?.profiles?.nama?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#0C4A6E]">
                                {item.mahasiswa?.profiles?.nama}
                              </p>
                              <p className="text-xs text-[#94A3B8]">
                                NPM: {item.mahasiswa?.npm} · Angkatan {item.mahasiswa?.angkatan}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${jenisSeminarColor[item.jenis_seminar]}`}>
                            {jenisSeminarLabel[item.jenis_seminar]}
                          </span>
                        </div>

                        {/* Ruangan */}
                        {item.ruangan && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm">📍</span>
                            <span className="text-sm font-medium text-[#334155]">
                              {item.ruangan.nama_ruangan}
                            </span>
                          </div>
                        )}

                        {/* Dosen */}
                        <div className="border-t border-[#F1F5F9] pt-4">
                          <p className="text-xs text-[#94A3B8] mb-3">Dosen</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <DosenAvatar dosen={item.pb1} label="Pembimbing 1" />
                            {item.pb2 && (
                              <DosenAvatar dosen={item.pb2} label="Pembimbing 2" />
                            )}
                            {item.penguji && (
                              <DosenAvatar dosen={item.penguji} label="Penguji" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </main>
  )
}