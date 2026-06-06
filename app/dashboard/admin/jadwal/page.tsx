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
  const [mahasiswaList, setMahasiswaList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [showRuanganForm, setShowRuanganForm] = useState(false)
  const [showTambahJadwal, setShowTambahJadwal] = useState(false)
  const [namaRuangan, setNamaRuangan] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')

  // Form edit jadwal
  const [tanggalDisetujui, setTanggalDisetujui] = useState('')
  const [jamDisetujui, setJamDisetujui] = useState('')
  const [ruanganId, setRuanganId] = useState('')
  const [pengujiId, setPengujiId] = useState('')
  const [status, setStatus] = useState('disetujui')
  const [catatanAdmin, setCatatanAdmin] = useState('')

  // Form tambah jadwal manual
  const [mhsId, setMhsId] = useState('')
  const [jenisSeminar, setJenisSeminar] = useState('proposal')
  const [tanggalManual, setTanggalManual] = useState('')
  const [jamManual, setJamManual] = useState('')
  const [ruanganManual, setRuanganManual] = useState('')
  const [pb1Manual, setPb1Manual] = useState('')
  const [pb2Manual, setPb2Manual] = useState('')
  const [pengujiManual, setPengujiManual] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: jl } = await supabase
      .from('jadwal_seminar')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: dl } = await supabase
      .from('dosen').select('id, nip')

    const { data: rl } = await supabase
      .from('ruangan').select('*').order('nama_ruangan')

    const { data: ml } = await supabase
      .from('mahasiswa').select('id, npm, angkatan')
      .order('angkatan', { ascending: false })

    // Ambil nama mahasiswa
    let jadwalWithNama: any[] = []
    if (jl && jl.length > 0) {
      const mhsIds = jl.map(j => j.mahasiswa_id)
      const ruanganIds = jl.filter(j => j.ruangan_id).map(j => j.ruangan_id)

      const { data: profilesMhs } = await supabase
        .from('profiles').select('id, nama, foto_url').in('id', mhsIds)

      const { data: ruanganData } = ruanganIds.length > 0
        ? await supabase.from('ruangan').select('id, nama_ruangan').in('id', ruanganIds)
        : { data: [] }

      jadwalWithNama = jl.map(j => ({
        ...j,
        mahasiswaNama: profilesMhs?.find(p => p.id === j.mahasiswa_id)?.nama ?? '—',
        mahasiswaFoto: profilesMhs?.find(p => p.id === j.mahasiswa_id)?.foto_url ?? null,
        ruanganNama: ruanganData?.find(r => r.id === j.ruangan_id)?.nama_ruangan ?? null,
      }))
    }

    let dosenWithProfiles: any[] = []
    if (dl && dl.length > 0) {
      const { data: profilesDosen } = await supabase
        .from('profiles').select('id, nama').in('id', dl.map(d => d.id))
      dosenWithProfiles = dl.map(d => ({
        ...d,
        profiles: profilesDosen?.find(p => p.id === d.id) || null,
      }))
    }

    let mahasiswaWithProfiles: any[] = []
    if (ml && ml.length > 0) {
      const { data: profilesMhs } = await supabase
        .from('profiles').select('id, nama').in('id', ml.map(m => m.id))
      mahasiswaWithProfiles = ml.map(m => ({
        ...m,
        profiles: profilesMhs?.find(p => p.id === m.id) || null,
      }))
    }

    setProfile(p)
    setJadwalList(jadwalWithNama)
    setDosenList(dosenWithProfiles)
    setRuanganList(rl || [])
    setMahasiswaList(mahasiswaWithProfiles)
    setLoading(false)
  }

  function handleSelect(item: any) {
    setSelected(item)
    setTanggalDisetujui(item.tanggal_disetujui || item.tanggal_diajukan || '')
    setJamDisetujui(item.jam || '')
    setRuanganId(item.ruangan_id || '')
    setPengujiId(item.penguji_id || '')
    setStatus(item.status)
    setCatatanAdmin(item.catatan_admin || '')
    setSuccess('')
    setError('')
    setShowTambahJadwal(false)
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
        jam: jamDisetujui || null,
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

    if (pengujiId && selected.jenis_seminar === 'proposal') {
      await supabase.from('mahasiswa')
        .update({ penguji_id: pengujiId })
        .eq('id', selected.mahasiswa_id)
    }

    setSuccess('Jadwal berhasil diperbarui.')
    setSelected(null)
    await load()
    setSaving(false)
  }

  async function handleHapus(id: string) {
    if (!confirm('Yakin hapus jadwal ini?')) return
    await supabase.from('jadwal_seminar').delete().eq('id', id)
    setSelected(null)
    await load()
  }

  async function handleTambahJadwalManual(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { error: insertError } = await supabase
      .from('jadwal_seminar')
      .insert({
        mahasiswa_id: mhsId,
        jenis_seminar: jenisSeminar,
        tanggal_diajukan: tanggalManual,
        tanggal_disetujui: tanggalManual,
        jam: jamManual || null,
        ruangan_id: ruanganManual || null,
        pb1_id: pb1Manual || null,
        pb2_id: pb2Manual || null,
        penguji_id: pengujiManual || null,
        status: 'disetujui',
      })

    if (insertError) {
      setError('Gagal menambah jadwal: ' + insertError.message)
      setSaving(false)
      return
    }

    if (pengujiManual) {
      await supabase.from('mahasiswa')
        .update({ penguji_id: pengujiManual })
        .eq('id', mhsId)
    }

    setSuccess('Jadwal berhasil ditambahkan.')
    setShowTambahJadwal(false)
    setMhsId('')
    setJenisSeminar('proposal')
    setTanggalManual('')
    setJamManual('')
    setRuanganManual('')
    setPb1Manual('')
    setPb2Manual('')
    setPengujiManual('')
    await load()
    setSaving(false)
  }

  async function handleTambahRuangan(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase
      .from('ruangan').insert({ nama_ruangan: namaRuangan })
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowRuanganForm(!showRuanganForm)}
              className="text-xs bg-[#E0F2FE] text-[#0369A1] px-3 py-1.5 rounded-lg hover:bg-[#BAE6FD] transition"
            >
              + Tambah Ruangan
            </button>
            <button
              onClick={() => { setShowTambahJadwal(!showTambahJadwal); setSelected(null) }}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              + Jadwal Manual
            </button>
          </div>
        </div>
        <p className="text-sm text-[#64748B] mb-6">
          Kelola jadwal seminar mahasiswa
        </p>

        {/* Form Tambah Ruangan */}
        {showRuanganForm && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-4 mb-6">
            <form onSubmit={handleTambahRuangan} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Nama Ruangan</label>
                <input type="text" value={namaRuangan} onChange={(e) => setNamaRuangan(e.target.value)}
                  placeholder="Contoh: D4" required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
              </div>
              <button type="submit" className="bg-[#0891B2] text-white text-sm px-4 py-2.5 rounded-lg hover:bg-[#0E7490] transition">Tambah</button>
              <button type="button" onClick={() => setShowRuanganForm(false)}
                className="text-sm text-[#64748B] px-4 py-2.5 rounded-lg border border-[#DAEAF7] transition">Batal</button>
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

        {/* Form Tambah Jadwal Manual */}
        {showTambahJadwal && (
          <div className="bg-white rounded-xl border border-[#0891B2] p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0C4A6E]">Tambah Jadwal Manual</h2>
              <button onClick={() => setShowTambahJadwal(false)}
                className="text-xs text-[#94A3B8] hover:text-[#64748B]">Batal</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

            <form onSubmit={handleTambahJadwalManual} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Mahasiswa</label>
                <select value={mhsId} onChange={(e) => setMhsId(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                  <option value="">Pilih Mahasiswa</option>
                  {mahasiswaList.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.profiles?.nama} — {m.npm} ({m.angkatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Jenis Seminar</label>
                <select value={jenisSeminar} onChange={(e) => setJenisSeminar(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                  <option value="proposal">Seminar Proposal</option>
                  <option value="hasil">Seminar Hasil</option>
                  <option value="komprehensif">Ujian Komprehensif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Tanggal</label>
                <input type="date" value={tanggalManual} onChange={(e) => setTanggalManual(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">
                  Jam <span className="text-[#94A3B8] font-normal">(opsional)</span>
                </label>
                <input type="time" value={jamManual} onChange={(e) => setJamManual(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Ruangan</label>
                <select value={ruanganManual} onChange={(e) => setRuanganManual(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                  <option value="">Pilih Ruangan</option>
                  {ruanganList.map(r => (
                    <option key={r.id} value={r.id}>{r.nama_ruangan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Pembimbing 1</label>
                <select value={pb1Manual} onChange={(e) => setPb1Manual(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                  <option value="">Pilih PB1</option>
                  {dosenList.map(d => (
                    <option key={d.id} value={d.id}>{d.profiles?.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Pembimbing 2 (opsional)</label>
                <select value={pb2Manual} onChange={(e) => setPb2Manual(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                  <option value="">Tidak ada</option>
                  {dosenList.filter(d => d.id !== pb1Manual).map(d => (
                    <option key={d.id} value={d.id}>{d.profiles?.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Penguji (opsional)</label>
                <select value={pengujiManual} onChange={(e) => setPengujiManual(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                  <option value="">Pilih Penguji</option>
                  {dosenList.map(d => (
                    <option key={d.id} value={d.id}>{d.profiles?.nama}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <button type="submit" disabled={saving}
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
                  {saving ? 'Menyimpan...' : 'Tambah Jadwal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['semua', 'menunggu', 'disetujui', 'ditolak'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition capitalize ${
                filterStatus === s
                  ? 'bg-[#0891B2] text-white border-[#0891B2]'
                  : 'bg-white text-[#64748B] border-[#DAEAF7] hover:border-[#0891B2]'
              }`}
            >
              {s}
              {s === 'menunggu' && (
                <span className="ml-1">({jadwalList.filter(j => j.status === 'menunggu').length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daftar Jadwal */}
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">Daftar Jadwal</h2>
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                  <p className="text-sm text-[#94A3B8]">Tidak ada jadwal</p>
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selected?.id === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                        isSelected ? 'border-[#0891B2] shadow-sm' : 'border-[#DAEAF7] hover:border-[#0891B2]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {item.mahasiswaFoto ? (
                            <img src={item.mahasiswaFoto} alt={item.mahasiswaNama}
                              className="w-9 h-9 rounded-full object-cover border border-[#DAEAF7]" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                              <span className="text-[#0891B2] font-semibold text-sm">
                                {item.mahasiswaNama?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#0C4A6E]">{item.mahasiswaNama}</p>
                            <p className="text-xs text-[#94A3B8]">{item.tanggal_disetujui || item.tanggal_diajukan}</p>
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
                        <div className="flex items-center gap-2">
                          {item.jam && (
                            <span className="text-xs text-[#64748B]">🕐 {item.jam}</span>
                          )}
                          {item.ruanganNama && (
                            <span className="text-xs text-[#64748B]">📍 {item.ruanganNama}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Form Edit */}
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">Detail & Edit</h2>
            {!selected ? (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                <p className="text-sm text-[#94A3B8]">Pilih jadwal di sebelah kiri</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
                <div className="bg-[#F0F7FF] rounded-lg p-4 mb-5 space-y-2">
                  <p className="text-xs font-medium text-[#64748B]">Info Seminar</p>
                  <p className="text-sm font-medium text-[#0C4A6E]">
                    {jenisSeminarLabel[selected.jenis_seminar]}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#94A3B8]">Mahasiswa</span>
                    <span className="text-xs text-[#334155]">{selected.mahasiswaNama}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#94A3B8]">Tanggal diajukan</span>
                    <span className="text-xs text-[#334155]">{selected.tanggal_diajukan}</span>
                  </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-1.5">Tanggal Disetujui</label>
                      <input type="date" value={tanggalDisetujui} onChange={(e) => setTanggalDisetujui(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-1.5">
                        Jam <span className="text-[#94A3B8] font-normal">(opsional)</span>
                      </label>
                      <input type="time" value={jamDisetujui} onChange={(e) => setJamDisetujui(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">Ruangan</label>
                    <select value={ruanganId} onChange={(e) => setRuanganId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                      <option value="">Pilih Ruangan</option>
                      {ruanganList.map(r => (
                        <option key={r.id} value={r.id}>{r.nama_ruangan}</option>
                      ))}
                    </select>
                  </div>

                  {selected.jenis_seminar === 'proposal' && (
                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-1.5">Dosen Penguji</label>
                      <select value={pengujiId} onChange={(e) => setPengujiId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                        <option value="">Pilih Penguji</option>
                        {dosenList.map(d => (
                          <option key={d.id} value={d.id}>{d.profiles?.nama} — {d.nip}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] transition bg-white">
                      <option value="menunggu">Menunggu</option>
                      <option value="disetujui">Disetujui</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Catatan Admin <span className="text-[#94A3B8] font-normal">(opsional)</span>
                    </label>
                    <textarea value={catatanAdmin} onChange={(e) => setCatatanAdmin(e.target.value)}
                      placeholder="Catatan untuk mahasiswa" rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] transition resize-none" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button type="button" onClick={() => setSelected(null)}
                      className="text-sm text-[#64748B] px-4 py-2.5 rounded-lg border border-[#DAEAF7] hover:border-[#0891B2] transition">
                      Batal
                    </button>
                    <button type="button" onClick={() => handleHapus(selected.id)}
                      className="text-sm text-red-500 px-4 py-2.5 rounded-lg border border-red-200 hover:bg-red-50 transition ml-auto">
                      Hapus
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