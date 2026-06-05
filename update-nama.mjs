import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const env = readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Ganti dengan nama file Excel Anda
const workbook = XLSX.readFile('./data-mahasiswa.xlsx')
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet)

console.log(`Total data: ${rows.length}`)

let success = 0
let failed = 0

for (const row of rows) {
  const nama = String(row.nama || row.Nama || '')
  const npm = String(row.npm || row.NPM || '')
  const angkatan = Number(row.angkatan || row.Angkatan || 0)

  if (!nama || !npm) continue

  const email = `${npm}@sibsigeo.id`

  const { error } = await supabase
    .from('profiles')
    .update({ nama, email })
    .eq('email', email)

  if (error) {
    console.log(`GAGAL: ${nama} - ${error.message}`)
    failed++
  } else {
    await supabase
      .from('mahasiswa')
      .update({ npm, angkatan })
      .eq('npm', npm)

    success++
    if (success % 50 === 0) console.log(`Progress: ${success} berhasil...`)
  }
}

console.log(`\nSelesai! Berhasil: ${success}, Gagal: ${failed}`)