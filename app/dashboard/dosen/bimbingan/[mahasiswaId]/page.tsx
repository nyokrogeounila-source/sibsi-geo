'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const jenisBimbinganLabel: Record<string, string> = {
  proposal: 'Bimbingan Proposal',
  pra_penelitian: 'Bimbingan Pra Penelitian',
  hasil_penelitian: 'Bimbingan Hasil Penelitian',
  pasca_seminar_hasil: 'Bimbingan Pasca Seminar Hasil',
  cetak: 'Bimbingan Cetak',
}

export default function DetailBimbinganMahasiswa() {
  const supabase = createClient()
  const params = useParams()
  const mahasiswaId = params.mahasiswaId as string

  const [profile, setProfile] = useState<any>(null)
  const [mahasiswa, setMahasiswa] = useState<any>(null)
  const [bimbinganList, setBimbinganList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBimbingan, setSelectedBimbingan] = useState<any>(null)
  const [judulDipilih, setJudulDipilih] = useState<string>('')
  const [mahasiswaNama, setMahasiswaNama] = useState('—')
  const [mahasiswaFoto, setMahasiswaFoto] = useState<string | null>(null)
  const [mahasiswaEmail, setMahasiswaEmail] = useState('')
  const [mahasiswaWa, setMahasiswaWa] = useState('')

  const [komentar, setKomentar] = useState('')
  const [keputusan, setKeputusan] = useState('accepted')
  const [tanggalKeputusan, setTanggalKeputusan] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [linkBalasan, setLinkBalasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [editKeputusanId, setEditKeputusanId] = useState<string | null>(null)

  useEffect(() => { load() }, [mahasiswaId])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: m } = await supabase
      .from('mahasiswa')
      .select('id, npm, angkatan, pb1_id, pb2_id, penguji_id')
      .eq('id', mahasiswaId)
      .single()

    if (m) {
      const { data: mProfile } = await supabase
        .from('profiles')
        .select('nama, foto_url, email, no_wa')
        .eq('id', mahasiswaId)
        .single()

      setMahasiswaNama(mProfile?.nama ?? '—')
      setMahasiswaFoto(mProfile?.foto_url ?? null)
      setMahasiswaEmail(mProfile?.email ?? '')
      setMahasiswaWa(mProfile?.no_wa ?? '')

      const { data: judul } = await supabase
        .from('pengajuan_judul')
        .select('judul_1, judul_2, judul_dipilih')
        .eq('mahasiswa_id', mahasiswaId)
        .single()

      if (judul) {
        setJudulDipilih(judul.judul_dipilih === 1 ? judul.judul_1 : judul.judul_2)
      }
    }

    const { data: bl } = await supabase
      .from('bimbingan')
      .select('*, keputusan_bimbingan(*)')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('dosen_id', user.id)
      .order('tanggal_bimbingan', { ascending: false })

    setProfile(p)
    setMahasiswa(m)
    setBimbinganList(bl || [])
    setLoading(false)
  }

  function handleSelectBimbingan(item: any) {
    setSelectedBimbingan(item)
    setSuccess('')
    setError('')
    const existing = item.keputusan_bimbingan?.[0]
    if (existing) {
      setKomentar(existing.komentar || '')
      setKeputusan(existing.keputusan)
      setTanggalKeputusan(existing.tanggal_keputusan)
      setLinkBalasan(existing.link_balasan || '')
      setEditKeputusanId(existing.id)
    } else {
      setKomentar('')
      setKeputusan('accepted')
      setTanggalKeputusan(new Date().toISOString().split('T')[0])
      setLinkBalasan('')
      setEditKeputusanId(null)
    }
  }

  async function handleSubmitKeputusan(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      bimbingan_id: selectedBimbingan.id,
      dosen_id: user.id,
      komentar,
      keputusan,
      tanggal_keputusan: tanggalKeputusan,
      link_balasan: linkBalasan || null,
    }

    let err
    if (editKeputusanId) {
      const { error: updateError } = await supabase
        .from('keputusan_bimbingan')
        .update(payload)
        .eq('id', editKeputusanId)
      err = updateError
    } else {
      const { error: insertError } = await supabase
        .from('keputusan_bimbingan')
        .insert(payload)
      err = insertError
    }

    if (!err) {
      await supabase
        .from('bimbingan')
        .update({ status: keputusan === 'accepted' ? 'selesai' : 'diproses' })
        .eq('id', selectedBimbingan.id)
    }

    if (err) {
      setError('Gagal menyimpan keputusan.')
    } else {
      setSuccess('Keputusan berhasil disimpan.')
      await load()
      setSelectedBimbingan(null)
    }
    setSaving(false)
  }
  const keputusanColor: Record<string, string> = {
    revisi_mayor: 'bg-red-100 text-red-700',
    revisi_minor: 'bg-orange-100 text-orange-700',
    accepted: 'bg-green-100 text-green-700',
  }

  const statusColor: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-700',
    diproses: 'bg-orange-100 text-orange-700',
    selesai: 'bg-green-100 text-green-700',
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F7FF]">
        <p className="text-sm text-[#64748B]">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="dosen" nama={profile?.nama} foto_url={profile?.foto_url} />
      <main className="flex-1 p-8 max-w-4xl">
        <Link href="/dashboard/dosen" className="text-xs text-[#0891B2] hover:underline mb-6 inline-block">
          ← Kembali ke dashboard
        </Link>

        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {mahasiswaFoto ? (
              <img src={mahasiswaFoto} alt={mahasiswaNama}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#DAEAF7]" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                <span className="text-[#0891B2] font-semibold text-xl">
                  {mahasiswaNama?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-[#0C4A6E]">{mahasiswaNama}</h1>
              <p className="text-xs text-[#94A3B8]">NPM: {mahasiswa?.npm} · Angkatan {mahasiswa?.angkatan}</p>
              <div className="flex gap-3 mt-1">
                {mahasiswaEmail && (
                  <a href={`mailto:${mahasiswaEmail}`} className="text-xs text-[#0891B2] hover:underline">
                    ✉️ {mahasiswaEmail}
                  </a>
                )}
                {mahasiswaWa && (
                  <a href={`https://wa.me/${mahasiswaWa}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#0891B2] hover:underline">
                    💬 WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
          {judulDipilih && (
            <div className="bg-[#F0F7FF] rounded-lg p-3">
              <p className="text-xs text-[#64748B] mb-1">Judul Skripsi</p>
              <p className="text-sm text-[#334155] font-medium">{judulDipilih}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">Daftar Bimbingan</h2>
            <div className="space-y-3">
              {bimbinganList.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                  <p className="text-sm text-[#94A3B8]">Belum ada pengajuan bimbingan</p>
                </div>
              ) : (
                bimbinganList.map((item) => {
                  const kpts = item.keputusan_bimbingan?.[0]
                  const isSelected = selectedBimbingan?.id === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectBimbingan(item)}
                      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                        isSelected ? 'border-[#0891B2] shadow-sm' : 'border-[#DAEAF7] hover:border-[#0891B2]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-[#0C4A6E]">{item.topik}</p>
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            {jenisBimbinganLabel[item.jenis_bimbingan]} · {item.tanggal_bimbingan}
                          </p>
                        </div>
                        {kpts ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${keputusanColor[kpts.keputusan]}`}>
                            {kpts.keputusan.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            Menunggu Review
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 mb-2">
                        <a href={item.link_skripsi} target="_blank" rel="noopener noreferrer"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="text-xs text-[#0891B2] hover:underline">
                          📄 Skripsi
                        </a>
                        {item.link_lampiran && (
                          <a href={item.link_lampiran} target="_blank" rel="noopener noreferrer"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="text-xs text-[#0891B2] hover:underline">
                            📎 Lampiran
                          </a>
                        )}
                      </div>

                      {kpts?.komentar && (
                        <p className="text-xs text-[#64748B]">💬 {kpts.komentar}</p>
                      )}
                      {kpts?.link_balasan && (
                        <a href={kpts.link_balasan} target="_blank" rel="noopener noreferrer"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="text-xs text-[#0891B2] hover:underline mt-1 inline-block">
                          🔗 Link Dokumen Dosen
                        </a>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">Berikan Keputusan</h2>
            {!selectedBimbingan ? (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                <p className="text-sm text-[#94A3B8]">Pilih bimbingan di sebelah kiri</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
                <div className="bg-[#F0F7FF] rounded-lg p-3 mb-5">
                  <p className="text-xs text-[#64748B] mb-1">Bimbingan dipilih</p>
                  <p className="text-sm font-medium text-[#0C4A6E]">{selectedBimbingan.topik}</p>
                  <p className="text-xs text-[#94A3B8]">{jenisBimbinganLabel[selectedBimbingan.jenis_bimbingan]}</p>
                  {selectedBimbingan.deskripsi && (
                    <p className="text-xs text-[#64748B] mt-2">{selectedBimbingan.deskripsi}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmitKeputusan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">Keputusan</label>
                    <select
                      value={keputusan}
                      onChange={(e) => setKeputusan(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                    >
                      <option value="accepted">Accepted</option>
                      <option value="revisi_minor">Revisi Minor</option>
                      <option value="revisi_mayor">Revisi Mayor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Komentar / Catatan
                    </label>
                    <textarea
                      value={komentar}
                      onChange={(e) => setKomentar(e.target.value)}
                      placeholder="Tuliskan komentar untuk mahasiswa"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Link Dokumen <span className="text-[#94A3B8] font-normal">(opsional)</span>
                    </label>
                    <input
                      type="url"
                      value={linkBalasan}
                      onChange={(e) => setLinkBalasan(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Tanggal Keputusan
                    </label>
                    <input
                      type="date"
                      value={tanggalKeputusan}
                      onChange={(e) => setTanggalKeputusan(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60"
                    >
                      {saving ? 'Menyimpan...' : editKeputusanId ? 'Perbarui Keputusan' : 'Simpan Keputusan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBimbingan(null)}
                      className="text-sm text-[#64748B] px-4 py-2.5 rounded-lg border border-[#DAEAF7] hover:border-[#0891B2] transition"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}