'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

const jenisBimbinganOptions = [
  { value: 'proposal', label: 'Bimbingan Proposal' },
  { value: 'pra_penelitian', label: 'Bimbingan Pra Penelitian' },
  { value: 'hasil_penelitian', label: 'Bimbingan Hasil Penelitian' },
  { value: 'pasca_seminar_hasil', label: 'Bimbingan Pasca Seminar Hasil' },
  { value: 'cetak', label: 'Bimbingan Cetak' },
]

const dosenOptions = [
  { value: 'pb1', label: 'Pembimbing 1' },
  { value: 'pb2', label: 'Pembimbing 2' },
  { value: 'penguji', label: 'Penguji' },
]

const dosenByJenis: Record<string, string[]> = {
  proposal: ['pb1', 'pb2'],
  pra_penelitian: ['pb1', 'pb2', 'penguji'],
  hasil_penelitian: ['pb1', 'pb2'],
  pasca_seminar_hasil: ['pb1', 'pb2', 'penguji'],
  cetak: ['pb1', 'pb2', 'penguji'],
}

const statusColor: Record<string, string> = {
  menunggu: 'bg-yellow-100 text-yellow-700',
  diproses: 'bg-blue-100 text-blue-700',
  selesai: 'bg-green-100 text-green-700',
}

const keputusanColor: Record<string, string> = {
  revisi_mayor: 'bg-red-100 text-red-700',
  revisi_minor: 'bg-orange-100 text-orange-700',
  accepted: 'bg-green-100 text-green-700',
}

