'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = searchParams.get('role') || 'mahasiswa'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roleLabel: Record<string, string> = {
    mahasiswa: 'Mahasiswa',
    dosen: 'Dosen',
    admin: 'Admin',
  }

  const rolePlaceholder: Record<string, string> = {
    mahasiswa: 'NPM',
    dosen: 'NIP',
    admin: 'Username',
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const emailLogin = username.includes('@')
      ? username
      : `${username}@sibsigeo.id`

    console.log('Trying login with:', emailLogin)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailLogin,
      password,
    })

    console.log('Auth result:', data, authError)

    if (authError) {
      setError('Username atau password salah.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    console.log('Profile result:', profile, profileError)

    if (!profile) {
      setError('Profil pengguna tidak ditemukan.')
      setLoading(false)
      return
    }

    if (profile.role !== role && profile.role !== 'admin') {
      setError(`Akun ini bukan akun ${roleLabel[role]}.`)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#F0F7FF] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#0891B2] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">SG</span>
          </div>
          <h1 className="font-bold text-[#0C4A6E] text-xl mb-1">SIBSI GEO</h1>
          <p className="text-xs text-[#64748B]">Pendidikan Geografi FKIP Universitas Lampung</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#DAEAF7] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-[#0C4A6E] text-lg">Masuk</h2>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1]">
              {roleLabel[role]}
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">
                {rolePlaceholder[role]}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  role === 'mahasiswa' ? 'Masukkan NPM' :
                  role === 'dosen' ? 'Masukkan NIP' :
                  'Masukkan username'
                }
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#DAEAF7] text-sm text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0891B2] hover:bg-[#0E7490] text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Switch Role */}
          <div className="mt-6 pt-6 border-t border-[#F1F5F9]">
            <p className="text-xs text-[#94A3B8] text-center mb-3">Masuk sebagai</p>
            <div className="flex gap-2 justify-center">
              {['mahasiswa', 'dosen', 'admin'].map((r) => (
                <Link
                  key={r}
                  href={`/login?role=${r}`}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition capitalize ${
                    role === r
                      ? 'bg-[#0891B2] text-white border-[#0891B2]'
                      : 'bg-white text-[#64748B] border-[#DAEAF7] hover:border-[#0891B2]'
                  }`}
                >
                  {roleLabel[r]}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#64748B] hover:text-[#0891B2] transition">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}