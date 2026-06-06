import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function DosenAvatar({ nama, foto, label }: { nama: string | null, foto: string | null, label: string }) {
  if (!nama) return null
  return (
    <div className="flex items-center gap-2">
      {foto ? (
        <img src={foto} alt={nama}
          className="w-8 h-8 rounded-full object-cover border border-[#DAEAF7]" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
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

export default async function JadwalPublik() {
  const supabase = await createClient()

  const today = new Date()
  const in14Days = new Date()
  in14Days.setDate(today.getDate() + 14)

  const todayStr = today.toISOString().split('T')[0]
  const in14DaysStr = in14Days.toISOString().split('T')[0]

  const { data: jadwalList } = await supabase
    .from('jadwal_seminar')
    .select('*')
    .eq('status', 'disetujui')
    .gte('tanggal_disetujui', todayStr)
    .lte('tanggal_disetujui', in14DaysStr)
    .order('tanggal_disetujui', { ascending: true })

  let jadwalWithData: any[] = []

  if (jadwalList && jadwalList.length > 0) {
    const mahasiswaIds = jadwalList.map(j => j.mahasiswa_id)
    const dosenIds = [
      ...jadwalList.filter(j => j.pb1_id).map(j => j.pb1_id),
      ...jadwalList.filter(j => j.pb2_id).map(j => j.pb2_id),
      ...jadwalList.filter(j => j.penguji_id).map(j => j.penguji_id),
    ].filter(Boolean)
    const ruanganIds = jadwalList.filter(j => j.ruangan_id).map(j => j.ruangan_id)

    const { data: profilesMhs } = await supabase
      .from('profiles').select('id, nama, foto_url').in('id', mahasiswaIds)

    const { data: profilesDosen } = dosenIds.length > 0
      ? await supabase.from('profiles').select('id, nama, foto_url').in('id', dosenIds)
      : { data: [] }

    const { data: ruanganData } = ruanganIds.length > 0
      ? await supabase.from('ruangan').select('id, nama_ruangan').in('id', ruanganIds)
      : { data: [] }

    const { data: mahasiswaData } = await supabase
      .from('mahasiswa').select('id, npm, angkatan').in('id', mahasiswaIds)

    jadwalWithData = jadwalList.map(j => ({
      ...j,
      mahasiswaNama: profilesMhs?.find(p => p.id === j.mahasiswa_id)?.nama ?? '—',
      mahasiswaFoto: profilesMhs?.find(p => p.id === j.mahasiswa_id)?.foto_url ?? null,
      mahasiswaNpm: mahasiswaData?.find(m => m.id === j.mahasiswa_id)?.npm ?? '—',
      mahasiswaAngkatan: mahasiswaData?.find(m => m.id === j.mahasiswa_id)?.angkatan ?? '—',
      pb1Nama: profilesDosen?.find(p => p.id === j.pb1_id)?.nama ?? null,
      pb1Foto: profilesDosen?.find(p => p.id === j.pb1_id)?.foto_url ?? null,
      pb2Nama: profilesDosen?.find(p => p.id === j.pb2_id)?.nama ?? null,
      pb2Foto: profilesDosen?.find(p => p.id === j.pb2_id)?.foto_url ?? null,
      pengujiNama: profilesDosen?.find(p => p.id === j.penguji_id)?.nama ?? null,
      pengujiNamFoto: profilesDosen?.find(p => p.id === j.penguji_id)?.foto_url ?? null,
      ruanganNama: ruanganData?.find(r => r.id === j.ruangan_id)?.nama_ruangan ?? null,
    }))
  }

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

  const grouped: Record<string, any[]> = {}
  jadwalWithData.forEach((item) => {
    const tgl = item.tanggal_disetujui
    if (!grouped[tgl]) grouped[tgl] = []
    grouped[tgl].push(item)
  })

  const formatTanggal = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-[#F0F7FF]">
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
          <Link href="/" className="text-xs text-[#64748B] hover:text-[#0891B2] transition">
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

        <div className="flex gap-3 mb-8 flex-wrap">
          {Object.entries(jenisSeminarLabel).map(([key, label]) => (
            <span key={key} className={`text-xs px-3 py-1 rounded-full font-medium ${jenisSeminarColor[key]}`}>
              {label}
            </span>
          ))}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DAEAF7] p-16 text-center">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-sm font-medium text-[#334155] mb-1">Tidak ada jadwal seminar</p>
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#0891B2] text-white rounded-xl px-4 py-2 text-center min-w-16">
                      <p className="text-lg font-bold leading-none">
                        {new Date(tanggal + 'T00:00:00').getDate()}
                      </p>
                      <p className="text-xs opacity-80">
                        {new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0C4A6E] text-sm">{formatTanggal(tanggal)}</p>
                      <p className="text-xs text-[#94A3B8]">{items.length} seminar</p>
                    </div>
                  </div>

                  <div className="space-y-4 ml-2">
                    {items.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-[#DAEAF7] p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {item.mahasiswaFoto ? (
                              <img src={item.mahasiswaFoto} alt={item.mahasiswaNama}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#DAEAF7]" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                                <span className="text-[#0891B2] font-bold text-lg">
                                  {item.mahasiswaNama?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#0C4A6E]">{item.mahasiswaNama}</p>
                              <p className="text-xs text-[#94A3B8]">
                                NPM: {item.mahasiswaNpm} · Angkatan {item.mahasiswaAngkatan}
                              </p>
                              {item.jam && (
                                <p className="text-xs font-medium text-[#0891B2] mt-0.5">
                                  🕐 {item.jam}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${jenisSeminarColor[item.jenis_seminar]}`}>
                            {jenisSeminarLabel[item.jenis_seminar]}
                          </span>
                        </div>

                        {item.ruanganNama && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm">📍</span>
                            <span className="text-sm font-medium text-[#334155]">{item.ruanganNama}</span>
                          </div>
                        )}

                        <div className="border-t border-[#F1F5F9] pt-4">
                          <p className="text-xs text-[#94A3B8] mb-3">Dosen</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <DosenAvatar nama={item.pb1Nama} foto={item.pb1Foto} label="Pembimbing 1" />
                            {item.pb2Nama && (
                              <DosenAvatar nama={item.pb2Nama} foto={item.pb2Foto} label="Pembimbing 2" />
                            )}
                            {item.pengujiNama && (
                              <DosenAvatar nama={item.pengujiNama} foto={item.pengujiNamFoto} label="Penguji" />
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