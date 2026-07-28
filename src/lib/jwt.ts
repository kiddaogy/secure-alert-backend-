import jwt from 'jsonwebtoken'
import { JWTPayload } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET!

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export const getTokenFromHeader = (
  authHeader: string | null
): string | null => {
  if (!authHeader) return null
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]
}
