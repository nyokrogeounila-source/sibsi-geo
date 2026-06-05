'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

export default function AdminPengajuanJudul() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [pengajuanList, setPengajuanList] = useState<any[]>([])
  const [dosenList, setDosenList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const [judulDipilih, setJudulDipilih] = useState<number>(1)
  const [pb1Id, setPb1Id] = useState('')
  const [pb2Id, setPb2Id] = useState('')
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

    const { data: pj } = await supabase
      .from('pengajuan_judul')
      .select('*, mahasiswa:mahasiswa_id(npm, angkatan, profiles!mahasiswa_id_fkey(nama, foto_url))')
      .order('created_at', { ascending: false })

    const { data: dl } = await supabase
      .from('dosen')
      .select('id, nip, profiles!dosen_id_fkey(nama)')

    setProfile(p)
    setPengajuanList(pj || [])
    setDosenList(dl || [])
    setLoading(false)
  }

  function handleSelect(item: any) {
    setSelected(item)
    setJudulDipilih(item.judul_dipilih || 1)
    setPb1Id(item.pb1_id || '')
    setPb2Id(item.pb2_id || '')
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
      .from('pengajuan_judul')
      .update({
        judul_dipilih: judulDipilih,
        pb1_id: pb1Id || null,
        pb2_id: pb2Id || null,
        status,
        catatan_admin: catatanAdmin || null,
      })
      .eq('id', selected.id)

    if (updateError) {
      setError('Gagal menyimpan.')
      setSaving(false)
      return
    }

    // Update pb1, pb2 di tabel mahasiswa
    await supabase
      .from('mahasiswa')
      .update({
        pb1_id: pb1Id || null,
        pb2_id: pb2Id || null,
      })
      .eq('id', selected.mahasiswa_id)

    setSuccess('Pengajuan judul berhasil diperbarui.')
    await load()
    setSelected(null)
    setSaving(false)
  }

  const statusColor: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-700',
    disetujui: 'bg-green-100 text-green-700',
    ditolak: 'bg-red-100 text-red-700',
    revisi: 'bg-orange-100 text-orange-700',
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
      <Sidebar role="admin" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Pengajuan Judul</h1>
        <p className="text-sm text-[#64748B] mb-8">
          Review pengajuan judul skripsi dan tetapkan pembimbing
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daftar Pengajuan */}
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">
              Daftar Pengajuan
              <span className="ml-2 text-xs font-normal text-[#94A3B8]">
                ({pengajuanList.length} total)
              </span>
            </h2>
            <div className="space-y-3">
              {pengajuanList.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                  <p className="text-sm text-[#94A3B8]">Belum ada pengajuan judul</p>
                </div>
              ) : (
                pengajuanList.map((item) => {
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
                      <p className="text-xs text-[#64748B] line-clamp-1">
                        1. {item.judul_1}
                      </p>
                      <p className="text-xs text-[#64748B] line-clamp-1">
                        2. {item.judul_2}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Form Review */}
          <div>
            <h2 className="font-semibold text-[#0C4A6E] mb-4">Detail & Keputusan</h2>
            {!selected ? (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-8 text-center">
                <p className="text-sm text-[#94A3B8]">Pilih pengajuan di sebelah kiri</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
                {/* Detail Judul */}
                <div className="space-y-4 mb-6">
                  <div className="bg-[#F0F7FF] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-[#0891B2] rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <p className="text-sm font-medium text-[#0C4A6E]">{selected.judul_1}</p>
                    </div>
                    <p className="text-xs text-[#64748B] mb-1">
                      <span className="font-medium">Alasan:</span> {selected.alasan_judul_1}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      <span className="font-medium">Rumusan:</span> {selected.rumusan_masalah_1}
                    </p>
                  </div>

                  <div className="bg-[#F0F7FF] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-[#0369A1] rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <p className="text-sm font-medium text-[#0C4A6E]">{selected.judul_2}</p>
                    </div>
                    <p className="text-xs text-[#64748B] mb-1">
                      <span className="font-medium">Alasan:</span> {selected.alasan_judul_2}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      <span className="font-medium">Rumusan:</span> {selected.rumusan_masalah_2}
                    </p>
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
                      Judul yang Dipilih
                    </label>
                    <select
                      value={judulDipilih}
                      onChange={(e) => setJudulDipilih(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                    >
                      <option value={1}>Judul 1</option>
                      <option value={2}>Judul 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Pembimbing 1 <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={pb1Id}
                      onChange={(e) => setPb1Id(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                    >
                      <option value="">Pilih Pembimbing 1</option>
                      {dosenList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.profiles?.nama} — {d.nip}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#334155] mb-1.5">
                      Pembimbing 2{' '}
                      <span className="text-[#94A3B8] font-normal">(opsional)</span>
                    </label>
                    <select
                      value={pb2Id}
                      onChange={(e) => setPb2Id(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition bg-white"
                    >
                      <option value="">Tidak ada PB2</option>
                      {dosenList
                        .filter((d) => d.id !== pb1Id)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.profiles?.nama} — {d.nip}
                          </option>
                        ))}
                    </select>
                  </div>

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
                      <option value="revisi">Revisi</option>
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
                      {saving ? 'Menyimpan...' : 'Simpan Keputusan'}
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