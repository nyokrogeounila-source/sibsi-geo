import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'mahasiswa'

  let data: any[] = []
  let filename = ''

  if (type === 'mahasiswa') {
    data = [
      {
        nama: 'Contoh Mahasiswa Satu',
        npm: '2021001',
        angkatan: 2021,
        no_wa: '08123456789',
        password: '123456',
      },
      {
        nama: 'Contoh Mahasiswa Dua',
        npm: '2021002',
        angkatan: 2021,
        no_wa: '08234567890',
        password: '123456',
      },
    ]
    filename = 'template_mahasiswa.xlsx'
  } else {
    data = [
      {
        nama: 'Contoh Dosen Satu',
        nip: '198501012010011001',
        no_wa: '08123456789',
        password: '123456',
      },
      {
        nama: 'Contoh Dosen Dua',
        nip: '198601012010012002',
        no_wa: '08234567890',
        password: '123456',
      },
    ]
    filename = 'template_dosen.xlsx'
  }

  const ws = XLSX.utils.json_to_sheet(data)

  // Set lebar kolom
  ws['!cols'] = type === 'mahasiswa'
    ? [{ wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 15 }]
    : [{ wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 15 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}