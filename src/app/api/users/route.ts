import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/types'
import * as bcrypt from 'bcryptjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const users = await prisma.user.findMany({
      where: { role: 'OWNER' },
      include: {
        locations: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json<ApiResponse<any[]>>(
      { success: true, data: users },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { userId, fullName, email, phone, password } = body

    if (!userId || !fullName || !email || !phone) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'All fields are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const updateData: any = {
      fullName,
      email,
      phone,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        locations: true,
      },
    })

    return NextResponse.json<ApiResponse<any>>(
      {
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
