import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password, nama, role, npm, angkatan, nip, no_wa } = body

    const emailLogin = role === 'mahasiswa'
      ? `${npm}@sibsigeo.id`
      : role === 'dosen'
      ? `${nip}@sibsigeo.id`
      : `${npm}@sibsigeo.id`

    // Cek apakah user sudah ada
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === emailLogin)

    let userId: string

    if (existingUser) {
      // User sudah ada, update saja
      userId = existingUser.id

      // Update password jika ada
      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      }
    } else {
      // Buat user baru
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: emailLogin,
        password: password || '123456',
        email_confirm: true,
        user_metadata: { nama, role },
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      userId = authData.user.id
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        nama,
        role,
        no_wa: no_wa || null,
        email: emailLogin
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Update tabel spesifik
    if (role === 'mahasiswa') {
      const { error: mError } = await supabaseAdmin
        .from('mahasiswa')
        .upsert({ id: userId, npm, angkatan })

      if (mError) {
        return NextResponse.json({ error: mError.message }, { status: 400 })
      }
    }

    if (role === 'dosen') {
      const { error: dError } = await supabaseAdmin
        .from('dosen')
        .upsert({ id: userId, nip })

      if (dError) {
        return NextResponse.json({ error: dError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}