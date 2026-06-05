'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default function AdminPengguna() {
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [mahasiswaList, setMahasiswaList] = useState<any[]>([])
  const [dosenList, setDosenList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'mahasiswa' | 'dosen'>('mahasiswa')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [search, setSearch] = useState('')

  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [npm, setNpm] = useState('')
  const [angkatan, setAngkatan] = useState('')
  const [noWa, setNoWa] = useState('')
  const [namaDosen, setNamaDosen] = useState('')
  const [passwordDosen, setPasswordDosen] = useState('')
  const [nip, setNip] = useState('')
  const [noWaDosen, setNoWaDosen] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: ml } = await supabase
      .from('mahasiswa')
      .select('id, npm, angkatan')
      .order('angkatan', { ascending: false })

    const { data: dl } = await supabase
      .from('dosen')
      .select('id, nip')

    let mahasiswaWithProfiles: any[] = []
    let dosenWithProfiles: any[] = []

    if (ml && ml.length > 0) {
      const mahasiswaIds = ml.map(m => m.id)
      const { data: profilesMhs } = await supabase
        .from('profiles')
        .select('id, nama, email, no_wa, foto_url')
        .in('id', mahasiswaIds)

      mahasiswaWithProfiles = ml.map(m => ({
        ...m,
        profiles: profilesMhs?.find(pr => pr.id === m.id) || null
      }))
    }

    if (dl && dl.length > 0) {
      const dosenIds = dl.map(d => d.id)
      const { data: profilesDosen } = await supabase
        .from('profiles')
        .select('id, nama, email, no_wa, foto_url')
        .in('id', dosenIds)

      dosenWithProfiles = dl.map(d => ({
        ...d,
        profiles: profilesDosen?.find(pr => pr.id === d.id) || null
      }))
    }

    setProfile(p)
    setMahasiswaList(mahasiswaWithProfiles)
    setDosenList(dosenWithProfiles)
    setLoading(false)
  }

  function resetForm() {
    setNama(''); setPassword(''); setNpm('')
    setAngkatan(''); setNoWa('')
    setNamaDosen(''); setPasswordDosen('')
    setNip(''); setNoWaDosen('')
    setEditItem(null)
  }

  function handleEditMahasiswa(item: any) {
    setEditItem(item)
    setNama(item.profiles?.nama || '')
    setNpm(item.npm || '')
    setAngkatan(item.angkatan?.toString() || '')
    setNoWa(item.profiles?.no_wa || '')
    setPassword('')
    setShowForm(true)
    setActiveTab('mahasiswa')
  }

  function handleEditDosen(item: any) {
    setEditItem(item)
    setNamaDosen(item.profiles?.nama || '')
    setNip(item.nip || '')
    setNoWaDosen(item.profiles?.no_wa || '')
    setPasswordDosen('')
    setShowForm(true)
    setActiveTab('dosen')
  }

  async function handleSubmitMahasiswa(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (editItem) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nama, no_wa: noWa })
        .eq('id', editItem.id)

      const { error: mError } = await supabase
        .from('mahasiswa')
        .update({ npm, angkatan: parseInt(angkatan) })
        .eq('id', editItem.id)

      if (profileError || mError) {
        setError('Gagal memperbarui data.')
        setSaving(false)
        return
      }

      if (password) {
        await fetch('/api/admin/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: editItem.id, password }),
        })
      }
      setSuccess('Data mahasiswa berhasil diperbarui.')
    } else {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'mahasiswa', nama, npm,
          angkatan: parseInt(angkatan), no_wa: noWa, password,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Gagal membuat akun.')
        setSaving(false)
        return
      }
      setSuccess('Akun mahasiswa berhasil dibuat.')
    }

    resetForm()
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function handleSubmitDosen(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (editItem) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nama: namaDosen, no_wa: noWaDosen })
        .eq('id', editItem.id)

      const { error: dError } = await supabase
        .from('dosen')
        .update({ nip })
        .eq('id', editItem.id)

      if (profileError || dError) {
        setError('Gagal memperbarui data.')
        setSaving(false)
        return
      }

      if (passwordDosen) {
        await fetch('/api/admin/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: editItem.id, password: passwordDosen }),
        })
      }
      setSuccess('Data dosen berhasil diperbarui.')
    } else {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'dosen', nama: namaDosen,
          nip, no_wa: noWaDosen, password: passwordDosen,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Gagal membuat akun.')
        setSaving(false)
        return
      }
      setSuccess('Akun dosen berhasil dibuat.')
    }

    resetForm()
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function handleLoginAs(userId: string) {
    const res = await fetch('/api/admin/login-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const result = await res.json()
    if (result.url) {
      window.location.href = result.url
    } else {
      setError('Gagal login sebagai user ini.')
    }
  }

  const filteredMahasiswa = mahasiswaList.filter(m =>
    m.profiles?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    m.npm?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredDosen = dosenList.filter(d =>
    d.profiles?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    d.nip?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-bold text-[#0C4A6E]">Pengguna</h1>
          <div className="flex gap-2">
            <Link
              href="/dashboard/admin/pengguna/import"
              className="text-sm bg-[#E0F2FE] text-[#0369A1] px-4 py-2 rounded-lg hover:bg-[#BAE6FD] transition"
            >
              ⬆️ Import Excel
            </Link>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Tambah Pengguna
            </button>
          </div>
        </div>
        <p className="text-sm text-[#64748B] mb-6">Kelola akun mahasiswa dan dosen</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['mahasiswa', 'dosen'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch('') }}
              className={`text-sm px-4 py-2 rounded-lg border transition capitalize ${
                activeTab === tab
                  ? 'bg-[#0891B2] text-white border-[#0891B2]'
                  : 'bg-white text-[#64748B] border-[#DAEAF7] hover:border-[#0891B2]'
              }`}
            >
              {tab} ({tab === 'mahasiswa' ? mahasiswaList.length : dosenList.length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'mahasiswa' ? 'Cari nama atau NPM...' : 'Cari nama atau NIP...'}
            className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
          />
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#0C4A6E]">
                {editItem ? 'Edit' : 'Tambah'} {activeTab === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'}
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

            {activeTab === 'mahasiswa' ? (
              <form onSubmit={handleSubmitMahasiswa} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">Nama Lengkap</label>
                  <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">NPM</label>
                  <input type="text" value={npm} onChange={(e) => setNpm(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">Angkatan</label>
                  <input type="number" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} placeholder="2021" required
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">No. WhatsApp</label>
                  <input type="text" value={noWa} onChange={(e) => setNoWa(e.target.value)} placeholder="08123456789"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">
                    Password {editItem && <span className="text-[#94A3B8] font-normal">(kosongkan jika tidak diubah)</span>}
                  </label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required={!editItem} placeholder={editItem ? 'Password baru (opsional)' : 'Password'}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div className="col-span-2">
                  <button type="submit" disabled={saving}
                    className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
                    {saving ? 'Menyimpan...' : editItem ? 'Perbarui' : 'Buat Akun'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitDosen} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">Nama Lengkap</label>
                  <input type="text" value={namaDosen} onChange={(e) => setNamaDosen(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">NIP</label>
                  <input type="text" value={nip} onChange={(e) => setNip(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">No. WhatsApp</label>
                  <input type="text" value={noWaDosen} onChange={(e) => setNoWaDosen(e.target.value)} placeholder="08123456789"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">
                    Password {editItem && <span className="text-[#94A3B8] font-normal">(kosongkan jika tidak diubah)</span>}
                  </label>
                  <input type="password" value={passwordDosen} onChange={(e) => setPasswordDosen(e.target.value)}
                    required={!editItem} placeholder={editItem ? 'Password baru (opsional)' : 'Password'}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition" />
                </div>
                <div className="col-span-2">
                  <button type="submit" disabled={saving}
                    className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-60">
                    {saving ? 'Menyimpan...' : editItem ? 'Perbarui' : 'Buat Akun'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {success && !showForm && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-5 py-4 mb-6">
            {success}
          </div>
        )}

        {/* Tabel Mahasiswa */}
        {activeTab === 'mahasiswa' && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] overflow-hidden">
            <div className="p-4 border-b border-[#DAEAF7] flex items-center justify-between">
              <p className="text-sm font-medium text-[#0C4A6E]">
                Daftar Mahasiswa ({filteredMahasiswa.length} dari {mahasiswaList.length})
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">Mahasiswa</th>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">NPM</th>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">Angkatan</th>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">WhatsApp</th>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredMahasiswa.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-4 py-3">
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
                          <div>
                            <p className="text-sm font-medium text-[#334155]">{m.profiles?.nama || '—'}</p>
                            <p className="text-xs text-[#94A3B8]">{m.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{m.npm}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{m.angkatan}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{m.profiles?.no_wa ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditMahasiswa(m)}
                            className="text-xs text-[#0891B2] hover:underline">Edit</button>
                          <button onClick={() => handleLoginAs(m.id)}
                            className="text-xs text-[#64748B] hover:text-[#0891B2] hover:underline">Login as</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabel Dosen */}
        {activeTab === 'dosen' && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] overflow-hidden">
            <div className="p-4 border-b border-[#DAEAF7]">
              <p className="text-sm font-medium text-[#0C4A6E]">
                Daftar Dosen ({filteredDosen.length} dari {dosenList.length})
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">Dosen</th>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">NIP</th>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">WhatsApp</th>
                    <th className="text-left text-xs font-medium text-[#64748B] px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredDosen.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {d.profiles?.foto_url ? (
                            <img src={d.profiles.foto_url} alt={d.profiles?.nama}
                              className="w-8 h-8 rounded-full object-cover border border-[#DAEAF7]" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                              <span className="text-[#0891B2] font-semibold text-xs">
                                {d.profiles?.nama?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#334155]">{d.profiles?.nama || '—'}</p>
                            <p className="text-xs text-[#94A3B8]">{d.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{d.nip}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{d.profiles?.no_wa ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditDosen(d)}
                            className="text-xs text-[#0891B2] hover:underline">Edit</button>
                          <button onClick={() => handleLoginAs(d.id)}
                            className="text-xs text-[#64748B] hover:text-[#0891B2] hover:underline">Login as</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}