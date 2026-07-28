import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, User } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const officers = await prisma.user.findMany({
      where: { role: 'POLICE' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json<ApiResponse<Omit<User, 'password'>[]>>(
      { success: true, data: officers as Omit<User, 'password'>[] },
      { status: 200 }
    )
  } catch (error) {
    console.error('Police list error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
