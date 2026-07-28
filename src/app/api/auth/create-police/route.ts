import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, User } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { fullName, email, phone, password } = body

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const policeUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: 'POLICE',
      },
    })

    return NextResponse.json<ApiResponse<Omit<User, 'password'>>>(
      {
        success: true,
        data: {
          id: policeUser.id,
          fullName: policeUser.fullName,
          email: policeUser.email,
          phone: policeUser.phone,
          role: policeUser.role,
          createdAt: policeUser.createdAt,
          updatedAt: policeUser.updatedAt,
        },
        message: 'Police account created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create police error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
