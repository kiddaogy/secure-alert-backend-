import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { ApiResponse, User } from '@/types'

export async function POST(req: NextRequest) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      )
    }

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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          token,
        },
        message: 'Login successful',
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  return NextResponse.json({}, { headers: corsHeaders })
}
