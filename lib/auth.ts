import { NextRequest } from 'next/server'

export function isAdminAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

export function requireAdminAuth(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    throw new Error('Unauthorized')
  }
}

