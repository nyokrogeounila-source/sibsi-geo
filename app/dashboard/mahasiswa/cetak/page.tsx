'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

export default function PersetujuanCetak() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [mahasiswa, setMahasiswa] = useState<any>(null)
  const [persetujuan, setPersetujuan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [linkSkripsi, setLinkSkripsi] = useState('')
  const [catatan, setCatatan] = useState('')

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

    const { data: m } = await supabase
      .from('mahasiswa')
      .select('*, pb1:pb1_id(id, profiles(nama)), pb2:pb2_id(id, profiles(nama)), penguji:penguji_id(id, profiles(nama))')
      .eq('id', user.id)
      .single()

    const { data: pc } = await supabase
      .from('persetujuan_cetak')
      .select('*')
      .eq('mahasiswa_id', user.id)
      .single()

    setProfile(p)
    setMahasiswa(m)
    setPersetujuan(pc)
    if (pc) {
      setLinkSkripsi(pc.link_skripsi || '')
      setCatatan(pc.catatan || '')
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      mahasiswa_id: user.id,
      link_skripsi: linkSkripsi,
      catatan,
      status_pb1: 'menunggu',
      status_pb2: 'menunggu',
      status_penguji: 'menunggu',
      status_akhir: 'menunggu',
    }

    let err
    if (persetujuan) {
      const { error: updateError } = await supabase
        .from('persetujuan_cetak')
        .update({ link_skripsi: linkSkripsi, catatan })
        .eq('id', persetujuan.id)
      err = updateError
    } else {
      const { error: insertError } = await supabase
        .from('persetujuan_cetak')
        .insert(payload)
      err = insertError
    }

    if (err) {
      setError('Gagal menyimpan pengajuan.')
    } else {
      setSuccess('Pengajuan persetujuan cetak berhasil dikirim.')
      setShowForm(false)
      await load()
    }

    setSaving(false)
  }

  const statusColor: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-700',
    disetujui: 'bg-green-100 text-green-700',
    ditolak: 'bg-red-100 text-red-700',
  }

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
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
      <Sidebar role="mahasiswa" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#0C4A6E]">Persetujuan Cetak Skripsi</h1>
          {!showForm && !persetujuan && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Ajukan Cetak
            </button>
          )}
        </div>
        <p className="text-sm text-[#64748B] mb-8">
          Pengajuan persetujuan cetak skripsi kepada pembimbing dan penguji
        </p>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-8">
            <h2 className="font-semibold text-[#0C4A6E] mb-5">Form Pengajuan Cetak</h2>

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
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">
                  Link Skripsi Final <span className="text-red-400">*</span>
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
                  Catatan <span className="text-[#94A3B8] font-normal">(opsional)</span>
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan untuk pembimbing dan penguji"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition resize-none"
                />
              </div>

              <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-[#64748B]">Persetujuan akan dikirim ke:</p>
                <div className="flex justify-between">
                  <span className="text-xs text-[#94A3B8]">Pembimbing 1</span>
                  <span className="text-xs text-[#334155]">{mahasiswa?.pb1?.profiles?.nama ?? '—'}</span>
                </div>
                {mahasiswa?.pb2_id && (
                  <div className="flex justify-between">
                    <span className="text-xs text-[#94A3B8]">Pembimbing 2</span>
                    <span className="text-xs text-[#334155]">{mahasiswa?.pb2?.profiles?.nama ?? '—'}</span>
                  </div>
                )}
                {mahasiswa?.penguji_id && (
                  <div className="flex justify-between">
                    <span className="text-xs text-[#94A3B8]">Penguji</span>
                    <span className="text-xs text-[#334155]">{mahasiswa?.penguji?.profiles?.nama ?? '—'}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60"
                >
                  {saving ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-[#64748B] px-4 py-2.5 rounded-lg border border-[#DAEAF7] hover:border-[#0891B2] transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status Persetujuan */}
        {persetujuan && (
          <div className="space-y-4">
            {/* Status Akhir */}
            <div className={`rounded-xl p-5 border ${
              persetujuan.status_akhir === 'disetujui'
                ? 'bg-green-50 border-green-200'
                : persetujuan.status_akhir === 'ditolak'
                ? 'bg-red-50 border-red-200'
                : 'bg-[#E0F2FE] border-[#DAEAF7]'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0C4A6E]">Status Akhir</p>
                <StatusBadge status={persetujuan.status_akhir} />
              </div>
              {persetujuan.link_skripsi && (
                <a
                  href={persetujuan.link_skripsi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0891B2] hover:underline mt-2 inline-block"
                >
                  📄 Lihat Skripsi Final
                </a>
              )}
            </div>

            {/* Detail per Dosen */}
            <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
              <h2 className="font-semibold text-[#0C4A6E] mb-4">Detail Persetujuan</h2>
              <div className="space-y-4">

                {/* PB1 */}
                <div className="flex items-start justify-between py-3 border-b border-[#F1F5F9]">
                  <div>
                    <p className="text-sm font-medium text-[#334155]">Pembimbing 1</p>
                    <p className="text-xs text-[#94A3B8]">{mahasiswa?.pb1?.profiles?.nama ?? '—'}</p>
                    {persetujuan.catatan_pb1 && (
                      <p className="text-xs text-[#64748B] mt-1">{persetujuan.catatan_pb1}</p>
                    )}
                    {persetujuan.tanggal_pb1 && (
                      <p className="text-xs text-[#94A3B8] mt-0.5">{persetujuan.tanggal_pb1}</p>
                    )}
                  </div>
                  <StatusBadge status={persetujuan.status_pb1} />
                </div>

                {/* PB2 */}
                {mahasiswa?.pb2_id && (
                  <div className="flex items-start justify-between py-3 border-b border-[#F1F5F9]">
                    <div>
                      <p className="text-sm font-medium text-[#334155]">Pembimbing 2</p>
                      <p className="text-xs text-[#94A3B8]">{mahasiswa?.pb2?.profiles?.nama ?? '—'}</p>
                      {persetujuan.catatan_pb2 && (
                        <p className="text-xs text-[#64748B] mt-1">{persetujuan.catatan_pb2}</p>
                      )}
                      {persetujuan.tanggal_pb2 && (
                        <p className="text-xs text-[#94A3B8] mt-0.5">{persetujuan.tanggal_pb2}</p>
                      )}
                    </div>
                    <StatusBadge status={persetujuan.status_pb2} />
                  </div>
                )}

                {/* Penguji */}
                {mahasiswa?.penguji_id && (
                  <div className="flex items-start justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-[#334155]">Penguji</p>
                      <p className="text-xs text-[#94A3B8]">{mahasiswa?.penguji?.profiles?.nama ?? '—'}</p>
                      {persetujuan.catatan_penguji && (
                        <p className="text-xs text-[#64748B] mt-1">{persetujuan.catatan_penguji}</p>
                      )}
                      {persetujuan.tanggal_penguji && (
                        <p className="text-xs text-[#94A3B8] mt-0.5">{persetujuan.tanggal_penguji}</p>
                      )}
                    </div>
                    <StatusBadge status={persetujuan.status_penguji} />
                  </div>
                )}
              </div>
            </div>

            {/* Edit Link */}
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-[#0891B2] hover:underline"
            >
              Perbarui link skripsi atau catatan →
            </button>
          </div>
        )}

        {!persetujuan && !showForm && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-10 text-center">
            <p className="text-sm text-[#94A3B8]">Belum ada pengajuan persetujuan cetak</p>
          </div>
        )}
      </main>
    </div>
  )
}