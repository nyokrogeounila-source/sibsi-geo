import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default async function DashboardMahasiswa() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'mahasiswa') redirect('/login')

  const { data: mahasiswa } = await supabase
    .from('mahasiswa')
    .select('id, npm, angkatan, pb1_id, pb2_id, penguji_id')
    .eq('id', user.id)
    .single()

  let pb1Nama = '—'
  let pb2Nama = '—'

  if (mahasiswa?.pb1_id) {
    const { data: pb1 } = await supabase
      .from('profiles').select('nama').eq('id', mahasiswa.pb1_id).single()
    pb1Nama = pb1?.nama ?? '—'
  }

  if (mahasiswa?.pb2_id) {
    const { data: pb2 } = await supabase
      .from('profiles').select('nama').eq('id', mahasiswa.pb2_id).single()
    pb2Nama = pb2?.nama ?? '—'
  }

  const { data: bimbingan } = await supabase
    .from('bimbingan')
    .select('*, keputusan_bimbingan(*)')
    .eq('mahasiswa_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: pengajuanJudul } = await supabase
    .from('pengajuan_judul')
    .select('*')
    .eq('mahasiswa_id', user.id)
    .single()

  const jenisBimbinganLabel: Record<string, string> = {
    proposal: 'Bimbingan Proposal',
    pra_penelitian: 'Bimbingan Pra Penelitian',
    hasil_penelitian: 'Bimbingan Hasil Penelitian',
    pasca_seminar_hasil: 'Bimbingan Pasca Seminar Hasil',
    cetak: 'Bimbingan Cetak',
  }

  const keputusanColor: Record<string, string> = {
    revisi_mayor: 'bg-red-100 text-red-700',
    revisi_minor: 'bg-orange-100 text-orange-700',
    accepted: 'bg-green-100 text-green-700',
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="mahasiswa" nama={profile.nama} foto_url={profile.foto_url} />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">
            Selamat datang, {profile.nama.split(' ')[0]}!
          </h1>
          <p className="text-sm text-[#64748B]">
            Program Studi Pendidikan Geografi FKIP Universitas Lampung
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Status Judul</p>
            <p className="text-lg font-semibold text-[#0C4A6E]">
              {pengajuanJudul
                ? pengajuanJudul.status.charAt(0).toUpperCase() + pengajuanJudul.status.slice(1)
                : 'Belum Diajukan'}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              !pengajuanJudul ? 'bg-gray-100 text-gray-500' :
              pengajuanJudul.status === 'disetujui' ? 'bg-green-100 text-green-700' :
              pengajuanJudul.status === 'menunggu' ? 'bg-yellow-100 text-yellow-700' :
              pengajuanJudul.status === 'revisi' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {pengajuanJudul ? pengajuanJudul.status : 'Ajukan sekarang'}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Pembimbing 1</p>
            <p className="text-lg font-semibold text-[#0C4A6E]">{pb1Nama}</p>
            <p className="text-xs text-[#94A3B8] mt-1">Pembimbing Utama</p>
          </div>

          <div className="bg-white rounded-xl border border-[#DAEAF7] p-5">
            <p className="text-xs text-[#64748B] mb-1">Pembimbing 2</p>
            <p className="text-lg font-semibold text-[#0C4A6E]">{pb2Nama}</p>
            <p className="text-xs text-[#94A3B8] mt-1">Pembimbing Pendamping</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
          <h2 className="font-semibold text-[#0C4A6E] mb-4">Bimbingan Terakhir</h2>
          {bimbingan && bimbingan.length > 0 ? (
            <div className="space-y-3">
              {bimbingan.map((item: any) => {
                const keputusan = item.keputusan_bimbingan?.[0]
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#334155]">{item.topik}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {jenisBimbinganLabel[item.jenis_bimbingan]} — {item.tanggal_bimbingan}
                      </p>
                      {keputusan?.komentar && (
                        <p className="text-xs text-[#64748B] mt-1">💬 {keputusan.komentar}</p>
                      )}
                    </div>
                    {keputusan ? (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${keputusanColor[keputusan.keputusan]}`}>
                        {keputusan.keputusan.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Menunggu Review
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[#94A3B8]">Belum ada pengajuan bimbingan</p>
              <Link
                href="/dashboard/mahasiswa/bimbingan"
                className="text-xs text-[#0891B2] hover:underline mt-2 inline-block"
              >
                Ajukan bimbingan pertama →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}