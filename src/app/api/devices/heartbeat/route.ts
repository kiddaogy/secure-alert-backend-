import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'deviceId is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const device = await prisma.device.update({
      where: { deviceId },
      data: {
        status: 'ONLINE',
        lastSeen: new Date(),
      },
    })

    return NextResponse.json<ApiResponse<{ lastSeen: Date }>>(
      {
        success: true,
        data: { lastSeen: device.lastSeen! },
        message: 'Heartbeat received',
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Device not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    console.error('Heartbeat error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
