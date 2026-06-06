'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

const jenisSeminarOptions = [
  { value: 'proposal', label: 'Seminar Proposal' },
  { value: 'hasil', label: 'Seminar Hasil' },
  { value: 'komprehensif', label: 'Ujian Komprehensif' },
]

const statusColor: Record<string, string> = {
  menunggu: 'bg-yellow-100 text-yellow-700',
  disetujui: 'bg-green-100 text-green-700',
  ditolak: 'bg-red-100 text-red-700',
}

export default function PengajuanJadwal() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [mahasiswa, setMahasiswa] = useState<any>(null)
  const [pb1Nama, setPb1Nama] = useState('—')
  const [pb2Nama, setPb2Nama] = useState('—')
  const [pengujiNama, setPengujiNama] = useState('—')
  const [jadwalList, setJadwalList] = useState<any[]>([])
  const [bimbinganList, setBimbinganList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [jenis, setJenis] = useState('proposal')
  const [tanggal, setTanggal] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: m } = await supabase
      .from('mahasiswa')
      .select('id, npm, angkatan, pb1_id, pb2_id, penguji_id')
      .eq('id', user.id)
      .single()

    if (m?.pb1_id) {
      const { data: pb1 } = await supabase
        .from('profiles').select('nama').eq('id', m.pb1_id).single()
      setPb1Nama(pb1?.nama ?? '—')
    }

    if (m?.pb2_id) {
      const { data: pb2 } = await supabase
        .from('profiles').select('nama').eq('id', m.pb2_id).single()
      setPb2Nama(pb2?.nama ?? '—')
    }

    if (m?.penguji_id) {
      const { data: penguji } = await supabase
        .from('profiles').select('nama').eq('id', m.penguji_id).single()
      setPengujiNama(penguji?.nama ?? '—')
    }

    const { data: jl } = await supabase
      .from('jadwal_seminar')
      .select('*, ruangan(*)')
      .eq('mahasiswa_id', user.id)
      .order('created_at', { ascending: false })

    const { data: bl } = await supabase
      .from('bimbingan')
      .select('*, keputusan_bimbingan(*)')
      .eq('mahasiswa_id', user.id)

    setProfile(p)
    setMahasiswa(m)
    setJadwalList(jl || [])
    setBimbinganList(bl || [])
    setLoading(false)
  }

  function cekEligible(jenisSeminar: string): { eligible: boolean; pesan: string } {
    const accepted = (jenisBimbingan: string) =>
      bimbinganList.some(
        (b) =>
          b.jenis_bimbingan === jenisBimbingan &&
          b.keputusan_bimbingan?.some((k: any) => k.keputusan === 'accepted')
      )

    if (jenisSeminar === 'proposal') {
      if (!accepted('proposal')) {
        return { eligible: false, pesan: 'Bimbingan proposal belum di-Accepted oleh pembimbing.' }
      }
    }

    if (jenisSeminar === 'hasil') {
      if (!accepted('hasil_penelitian')) {
        return { eligible: false, pesan: 'Bimbingan hasil penelitian belum di-Accepted.' }
      }
    }

    if (jenisSeminar === 'komprehensif') {
      if (!accepted('pasca_seminar_hasil')) {
        return { eligible: false, pesan: 'Bimbingan pasca seminar hasil belum di-Accepted.' }
      }
    }

    return { eligible: true, pesan: '' }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { eligible, pesan } = cekEligible(jenis)
    if (!eligible) {
      setError(pesan)
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (!mahasiswa?.pb1_id) {
      setError('Pembimbing 1 belum ditetapkan. Hubungi admin.')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase
      .from('jadwal_seminar')
      .insert({
        mahasiswa_id: user.id,
        jenis_seminar: jenis,
        tanggal_diajukan: tanggal,
        pb1_id: mahasiswa.pb1_id,
        pb2_id: mahasiswa.pb2_id || null,
        penguji_id: mahasiswa.penguji_id || null,
        status: 'menunggu',
      })

    if (insertError) {
      setError('Gagal mengajukan jadwal: ' + insertError.message)
    } else {
      setSuccess('Pengajuan jadwal berhasil dikirim. Menunggu persetujuan admin.')
      setShowForm(false)
      setJenis('proposal')
      setTanggal('')
      await load()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F7FF]">
        <p className="text-sm text-[#64748B]">Memuat...</p>
      </div>
    )
  }

  const { eligible, pesan } = cekEligible(jenis)

  return (
    <div className="flex min-h-screen">
      <Sidebar role="mahasiswa" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#0C4A6E]">Pengajuan Jadwal Seminar</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Ajukan Jadwal
            </button>
          )}
        </div>
        <p className="text-sm text-[#64748B] mb-8">
          Pengajuan jadwal seminar proposal, hasil, dan ujian komprehensif
        </p>

        <div className="bg-[#E0F2FE] rounded-xl p-4 mb-8">
          <p className="text-xs font-medium text-[#0369A1] mb-2">Syarat Pengajuan Jadwal:</p>
          <ul className="space-y-1">
            <li className="text-xs text-[#0369A1]">• Seminar Proposal — Bimbingan proposal harus sudah Accepted</li>
            <li className="text-xs text-[#0369A1]">• Seminar Hasil — Bimbingan hasil penelitian harus sudah Accepted</li>
            <li className="text-xs text-[#0369A1]">• Ujian Komprehensif — Bimbingan pasca seminar hasil harus sudah Accepted</li>
          </ul>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0C4A6E]">Form Pengajuan Jadwal</h2>
              <button onClick={() => setShowForm(false)}
                className="text-xs text-[#94A3B8] hover:text-[#64748B]">Batal</button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Jenis Seminar</label>
                <select value={jenis} onChange={(e) => setJenis(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white">
                  {jenisSeminarOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {!eligible && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-4 py-3">
                  ⚠️ {pesan}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Tanggal yang Diusulkan</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
              </div>

              <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-[#64748B]">Dosen yang terlibat:</p>
                <div className="flex justify-between">
                  <span className="text-xs text-[#94A3B8]">Pembimbing 1</span>
                  <span className="text-xs text-[#334155]">{pb1Nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#94A3B8]">Pembimbing 2</span>
                  <span className="text-xs text-[#334155]">{pb2Nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#94A3B8]">Penguji</span>
                  <span className="text-xs text-[#334155]">{pengujiNama}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !eligible}
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-sm text-[#64748B] px-4 py-2.5 rounded-lg border border-[#DAEAF7] hover:border-[#0891B2] transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {jadwalList.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DAEAF7] p-10 text-center">
              <p className="text-sm text-[#94A3B8]">Belum ada pengajuan jadwal seminar</p>
            </div>
          ) : (
            jadwalList.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-[#DAEAF7] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-[#0C4A6E] text-sm">
                      {jenisSeminarOptions.find(j => j.value === item.jenis_seminar)?.label}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Diajukan: {item.tanggal_diajukan}
                      {item.tanggal_disetujui && ` — Disetujui: ${item.tanggal_disetujui}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${statusColor[item.status]}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>

                {item.ruangan && (
                  <p className="text-xs text-[#64748B]">
                    📍 Ruangan: <span className="font-medium">{item.ruangan.nama_ruangan}</span>
                  </p>
                )}

                {item.catatan_admin && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700">{item.catatan_admin}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}