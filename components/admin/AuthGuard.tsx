'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkAuth } from '@/lib/api'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function verifyAuth() {
      const authenticated = await checkAuth()
      setIsAuthenticated(authenticated)
      if (!authenticated) {
        router.push('/admin/login')
      }
    }
    verifyAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}









