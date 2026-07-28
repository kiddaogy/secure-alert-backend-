import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/jwt'
import { JWTPayload, Role } from '@/types'

export const getAuthUser = (req: NextRequest): JWTPayload | null => {
  try {
    const authHeader = req.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export const requireAuth = (
  req: NextRequest,
  allowedRoles?: Role[]
): { user: JWTPayload | null; error: string | null } => {
  const user = getAuthUser(req)

  if (!user) {
    return { user: null, error: 'Unauthorized' }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user: null, error: 'Forbidden' }
  }

  return { user, error: null }
}
