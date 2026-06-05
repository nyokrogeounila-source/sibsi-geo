'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

export default function PengajuanJudul() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [pengajuan, setPengajuan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [judul1, setJudul1] = useState('')
  const [alasan1, setAlasan1] = useState('')
  const [rumusan1, setRumusan1] = useState('')
  const [judul2, setJudul2] = useState('')
  const [alasan2, setAlasan2] = useState('')
  const [rumusan2, setRumusan2] = useState('')

  useEffect(() => {
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
        .select('*')
        .eq('mahasiswa_id', user.id)
        .single()

      setProfile(p)
      setPengajuan(pj)

      if (pj) {
        setJudul1(pj.judul_1 || '')
        setAlasan1(pj.alasan_judul_1 || '')
        setRumusan1(pj.rumusan_masalah_1 || '')
        setJudul2(pj.judul_2 || '')
        setAlasan2(pj.alasan_judul_2 || '')
        setRumusan2(pj.rumusan_masalah_2 || '')
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      mahasiswa_id: user.id,
      judul_1: judul1,
      alasan_judul_1: alasan1,
      rumusan_masalah_1: rumusan1,
      judul_2: judul2,
      alasan_judul_2: alasan2,
      rumusan_masalah_2: rumusan2,
      status: 'menunggu',
    }

    let err
    if (pengajuan) {
      const { error: updateError } = await supabase
        .from('pengajuan_judul')
        .update(payload)
        .eq('id', pengajuan.id)
      err = updateError
    } else {
      const { error: insertError } = await supabase
        .from('pengajuan_judul')
        .insert(payload)
      err = insertError
    }

    if (err) {
      setError('Gagal menyimpan pengajuan.')
    } else {
      setSuccess('Pengajuan judul berhasil disimpan.')
      const { data: pj } = await supabase
        .from('pengajuan_judul')
        .select('*')
        .eq('mahasiswa_id', user.id)
        .single()
      setPengajuan(pj)
    }

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
      <Sidebar role="mahasiswa" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#0C4A6E]">Pengajuan Judul</h1>
          {pengajuan && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[pengajuan.status]}`}>
              {pengajuan.status.charAt(0).toUpperCase() + pengajuan.status.slice(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-[#64748B] mb-8">
          Ajukan dua judul skripsi beserta alasan dan rumusan masalah
        </p>

        {/* Catatan Admin */}
        {pengajuan?.catatan_admin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-5 py-4 mb-6">
            <p className="font-medium mb-1">Catatan dari Admin:</p>
            <p>{pengajuan.catatan_admin}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4 mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-5 py-4 mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Judul 1 */}
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-[#0891B2] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <h2 className="font-semibold text-[#0C4A6E]">Judul Pertama</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Judul Skripsi</label>
                <input
                  type="text"
                  value={judul1}
                  onChange={(e) => setJudul1(e.target.value)}
                  placeholder="Masukkan judul skripsi pertama"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Alasan Pemilihan Judul</label>
                <textarea
                  value={alasan1}
                  onChange={(e) => setAlasan1(e.target.value)}
                  placeholder="Jelaskan alasan memilih judul ini"
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Rumusan Masalah</label>
                <textarea
                  value={rumusan1}
                  onChange={(e) => setRumusan1(e.target.value)}
                  placeholder="Tuliskan rumusan masalah penelitian"
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Judul 2 */}
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-[#0369A1] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <h2 className="font-semibold text-[#0C4A6E]">Judul Kedua</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Judul Skripsi</label>
                <input
                  type="text"
                  value={judul2}
                  onChange={(e) => setJudul2(e.target.value)}
                  placeholder="Masukkan judul skripsi kedua"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Alasan Pemilihan Judul</label>
                <textarea
                  value={alasan2}
                  onChange={(e) => setAlasan2(e.target.value)}
                  placeholder="Jelaskan alasan memilih judul ini"
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Rumusan Masalah</label>
                <textarea
                  value={rumusan2}
                  onChange={(e) => setRumusan2(e.target.value)}
                  placeholder="Tuliskan rumusan masalah penelitian"
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || pengajuan?.status === 'disetujui'}
            className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-8 py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : pengajuan ? 'Perbarui Pengajuan' : 'Kirim Pengajuan'}
          </button>
          {pengajuan?.status === 'disetujui' && (
            <p className="text-xs text-[#64748B] mt-2">
              Pengajuan sudah disetujui dan tidak dapat diubah.
            </p>
          )}
        </form>
      </main>
    </div>
  )
}