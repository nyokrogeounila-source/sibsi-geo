'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

const jenisSeminarLabel: Record<string, string> = {
  proposal: 'Seminar Proposal',
  hasil: 'Seminar Hasil',
  komprehensif: 'Ujian Komprehensif',
}

export default function AdminJadwal() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [jadwalList, setJadwalList] = useState<any[]>([])
  const [dosenList, setDosenList] = useState<any[]>([])
  const [ruanganList, setRuanganList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [showRuanganForm, setShowRuanganForm] = useState(false)
  const [namaRuangan, setNamaRuangan] = useState('')
  const [filterStatus, setFilterStatus] = useState('menunggu')

  const [tanggalDisetujui, setTanggalDisetujui] = useState('')
  const [ruanganId, setRuanganId] = useState('')
  const [pengujiId, setPengujiId] = useState('')
  const [status, setStatus] = useState('disetujui')
  const [catatanAdmin, setCatatanAdmin] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: jl } = await supabase
      .from('jadwal_seminar')
      .select(`
        *,
        mahasiswa:mahasiswa_id(npm, angkatan, profiles!mahasiswa_id_fkey(nama, foto_url)),
        ruangan(*),
        pb1:pb1_id(id, profiles!dosen_id_fkey(nama)),
        pb2:pb2_id(id, profiles!dosen_id_fkey(nama)),
        penguji:penguji_id(id, profiles!dosen_id_fkey(nama))
      `)
      .order('created_at', { ascending: false })

    const { data: dl } = await supabase
      .from('dosen')
      .select('id, nip, profiles!dosen_id_fkey(nama)')

    const { data: rl } = await supabase
      .from('ruangan')
      .select('*')
      .order('nama_ruangan')

    setProfile(p)
    setJadwalList(jl || [])
    setDosenList(dl || [])
    setRuanganList(rl || [])
    setLoading(false)
  }

  function handleSelect(item: any) {
    setSelected(item)
    setTanggalDisetujui(item.tanggal_disetujui || item.tanggal_diajukan)
    setRuanganId(item.ruangan_id || '')
    setPengujiId(item.penguji_id || '')
    setStatus(item.status)
    setCatatanAdmin(item.catatan_admin || '')
    setSuccess('')
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('jadwal_seminar')
      .update({
        tanggal_disetujui: tanggalDisetujui || null,
        ruangan_id: ruanganId || null,
        penguji_id: pengujiId || null,
        status,
        catatan_admin: catatanAdmin || null,
      })
      .eq('id', selected.id)

    if (updateError) {
      setError('Gagal menyimpan.')
      setSaving(false)
      return
    }

    // Jika penguji ditetapkan, update di tabel mahasiswa
    if (pengujiId) {
      await supabase
        .from('mahasiswa')
        .update({ penguji_id: pengujiId })
        .eq('id', selected.mahasiswa_id)
    }

    setSuccess('Jadwal berhasil diperbarui.')
    await load()
    setSelected(null)
    setSaving(false)
  }

  async function handleTambahRuangan(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase
      .from('ruangan')
      .insert({ nama_ruangan: namaRuangan })

    if (!error) {
      setNamaRuangan('')
      setShowRuanganForm(false)
      await load()
    }
  }

  const statusColor: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-700',
    disetujui: 'bg-green-100 text-green-700',
    ditolak: 'bg-red-100 text-red-700',
  }

  const filtered = jadwalList.filter((j) =>
    filterStatus === 'semua' ? true : j.status === filterStatus
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
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#0C4A6E]">Pengaturan Jadwal</h1>
          <button
            onClick={() => setShowRuanganForm(!showRuanganForm)}
            className="text-xs bg-[#E0F2FE] text-[#0369A1] px-3 py-1.5 rounded-lg hover:bg-[#BAE6FD] transition"
          >
            + Tambah Ruangan
          </button>
        </div>
        <p className="text-sm text-[#64748B] mb-6">
          Setujui jadwal seminar dan tetapkan ruangan serta penguji
        </p>

        {/* Form Tambah Ruangan */}
        {showRuanganForm && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-4 mb-6">
            <form onSubmit={handleTambahRuangan} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#334155] mb-1.5">
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  value={namaRuangan}
                  onChange={(e) => setNamaRuangan(e.target.value)}
                  placeholder="Contoh: D4"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                />
              </div>
              <button
                type="submit"
                className="bg-[#0891B2] text-white text-sm px-4 py-2.5 rounded-lg hover:bg-[#0E7490] transition"
              >
                Tambah
              </button>
              <button
                type="button"
                onClick={() => setShowRuanganForm(false)}
                className="text-sm text-[#64748B] px-4 py-2.5 rounded-lg border border-[#DAEAF7] transition"
              >
                Batal
              </button>
            </form>
            <div className="flex gap-2 mt-3 flex-wrap">
              {ruanganList.map((r) => (
                <span key={r.id} className="text-xs bg-[#F0F7FF] text-[#0369A1] px-3 py-1 rounded-full border border-[#DAEAF7]">
                  {r.nama_ruangan}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['menunggu', 'disetujui', 'ditolak', 'semua'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition capitalize ${
                filterStatus === s
                  ? 'bg-[#0891B2] text-white border-[#0891B2]'
                  : 'bg-white text-[#64748B] border-[#DAEAF7] hover:border-[#0891B2]'
              }`}
            >
              {s}
              {s === 'menunggu' && (
                <span className="ml-1">
                  ({jadwalList.filter(j => j.status === 'menunggu').length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daftar Jadwal */}
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">
              Daftar Pengajuan
            </h2>
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                  <p className="text-sm text-[#94A3B8]">Tidak ada pengajuan jadwal</p>
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selected?.id === item.id
                  const nama = item.mahasiswa?.profiles?.nama ?? '—'
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#0891B2] shadow-sm'
                          : 'border-[#DAEAF7] hover:border-[#0891B2]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {item.mahasiswa?.profiles?.foto_url ? (
                            <img
                              src={item.mahasiswa.profiles.foto_url}
                              alt={nama}
                              className="w-9 h-9 rounded-full object-cover border border-[#DAEAF7]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                              <span className="text-[#0891B2] font-semibold text-sm">
                                {nama.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#0C4A6E]">{nama}</p>
                            <p className="text-xs text-[#94A3B8]">
                              {item.mahasiswa?.npm} · {item.mahasiswa?.angkatan}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full">
                          {jenisSeminarLabel[item.jenis_seminar]}
                        </span>
                        <span className="text-xs text-[#94A3B8]">
                          {item.tanggal_diajukan}
                        </span>
                      </div>
                      {item.ruangan && (
                        <p className="text-xs text-[#64748B] mt-1">
                          📍 {item.ruangan.nama_ruangan}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Form Keputusan */}
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">Detail & Keputusan</h2>
            {!selected ? (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                <p className="text-sm text-[#94A3B8]">Pilih pengajuan di sebelah kiri</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
                {/* Info Mahasiswa */}
                <div className="bg-[#F0F7FF] rounded-lg p-4 mb-5 space-y-2">
                  <p className="text-xs font-medium text-[#64748B]">Info Seminar</p>
                  <p className="text-sm font-medium text-[#0C4A6E]">
                    {jenisSeminarLabel[selected.jenis_seminar]}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#94A3B8]">Tanggal diusulkan</span>
                    <span className="text-xs text-[#334155]">{selected.tanggal_diajukan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#94A3B8]">PB1</span>
                    <span className="text-xs text-[#334155]">
                      {selected.pb1?.profiles?.nama ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#94A3B8]">PB2</span>
                    <span className="text-xs text-[#334155]">
                      {selected.pb2?.profiles?.nama ?? '—'}
                    </span>
                  </div>
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

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Tanggal Disetujui
                    </label>
                    <input
                      type="date"
                      value={tanggalDisetujui}
                      onChange={(e) => setTanggalDisetujui(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                    />
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Dapat diedit untuk keperluan administrasi akreditasi
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Ruangan
                    </label>
                    <select
                      value={ruanganId}
                      onChange={(e) => setRuanganId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                    >
                      <option value="">Pilih Ruangan</option>
                      {ruanganList.map((r) => (
                        <option key={r.id} value={r.id}>{r.nama_ruangan}</option>
                      ))}
                    </select>
                  </div>

                  {selected.jenis_seminar === 'proposal' && (
                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-1.5">
                        Dosen Penguji
                      </label>
                      <select
                        value={pengujiId}
                        onChange={(e) => setPengujiId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                      >
                        <option value="">Pilih Penguji</option>
                        {dosenList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.profiles?.nama} — {d.nip}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Penguji yang ditetapkan berlaku untuk semua seminar mahasiswa ini
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                    >
                      <option value="menunggu">Menunggu</option>
                      <option value="disetujui">Disetujui</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Catatan Admin{' '}
                      <span className="text-[#94A3B8] font-normal">(opsional)</span>
                    </label>
                    <textarea
                      value={catatanAdmin}
                      onChange={(e) => setCatatanAdmin(e.target.value)}
                      placeholder="Catatan untuk mahasiswa"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
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