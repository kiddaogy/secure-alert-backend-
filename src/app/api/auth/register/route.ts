import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { ApiResponse, User } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, phone, password, latitude, longitude, address } = body

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

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: 'OWNER',
        latitude: latitude || null,
        longitude: longitude || null,
        address: address || null,
      },
    })

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    })

    return NextResponse.json<ApiResponse<{ user: Omit<User, 'password'>; token: string }>>(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            latitude: user.latitude,
            longitude: user.longitude,
            address: user.address,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          token,
        },
        message: 'Account created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
