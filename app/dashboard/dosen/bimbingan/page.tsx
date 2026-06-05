'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DosenBimbinganPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/dashboard/dosen')
  }, [])

  return null
}