export default function PengajuanBimbingan() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [mahasiswa, setMahasiswa] = useState<any>(null)
  const [pb1Nama, setPb1Nama] = useState('—')
  const [pb2Nama, setPb2Nama] = useState('—')
  const [pengujiNama, setPengujiNama] = useState('—')
  const [bimbinganList, setBimbinganList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [jenis, setJenis] = useState('proposal')
  const [ditujukan, setDitujukan] = useState('pb1')
  const [topik, setTopik] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [linkSkripsi, setLinkSkripsi] = useState('')
  const [linkLampiran, setLinkLampiran] = useState('')
  const [catatanTambahan, setCatatanTambahan] = useState('')
  const [tanggal, setTanggal] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: m } = await supabase
      .from('mahasiswa')
      .select('id, npm, angkatan, pb1_id, pb2_id, penguji_id')
      .eq('id', user.id)
      .single()

    if (m?.pb1_id) {
      const { data: pb1 } = await supabase
        .from('profiles')
        .select('nama')
        .eq('id', m.pb1_id)
        .single()
      setPb1Nama(pb1?.nama ?? '—')
    }

    if (m?.pb2_id) {
      const { data: pb2 } = await supabase
        .from('profiles')
        .select('nama')
        .eq('id', m.pb2_id)
        .single()
      setPb2Nama(pb2?.nama ?? '—')
    }

    if (m?.penguji_id) {
      const { data: penguji } = await supabase
        .from('profiles')
        .select('nama')
        .eq('id', m.penguji_id)
        .single()
      setPengujiNama(penguji?.nama ?? '—')
    }

    const { data: bl } = await supabase
      .from('bimbingan')
      .select('*, keputusan_bimbingan(*)')
      .eq('mahasiswa_id', user.id)
      .order('tanggal_bimbingan', { ascending: false })

    setProfile(p)
    setMahasiswa(m)
    setBimbinganList(bl || [])
    setLoading(false)
  }

  function resetForm() {
    setJenis('proposal')
    setDitujukan('pb1')
    setTopik('')
    setDeskripsi('')
    setLinkSkripsi('')
    setLinkLampiran('')
    setCatatanTambahan('')
    setTanggal('')
    setEditId(null)
  }

  function handleEdit(item: any) {
    setJenis(item.jenis_bimbingan)
    setDitujukan(item.ditujukan_ke)
    setTopik(item.topik)
    setDeskripsi(item.deskripsi || '')
    setLinkSkripsi(item.link_skripsi)
    setLinkLampiran(item.link_lampiran || '')
    setCatatanTambahan(item.catatan_tambahan || '')
    setTanggal(item.tanggal_bimbingan)
    setEditId(item.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dosenId = ditujukan === 'pb1'
      ? mahasiswa?.pb1_id
      : ditujukan === 'pb2'
      ? mahasiswa?.pb2_id
      : mahasiswa?.penguji_id

    const payload = {
      mahasiswa_id: user.id,
      jenis_bimbingan: jenis,
      ditujukan_ke: ditujukan,
      dosen_id: dosenId,
      topik,
      deskripsi,
      link_skripsi: linkSkripsi,
      link_lampiran: linkLampiran || null,
      catatan_tambahan: catatanTambahan || null,
      tanggal_bimbingan: tanggal,
    }

    let err
    if (editId) {
      const { error: updateError } = await supabase
        .from('bimbingan')
        .update(payload)
        .eq('id', editId)
      err = updateError
    } else {
      const { error: insertError } = await supabase
        .from('bimbingan')
        .insert(payload)
      err = insertError
    }

    if (err) {
      setError('Gagal menyimpan bimbingan.')
    } else {
      setSuccess(editId ? 'Bimbingan berhasil diperbarui.' : 'Pengajuan bimbingan berhasil dikirim.')
      resetForm()
      setShowForm(false)
      await load()
    }

    setSaving(false)
  }

  const availableDosen = dosenByJenis[jenis] || ['pb1', 'pb2']

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F7FF]">
        <p className="text-sm text-[#64748B]">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="mahasiswa" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#0C4A6E]">Pengajuan Bimbingan</h1>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Ajukan Bimbingan
            </button>
          )}
        </div>
        <p className="text-sm text-[#64748B] mb-8">Kelola pengajuan bimbingan skripsi Anda</p>

        {showForm && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0C4A6E]">
                {editId ? 'Edit Bimbingan' : 'Form Pengajuan Bimbingan'}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="text-xs text-[#94A3B8] hover:text-[#64748B]"
              >
                Batal
              </button>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">
                    Jenis Bimbingan
                  </label>
                  <select
                    value={jenis}
                    onChange={(e) => { setJenis(e.target.value); setDitujukan('pb1') }}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                  >
                    {jenisBimbinganOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">
                    Ditujukan Kepada
                  </label>
                  <select
                    value={ditujukan}
                    onChange={(e) => setDitujukan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                  >
                    {dosenOptions
                      .filter((opt) => availableDosen.includes(opt.value))
                      .map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                  </select>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {ditujukan === 'pb1' && pb1Nama}
                    {ditujukan === 'pb2' && pb2Nama}
                    {ditujukan === 'penguji' && pengujiNama}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Topik Bimbingan</label>
                <input
                  type="text"
                  value={topik}
                  onChange={(e) => setTopik(e.target.value)}
                  placeholder="Masukkan topik bimbingan"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Deskripsi / Catatan</label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan hal yang ingin didiskusikan"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">
                  Link Skripsi <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={linkSkripsi}
                  onChange={(e) => setLinkSkripsi(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">
                  Link Lampiran <span className="text-[#94A3B8] font-normal">(opsional)</span>
                </label>
                <input
                  type="url"
                  value={linkLampiran}
                  onChange={(e) => setLinkLampiran(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">
                  Catatan Tambahan <span className="text-[#94A3B8] font-normal">(opsional)</span>
                </label>
                <textarea
                  value={catatanTambahan}
                  onChange={(e) => setCatatanTambahan(e.target.value)}
                  placeholder="Catatan lain jika diperlukan"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Tanggal Bimbingan</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
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
                  {saving ? 'Menyimpan...' : editId ? 'Perbarui' : 'Kirim Pengajuan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="text-sm text-[#64748B] hover:text-[#334155] px-4 py-2.5 rounded-lg border border-[#DAEAF7] transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {bimbinganList.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DAEAF7] p-10 text-center">
              <p className="text-sm text-[#94A3B8]">Belum ada pengajuan bimbingan</p>
            </div>
          ) : (
            bimbinganList.map((item) => {
              const keputusan = item.keputusan_bimbingan?.[0]
              return (
                <div key={item.id} className="bg-white rounded-xl border border-[#DAEAF7] p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-[#0C4A6E] text-sm">{item.topik}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {jenisBimbinganOptions.find(j => j.value === item.jenis_bimbingan)?.label}{' '}
                        — {dosenOptions.find(d => d.value === item.ditujukan_ke)?.label}{' '}
                        — {item.tanggal_bimbingan}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${statusColor[item.status]}`}>
                        {item.status}
                      </span>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-xs text-[#0891B2] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {item.deskripsi && (
                    <p className="text-xs text-[#64748B] mb-3">{item.deskripsi}</p>
                  )}

                  <div className="flex gap-3 mb-3">
                    <a
                      href={item.link_skripsi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0891B2] hover:underline"
                    >
                      📄 Link Skripsi
                    </a>
                    {item.link_lampiran && (
                      <a
                        href={item.link_lampiran}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#0891B2] hover:underline"
                      >
                        📎 Lampiran
                      </a>
                    )}
                  </div>

                  {keputusan && (
                    <div className="border-t border-[#F1F5F9] pt-3 mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${keputusanColor[keputusan.keputusan]}`}>
                          {keputusan.keputusan.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-[#94A3B8]">{keputusan.tanggal_keputusan}</span>
                      </div>
                      {keputusan.komentar && (
                        <p className="text-xs text-[#64748B] mt-1">{keputusan.komentar}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}