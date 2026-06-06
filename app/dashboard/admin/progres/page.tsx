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

const keputusanOptions = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'revisi_minor', label: 'Revisi Minor' },
  { value: 'revisi_mayor', label: 'Revisi Mayor' },
]

const keputusanColor: Record<string, string> = {
  revisi_mayor: 'bg-red-100 text-red-700',
  revisi_minor: 'bg-orange-100 text-orange-700',
  accepted: 'bg-green-100 text-green-700',
}

export default function AdminProgresBimbingan() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [mahasiswaList, setMahasiswaList] = useState<any[]>([])
  const [dosenList, setDosenList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<any>(null)
  const [bimbinganList, setBimbinganList] = useState<any[]>([])
  const [loadingBimbingan, setLoadingBimbingan] = useState(false)
  const [showFormBimbingan, setShowFormBimbingan] = useState(false)
  const [showFormKeputusan, setShowFormKeputusan] = useState(false)
  const [selectedBimbingan, setSelectedBimbingan] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form bimbingan
  const [jenis, setJenis] = useState('proposal')
  const [dosenId, setDosenId] = useState('')
  const [ditujukan, setDitujukan] = useState('pb1')
  const [topik, setTopik] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [linkSkripsi, setLinkSkripsi] = useState('')
  const [linkLampiran, setLinkLampiran] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [editBimbinganId, setEditBimbinganId] = useState<string | null>(null)

  // Form keputusan
  const [keputusan, setKeputusan] = useState('accepted')
  const [komentar, setKomentar] = useState('')
  const [tanggalKeputusan, setTanggalKeputusan] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [linkBalasan, setLinkBalasan] = useState('')
  const [editKeputusanId, setEditKeputusanId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: ml } = await supabase
      .from('mahasiswa')
      .select('id, npm, angkatan, pb1_id, pb2_id, penguji_id')
      .order('angkatan', { ascending: false })

    const { data: dl } = await supabase
      .from('dosen')
      .select('id, nip')

    let mahasiswaWithProfiles: any[] = []
    if (ml && ml.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nama, foto_url')
        .in('id', ml.map(m => m.id))

      mahasiswaWithProfiles = ml.map(m => ({
        ...m,
        profiles: profiles?.find(p => p.id === m.id) || null,
      }))
    }

    let dosenWithProfiles: any[] = []
    if (dl && dl.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nama')
        .in('id', dl.map(d => d.id))

      dosenWithProfiles = dl.map(d => ({
        ...d,
        profiles: profiles?.find(p => p.id === d.id) || null,
      }))
    }

    setProfile(p)
    setMahasiswaList(mahasiswaWithProfiles)
    setDosenList(dosenWithProfiles)
    setLoading(false)
  }

  async function loadBimbingan(mahasiswaId: string) {
    setLoadingBimbingan(true)
    const { data: bl } = await supabase
      .from('bimbingan')
      .select('*, keputusan_bimbingan(*)')
      .eq('mahasiswa_id', mahasiswaId)
      .order('tanggal_bimbingan', { ascending: false })

    setBimbinganList(bl || [])
    setLoadingBimbingan(false)
  }

  function handleSelectMahasiswa(m: any) {
    setSelectedMahasiswa(m)
    setShowFormBimbingan(false)
    setShowFormKeputusan(false)
    setSelectedBimbingan(null)
    setSuccess('')
    setError('')
    loadBimbingan(m.id)
  }

  function resetFormBimbingan() {
    setJenis('proposal')
    setDosenId('')
    setDitujukan('pb1')
    setTopik('')
    setDeskripsi('')
    setLinkSkripsi('')
    setLinkLampiran('')
    setTanggal('')
    setEditBimbinganId(null)
  }

  function handleEditBimbingan(item: any) {
    setJenis(item.jenis_bimbingan)
    setDosenId(item.dosen_id)
    setDitujukan(item.ditujukan_ke)
    setTopik(item.topik)
    setDeskripsi(item.deskripsi || '')
    setLinkSkripsi(item.link_skripsi)
    setLinkLampiran(item.link_lampiran || '')
    setTanggal(item.tanggal_bimbingan)
    setEditBimbinganId(item.id)
    setShowFormBimbingan(true)
    setShowFormKeputusan(false)
  }

  function handleEditKeputusan(bimbingan: any) {
    setSelectedBimbingan(bimbingan)
    const existing = bimbingan.keputusan_bimbingan?.[0]
    if (existing) {
      setKeputusan(existing.keputusan)
      setKomentar(existing.komentar || '')
      setTanggalKeputusan(existing.tanggal_keputusan)
      setLinkBalasan(existing.link_balasan || '')
      setEditKeputusanId(existing.id)
    } else {
      setKeputusan('accepted')
      setKomentar('')
      setTanggalKeputusan(new Date().toISOString().split('T')[0])
      setLinkBalasan('')
      setEditKeputusanId(null)
    }
    setShowFormKeputusan(true)
    setShowFormBimbingan(false)
  }

  async function handleSubmitBimbingan(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      mahasiswa_id: selectedMahasiswa.id,
      jenis_bimbingan: jenis,
      ditujukan_ke: ditujukan,
      dosen_id: dosenId,
      topik,
      deskripsi,
      link_skripsi: linkSkripsi,
      link_lampiran: linkLampiran || null,
      tanggal_bimbingan: tanggal,
      status: 'menunggu',
    }

    let err
    if (editBimbinganId) {
      const { error: updateError } = await supabase
        .from('bimbingan').update(payload).eq('id', editBimbinganId)
      err = updateError
    } else {
      const { error: insertError } = await supabase
        .from('bimbingan').insert(payload)
      err = insertError
    }

    if (err) {
      setError('Gagal menyimpan bimbingan.')
    } else {
      setSuccess(editBimbinganId ? 'Bimbingan berhasil diperbarui.' : 'Bimbingan berhasil ditambahkan.')
      resetFormBimbingan()
      setShowFormBimbingan(false)
      await loadBimbingan(selectedMahasiswa.id)
    }
    setSaving(false)
  }

  async function handleSubmitKeputusan(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      bimbingan_id: selectedBimbingan.id,
      dosen_id: selectedBimbingan.dosen_id,
      keputusan,
      komentar,
      tanggal_keputusan: tanggalKeputusan,
      link_balasan: linkBalasan || null,
    }

    let err
    if (editKeputusanId) {
      const { error: updateError } = await supabase
        .from('keputusan_bimbingan').update(payload).eq('id', editKeputusanId)
      err = updateError
    } else {
      const { error: insertError } = await supabase
        .from('keputusan_bimbingan').insert(payload)
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
      setShowFormKeputusan(false)
      await loadBimbingan(selectedMahasiswa.id)
    }
    setSaving(false)
  }

  async function handleHapusBimbingan(id: string) {
    if (!confirm('Yakin hapus bimbingan ini?')) return
    await supabase.from('bimbingan').delete().eq('id', id)
    await loadBimbingan(selectedMahasiswa.id)
  }

  const filtered = mahasiswaList.filter(m =>
    m.profiles?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    m.npm?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F7FF]">
        <p className="text-sm text-[#64748B]">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Progres Bimbingan</h1>
        <p className="text-sm text-[#64748B] mb-6">
          Kelola data bimbingan seluruh mahasiswa
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daftar Mahasiswa */}
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NPM..."
              className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition mb-3"
            />
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMahasiswa(m)}
                  className={`bg-white rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedMahasiswa?.id === m.id
                      ? 'border-[#0891B2] shadow-sm'
                      : 'border-[#DAEAF7] hover:border-[#0891B2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m.profiles?.foto_url ? (
                      <img src={m.profiles.foto_url} alt={m.profiles?.nama}
                        className="w-8 h-8 rounded-full object-cover border border-[#DAEAF7]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0891B2] font-semibold text-xs">
                          {m.profiles?.nama?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0C4A6E] truncate">{m.profiles?.nama || '—'}</p>
                      <p className="text-xs text-[#94A3B8]">{m.npm} · {m.angkatan}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Bimbingan */}
          <div className="lg:col-span-2">
            {!selectedMahasiswa ? (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-16 text-center">
                <p className="text-sm text-[#94A3B8]">Pilih mahasiswa di sebelah kiri</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="bg-white rounded-xl border border-[#DAEAF7] p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedMahasiswa.profiles?.foto_url ? (
                      <img src={selectedMahasiswa.profiles.foto_url}
                        className="w-10 h-10 rounded-full object-cover border border-[#DAEAF7]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                        <span className="text-[#0891B2] font-semibold">
                          {selectedMahasiswa.profiles?.nama?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[#0C4A6E]">{selectedMahasiswa.profiles?.nama}</p>
                      <p className="text-xs text-[#94A3B8]">{selectedMahasiswa.npm} · {selectedMahasiswa.angkatan}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { resetFormBimbingan(); setShowFormBimbingan(true); setShowFormKeputusan(false) }}
                    className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-medium px-3 py-2 rounded-lg transition"
                  >
                    + Tambah Bimbingan
                  </button>
                </div>

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                {/* Form Tambah/Edit Bimbingan */}
                {showFormBimbingan && (
                  <div className="bg-white rounded-xl border border-[#DAEAF7] p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-[#0C4A6E]">
                        {editBimbinganId ? 'Edit Bimbingan' : 'Tambah Bimbingan'}
                      </h3>
                      <button onClick={() => { setShowFormBimbingan(false); resetFormBimbingan() }}
                        className="text-xs text-[#94A3B8] hover:text-[#64748B]">Batal</button>
                    </div>
                    <form onSubmit={handleSubmitBimbingan} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#334155] mb-1">Jenis Bimbingan</label>
                          <select value={jenis} onChange={(e) => setJenis(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                            {jenisBimbinganOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#334155] mb-1">Ditujukan Ke</label>
                          <select value={ditujukan} onChange={(e) => setDitujukan(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                            <option value="pb1">Pembimbing 1</option>
                            <option value="pb2">Pembimbing 2</option>
                            <option value="penguji">Penguji</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Dosen</label>
                        <select value={dosenId} onChange={(e) => setDosenId(e.target.value)} required
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                          <option value="">Pilih Dosen</option>
                          {dosenList.map(d => (
                            <option key={d.id} value={d.id}>{d.profiles?.nama} — {d.nip}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Topik</label>
                        <input type="text" value={topik} onChange={(e) => setTopik(e.target.value)} required
                          placeholder="Topik bimbingan"
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Deskripsi (opsional)</label>
                        <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)}
                          rows={2} placeholder="Deskripsi bimbingan"
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition resize-none" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#334155] mb-1">Link Skripsi</label>
                          <input type="url" value={linkSkripsi} onChange={(e) => setLinkSkripsi(e.target.value)} required
                            placeholder="https://drive.google.com/..."
                            className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#334155] mb-1">Link Lampiran (opsional)</label>
                          <input type="url" value={linkLampiran} onChange={(e) => setLinkLampiran(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Tanggal Bimbingan</label>
                        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={saving}
                          className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
                          {saving ? 'Menyimpan...' : editBimbinganId ? 'Perbarui' : 'Tambah'}
                        </button>
                        <button type="button" onClick={() => { setShowFormBimbingan(false); resetFormBimbingan() }}
                          className="text-xs text-[#64748B] px-4 py-2 rounded-lg border border-[#DAEAF7] transition">
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Form Keputusan */}
                {showFormKeputusan && selectedBimbingan && (
                  <div className="bg-white rounded-xl border border-[#0891B2] p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-[#0C4A6E]">
                        {editKeputusanId ? 'Edit Keputusan' : 'Tambah Keputusan'}
                      </h3>
                      <button onClick={() => setShowFormKeputusan(false)}
                        className="text-xs text-[#94A3B8] hover:text-[#64748B]">Batal</button>
                    </div>
                    <div className="bg-[#F0F7FF] rounded-lg p-3 mb-4">
                      <p className="text-xs text-[#64748B]">Bimbingan: <span className="font-medium text-[#0C4A6E]">{selectedBimbingan.topik}</span></p>
                    </div>
                    <form onSubmit={handleSubmitKeputusan} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Keputusan</label>
                        <select value={keputusan} onChange={(e) => setKeputusan(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                          {keputusanOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Komentar (opsional)</label>
                        <textarea value={komentar} onChange={(e) => setKomentar(e.target.value)}
                          rows={2} placeholder="Komentar dosen"
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Link Dokumen (opsional)</label>
                        <input type="url" value={linkBalasan} onChange={(e) => setLinkBalasan(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#334155] mb-1">Tanggal Keputusan</label>
                        <input type="date" value={tanggalKeputusan} onChange={(e) => setTanggalKeputusan(e.target.value)} required
                          className="w-full px-3 py-2 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                        <p className="text-xs text-[#94A3B8] mt-1">Dapat diedit untuk keperluan akreditasi</p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={saving}
                          className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
                          {saving ? 'Menyimpan...' : editKeputusanId ? 'Perbarui' : 'Simpan'}
                        </button>
                        <button type="button" onClick={() => setShowFormKeputusan(false)}
                          className="text-xs text-[#64748B] px-4 py-2 rounded-lg border border-[#DAEAF7] transition">
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Daftar Bimbingan */}
                {loadingBimbingan ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#64748B]">Memuat...</p>
                  </div>
                ) : bimbinganList.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                    <p className="text-sm text-[#94A3B8]">Belum ada bimbingan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bimbinganList.map((item) => {
                      const kpts = item.keputusan_bimbingan?.[0]
                      return (
                        <div key={item.id} className="bg-white rounded-xl border border-[#DAEAF7] p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-[#0C4A6E]">{item.topik}</p>
                              <p className="text-xs text-[#94A3B8] mt-0.5">
                                {jenisBimbinganOptions.find(j => j.value === item.jenis_bimbingan)?.label} · {item.tanggal_bimbingan}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
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
                          </div>

                          <div className="flex gap-3 mb-3">
                            <a href={item.link_skripsi} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#0891B2] hover:underline">📄 Skripsi</a>
                            {item.link_lampiran && (
                              <a href={item.link_lampiran} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-[#0891B2] hover:underline">📎 Lampiran</a>
                            )}
                          </div>

                          {kpts?.komentar && (
                            <p className="text-xs text-[#64748B] mb-2">💬 {kpts.komentar}</p>
                          )}

                          <div className="flex gap-2 pt-2 border-t border-[#F1F5F9]">
                            <button onClick={() => handleEditBimbingan(item)}
                              className="text-xs text-[#0891B2] hover:underline">Edit Bimbingan</button>
                            <button onClick={() => handleEditKeputusan(item)}
                              className="text-xs text-[#0891B2] hover:underline">
                              {kpts ? 'Edit Keputusan' : 'Tambah Keputusan'}
                            </button>
                            <button onClick={() => handleHapusBimbingan(item.id)}
                              className="text-xs text-red-500 hover:underline ml-auto">Hapus</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}