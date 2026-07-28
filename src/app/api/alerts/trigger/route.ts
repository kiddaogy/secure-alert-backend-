import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, Alert } from '@/types'

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

    const device = await prisma.device.findUnique({
      where: { deviceId },
      include: { location: true },
    })

    if (!device) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Device not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    await prisma.device.update({
      where: { deviceId },
      data: { lastSeen: new Date(), status: 'ONLINE' },
    })

    const alert = await prisma.alert.create({
      data: {
        deviceId: device.id,
        locationId: device.locationId,
        status: 'PENDING',
      },
      include: {
        device: true,
        location: {
          include: { owner: true },
        },
      },
    })

    return NextResponse.json<ApiResponse<Alert>>(
      {
        success: true,
        data: alert as unknown as Alert,
        message: 'Alert triggered successfully',
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Trigger alert error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
