import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function JadwalDosen() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'dosen') redirect('/login')

  const today = new Date()
  const in30Days = new Date()
  in30Days.setDate(today.getDate() + 30)

  const todayStr = today.toISOString().split('T')[0]
  const in30DaysStr = in30Days.toISOString().split('T')[0]

  const { data: jadwalList } = await supabase
    .from('jadwal_seminar')
    .select(`
      *,
      ruangan(*),
      mahasiswa:mahasiswa_id(npm, angkatan)
    `)
    .eq('status', 'disetujui')
    .gte('tanggal_disetujui', todayStr)
    .lte('tanggal_disetujui', in30DaysStr)
    .or(`pb1_id.eq.${user.id},pb2_id.eq.${user.id},penguji_id.eq.${user.id}`)
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

  // Ambil nama mahasiswa terpisah
  let jadwalWithNama: any[] = []
  if (jadwalList && jadwalList.length > 0) {
    const mahasiswaIds = jadwalList.map(j => j.mahasiswa_id)
    const { data: profilesMhs } = await supabase
      .from('profiles')
      .select('id, nama, foto_url')
      .in('id', mahasiswaIds)

    jadwalWithNama = jadwalList.map(j => ({
      ...j,
      mahasiswaNama: profilesMhs?.find(p => p.id === j.mahasiswa_id)?.nama ?? '—',
      mahasiswaFoto: profilesMhs?.find(p => p.id === j.mahasiswa_id)?.foto_url ?? null,
    }))
  }

  // Group by tanggal
  const grouped: Record<string, any[]> = {}
  jadwalWithNama.forEach((item) => {
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

  return (
    <div className="flex min-h-screen">
      <Sidebar role="dosen" nama={profile.nama} foto_url={profile.foto_url} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Jadwal Seminar</h1>
        <p className="text-sm text-[#64748B] mb-8">
          Jadwal seminar dan ujian Anda dalam 30 hari ke depan
        </p>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DAEAF7] p-16 text-center">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-sm font-medium text-[#334155] mb-1">
              Tidak ada jadwal seminar
            </p>
            <p className="text-xs text-[#94A3B8]">
              Dalam 30 hari ke depan belum ada jadwal seminar yang dijadwalkan
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
                      <p className="text-xs text-[#94A3B8]">{items.length} seminar</p>
                    </div>
                  </div>

                  <div className="space-y-4 ml-2">
                    {items.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-[#DAEAF7] p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {item.mahasiswaFoto ? (
                              <img src={item.mahasiswaFoto} alt={item.mahasiswaNama}
                                className="w-10 h-10 rounded-full object-cover border border-[#DAEAF7]" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                                <span className="text-[#0891B2] font-semibold">
                                  {item.mahasiswaNama?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#0C4A6E] text-sm">{item.mahasiswaNama}</p>
                              <p className="text-xs text-[#94A3B8]">
                                NPM: {item.mahasiswa?.npm} · {item.mahasiswa?.angkatan}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${jenisSeminarColor[item.jenis_seminar]}`}>
                            {jenisSeminarLabel[item.jenis_seminar]}
                          </span>
                        </div>

                        {item.ruangan && (
                          <p className="text-xs text-[#64748B]">
                            📍 {item.ruangan.nama_ruangan}
                          </p>
                        )}

                        <div className="mt-2">
                          {item.pb1_id === user.id && (
                            <span className="text-xs bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full">Pembimbing 1</span>
                          )}
                          {item.pb2_id === user.id && (
                            <span className="text-xs bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full">Pembimbing 2</span>
                          )}
                          {item.penguji_id === user.id && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Penguji</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}