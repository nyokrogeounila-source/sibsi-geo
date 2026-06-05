'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

export default function ProfilMahasiswa() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [mahasiswa, setMahasiswa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const [nama, setNama] = useState('')
  const [noWa, setNoWa] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')

  useEffect(() => {
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

      setProfile(p)
      setMahasiswa(m)
      setNama(p?.nama || '')
      setNoWa(p?.no_wa || '')
      setFotoUrl(p?.foto_url || '')
      setLoading(false)
    }
    load()
  }, [])

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError('Gagal upload foto.')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    setFotoUrl(urlData.publicUrl)
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ nama, no_wa: noWa, foto_url: fotoUrl })
      .eq('id', user.id)

    if (updateError) {
      setError('Gagal menyimpan perubahan.')
    } else {
      setSuccess('Profil berhasil diperbarui.')
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

  return (
    <div className="flex min-h-screen">
      <Sidebar role="mahasiswa" nama={profile?.nama} foto_url={profile?.foto_url} />

      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Profil</h1>
        <p className="text-sm text-[#64748B] mb-8">Informasi akun dan data akademik Anda</p>

        {/* Foto */}
        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-6">
          <h2 className="font-semibold text-[#0C4A6E] mb-4">Foto Profil</h2>
          <div className="flex items-center gap-6">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="Foto profil"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#DAEAF7]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                <span className="text-3xl font-semibold text-[#0891B2]">
                  {nama.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <label className="cursor-pointer inline-block bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] text-xs font-medium px-4 py-2 rounded-lg transition">
                {uploading ? 'Mengupload...' : 'Ganti Foto'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFoto}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-[#94A3B8] mt-2">JPG, PNG maks. 2MB</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-6">
          <h2 className="font-semibold text-[#0C4A6E] mb-4">Data Diri</h2>

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
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#94A3B8] bg-[#F8FAFC] cursor-not-allowed"
              />
              <p className="text-xs text-[#94A3B8] mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">Nomor WhatsApp</label>
              <input
                type="text"
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        {/* Data Akademik */}
        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
          <h2 className="font-semibold text-[#0C4A6E] mb-4">Data Akademik</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-sm text-[#64748B]">NPM</span>
              <span className="text-sm font-medium text-[#334155]">{mahasiswa?.npm ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-sm text-[#64748B]">Angkatan</span>
              <span className="text-sm font-medium text-[#334155]">{mahasiswa?.angkatan ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-sm text-[#64748B]">Pembimbing 1</span>
              <span className="text-sm font-medium text-[#334155]">{mahasiswa?.pb1?.profiles?.nama ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-sm text-[#64748B]">Pembimbing 2</span>
              <span className="text-sm font-medium text-[#334155]">{mahasiswa?.pb2?.profiles?.nama ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-[#64748B]">Penguji</span>
              <span className="text-sm font-medium text-[#334155]">{mahasiswa?.penguji?.profiles?.nama ?? '—'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}