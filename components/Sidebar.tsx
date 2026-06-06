'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  role: 'mahasiswa' | 'dosen' | 'admin'
  nama: string
  foto_url?: string | null
}

const menuMahasiswa = [
  { href: '/dashboard/mahasiswa', label: 'Beranda', icon: '🏠' },
  { href: '/dashboard/mahasiswa/profil', label: 'Profil', icon: '👤' },
  { href: '/dashboard/mahasiswa/pengajuan-judul', label: 'Pengajuan Judul', icon: '📝' },
  { href: '/dashboard/mahasiswa/bimbingan', label: 'Pengajuan Bimbingan', icon: '📚' },
  { href: '/dashboard/mahasiswa/jadwal', label: 'Pengajuan Jadwal', icon: '📅' },
  { href: '/dashboard/mahasiswa/cetak', label: 'Persetujuan Cetak', icon: '🖨️' },
]

const menuDosen = [
  { href: '/dashboard/dosen', label: 'Beranda', icon: '🏠' },
  { href: '/dashboard/dosen/profil', label: 'Profil', icon: '👤' },
  { href: '/dashboard/dosen/bimbingan', label: 'Daftar Bimbingan', icon: '📚' },
  { href: '/dashboard/dosen/jadwal', label: 'Jadwal Seminar', icon: '📅' },
]

const menuAdmin = [
  { href: '/dashboard/admin', label: 'Beranda', icon: '🏠' },
  { href: '/dashboard/admin/statistik', label: 'Statistik', icon: '📊' },
  { href: '/dashboard/admin/pengajuan-judul', label: 'Pengajuan Judul', icon: '📝' },
  { href: '/dashboard/admin/jadwal', label: 'Pengaturan Jadwal', icon: '📅' },
  { href: '/dashboard/admin/pengguna', label: 'Pengguna', icon: '👥' },
  { href: '/dashboard/admin/progres', label: 'Progres Bimbingan', icon: '📈' },
]

const menuByRole = {
  mahasiswa: menuMahasiswa,
  dosen: menuDosen,
  admin: menuAdmin,
}

export default function Sidebar({ role, nama, foto_url }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const menu = menuByRole[role]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[#DAEAF7] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#DAEAF7]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0891B2] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">SG</span>
          </div>
          <div>
            <p className="font-semibold text-[#0C4A6E] text-sm leading-tight">SIBSI GEO</p>
            <p className="text-[10px] text-[#64748B]">Pend. Geografi FKIP Unila</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-[#DAEAF7]">
        <div className="flex items-center gap-3">
          {foto_url ? (
            <img
              src={foto_url}
              alt={nama}
              className="w-9 h-9 rounded-full object-cover border border-[#DAEAF7]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0891B2] font-semibold text-sm">
 {nama?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0C4A6E] truncate">{nama}</p>
            <span className="text-[10px] bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full capitalize">
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-[#E0F2FE] text-[#0369A1] font-medium'
                  : 'text-[#64748B] hover:bg-[#F0F7FF] hover:text-[#0C4A6E]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#DAEAF7]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}