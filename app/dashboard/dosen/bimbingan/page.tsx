import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default async function DaftarBimbinganDosen() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'dosen') redirect('/login')

  const { data: asPb1 } = await supabase
    .from('mahasiswa')
    .select('id')
    .eq('pb1_id', user.id)

  const { data: asPb2 } = await supabase
    .from('mahasiswa')
    .select('id')
    .eq('pb2_id', user.id)

  const { data: asPenguji } = await supabase
    .from('mahasiswa')
    .select('id')
    .eq('penguji_id', user.id)

  const allIds = [
    ...(asPb1 || []).map(m => m.id),
    ...(asPb2 || []).map(m => m.id),
    ...(asPenguji || []).map(m => m.id),
  ]
  const uniqueIds = [...new Set(allIds)]

  let mahasiswaList: any[] = []

  if (uniqueIds.length > 0) {
    const { data: ml } = await supabase
      .from('mahasiswa')
      .select('id, npm, angkatan, pb1_id, pb2_id, penguji_id')
      .in('id', uniqueIds)

    if (ml && ml.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nama, foto_url')
        .in('id', ml.map(m => m.id))

      mahasiswaList = ml.map(m => ({
        ...m,
        profiles: profiles?.find(p => p.id === m.id) || null,
        peran: m.pb1_id === user.id ? 'PB1' : m.pb2_id === user.id ? 'PB2' : 'Penguji'
      }))
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="dosen" nama={profile.nama} foto_url={profile.foto_url} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Daftar Bimbingan</h1>
        <p className="text-sm text-[#64748B] mb-8">
          Daftar mahasiswa yang Anda bimbing
        </p>

        {mahasiswaList.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-16 text-center">
            <p className="text-sm text-[#94A3B8]">Belum ada mahasiswa bimbingan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mahasiswaList.map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/dosen/bimbingan/${m.id}`}
                className="block bg-white rounded-xl border border-[#DAEAF7] p-5 hover:border-[#0891B2] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  {m.profiles?.foto_url ? (
                    <img
                      src={m.profiles.foto_url}
                      alt={m.profiles?.nama}
                      className="w-10 h-10 rounded-full object-cover border border-[#DAEAF7]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0891B2] font-semibold text-sm">
                        {m.profiles?.nama?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0C4A6E] truncate">
                      {m.profiles?.nama || '—'}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      NPM: {m.npm} · {m.angkatan}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full">
                  {m.peran}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}