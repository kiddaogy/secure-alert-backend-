import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, Device } from '@/types'

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
    const { deviceId, pairingCode } = body

    if (!deviceId || !pairingCode) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'deviceId and pairingCode are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const location = await prisma.location.findUnique({
      where: { pairingCode },
      include: { device: true },
    })

    if (!location) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid pairing code' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (location.device) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Location already has a device paired' },
        { status: 400, headers: corsHeaders }
      )
    }

    const device = await prisma.device.create({
      data: {
        deviceId,
        locationId: location.id,
        status: 'ONLINE',
        lastSeen: new Date(),
      },
      include: { location: true },
    })

    return NextResponse.json<ApiResponse<Device>>(
      {
        success: true,
        data: device as unknown as Device,
        message: 'Device paired successfully',
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Device pairing error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
