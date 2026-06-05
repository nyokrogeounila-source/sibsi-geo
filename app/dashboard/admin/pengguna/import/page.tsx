'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default function ImportPengguna() {
  const [activeTab, setActiveTab] = useState<'mahasiswa' | 'dosen'>('mahasiswa')
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: string[] } | null>(null)
  const [error, setError] = useState('')

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)
      setPreview(rows as any[])
      setResults(null)
      setError('')
    }
    reader.readAsBinaryString(file)
  }

  async function handleImport() {
    if (preview.length === 0) return
    setLoading(true)
    setError('')

    const failed: string[] = []
    let success = 0

    for (const row of preview) {
      try {
        const body = activeTab === 'mahasiswa'
          ? {
              role: 'mahasiswa',
              nama: row.nama || row.Nama,
              npm: String(row.npm || row.NPM),
              angkatan: Number(row.angkatan || row.Angkatan),
              no_wa: String(row.no_wa || row.NoWA || ''),
              password: String(row.password || row.Password || '123456'),
            }
          : {
              role: 'dosen',
              nama: row.nama || row.Nama,
              nip: String(row.nip || row.NIP),
              no_wa: String(row.no_wa || row.NoWA || ''),
              password: String(row.password || row.Password || '123456'),
            }

        const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const result = await res.json()
        if (!res.ok) {
          failed.push(`${row.nama || row.Nama}: ${result.error}`)
        } else {
          success++
        }
      } catch (err) {
        failed.push(`${row.nama || row.Nama}: Error tidak diketahui`)
      }
    }

    setResults({ success, failed })
    setLoading(false)
  }

  function downloadTemplate() {
    const templateMahasiswa = [
      { nama: 'Contoh Mahasiswa', npm: '2021001', angkatan: 2021, no_wa: '08123456789', password: '123456' },
    ]
    const templateDosen = [
      { nama: 'Contoh Dosen', nip: '198501012010011001', no_wa: '08123456789', password: '123456' },
    ]

    const data = activeTab === 'mahasiswa' ? templateMahasiswa : templateDosen
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `template_${activeTab}.xlsx`)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" nama="Administrator" foto_url={null} />

      <main className="flex-1 p-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/dashboard/admin/pengguna"
            className="text-xs text-[#0891B2] hover:underline"
          >
            ← Kembali
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[#0C4A6E] mb-1">Import Pengguna</h1>
        <p className="text-sm text-[#64748B] mb-8">
          Upload file Excel untuk import data mahasiswa atau dosen sekaligus
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['mahasiswa', 'dosen'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPreview([]); setResults(null) }}
              className={`text-sm px-4 py-2 rounded-lg border transition capitalize ${
                activeTab === tab
                  ? 'bg-[#0891B2] text-white border-[#0891B2]'
                  : 'bg-white text-[#64748B] border-[#DAEAF7] hover:border-[#0891B2]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Info Format */}
        <div className="bg-[#E0F2FE] rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-[#0369A1] mb-2">
            Format kolom Excel untuk {activeTab}:
          </p>
          {activeTab === 'mahasiswa' ? (
            <p className="text-xs text-[#0369A1]">
              <span className="font-mono bg-white/50 px-1 rounded">nama</span>{' '}
              <span className="font-mono bg-white/50 px-1 rounded">npm</span>{' '}
              <span className="font-mono bg-white/50 px-1 rounded">angkatan</span>{' '}
              <span className="font-mono bg-white/50 px-1 rounded">no_wa</span>{' '}
              <span className="font-mono bg-white/50 px-1 rounded">password</span>
            </p>
          ) : (
            <p className="text-xs text-[#0369A1]">
              <span className="font-mono bg-white/50 px-1 rounded">nama</span>{' '}
              <span className="font-mono bg-white/50 px-1 rounded">nip</span>{' '}
              <span className="font-mono bg-white/50 px-1 rounded">no_wa</span>{' '}
              <span className="font-mono bg-white/50 px-1 rounded">password</span>
            </p>
          )}
          <p className="text-xs text-[#0369A1] mt-2">
            Jika kolom password kosong, password default adalah <span className="font-mono bg-white/50 px-1 rounded">123456</span>
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0C4A6E]">Upload File Excel</h2>
            <button
              onClick={downloadTemplate}
              className="text-xs bg-[#E0F2FE] text-[#0369A1] px-3 py-1.5 rounded-lg hover:bg-[#BAE6FD] transition"
            >
              ⬇️ Download Template
            </button>
          </div>

          <label className="block w-full border-2 border-dashed border-[#DAEAF7] rounded-xl p-8 text-center cursor-pointer hover:border-[#0891B2] transition">
            <p className="text-2xl mb-2">📂</p>
            <p className="text-sm font-medium text-[#334155] mb-1">
              Klik untuk upload file Excel
            </p>
            <p className="text-xs text-[#94A3B8]">.xlsx atau .xls</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0C4A6E]">
                Preview Data ({preview.length} baris)
              </h2>
              <button
                onClick={handleImport}
                disabled={loading}
                className="bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-60"
              >
                {loading ? `Mengimport... (${results?.success ?? 0}/${preview.length})` : `Import ${preview.length} Data`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="text-left px-3 py-2 text-[#64748B] font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-3 py-2 text-[#334155]">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="text-xs text-[#94A3B8] mt-2 text-center">
                  Menampilkan 10 dari {preview.length} baris
                </p>
              )}
            </div>
          </div>
        )}

        {/* Hasil Import */}
        {results && (
          <div className="bg-white rounded-xl border border-[#DAEAF7] p-6">
            <h2 className="font-semibold text-[#0C4A6E] mb-4">Hasil Import</h2>

            <div className="flex gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex-1 text-center">
                <p className="text-2xl font-bold text-green-600">{results.success}</p>
                <p className="text-xs text-green-700 mt-1">Berhasil diimport</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex-1 text-center">
                <p className="text-2xl font-bold text-red-600">{results.failed.length}</p>
                <p className="text-xs text-red-700 mt-1">Gagal diimport</p>
              </div>
            </div>

            {results.failed.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-xs font-medium text-red-700 mb-2">Data yang gagal:</p>
                <ul className="space-y-1">
                  {results.failed.map((f, i) => (
                    <li key={i} className="text-xs text-red-600">• {f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}