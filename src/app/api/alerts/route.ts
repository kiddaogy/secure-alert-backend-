import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Alert } from '@/types'

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
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const locationId = searchParams.get('locationId')
    const deviceId = searchParams.get('deviceId')

    // If deviceId is provided (ESP32 checking)
    // No auth needed for device checks
    if (deviceId) {
      const device = await prisma.device.findUnique({
        where: { deviceId },
      })

      if (!device) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Device not found' },
          { status: 404, headers: corsHeaders }
        )
      }

      const alerts = await prisma.alert.findMany({
        where: {
          deviceId: device.id,
          ...(status ? { status: status as never } : {}),
        },
        include: {
          device: true,
          location: {
            include: { owner: true },
          },
        },
        orderBy: { triggeredAt: 'desc' },
        take: 5,
      })

      return NextResponse.json<ApiResponse<Alert[]>>(
        { success: true, data: alerts as unknown as Alert[] },
        { status: 200, headers: corsHeaders }
      )
    }

    // Normal dashboard request (requires auth)
    const { user, error } = requireAuth(req, ['ADMIN', 'POLICE', 'OWNER'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const alerts = await prisma.alert.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(locationId ? { locationId } : {}),
        ...(user.role === 'OWNER'
          ? { location: { ownerId: user.id } }
          : {}),
      },
      include: {
        device: true,
        location: {
          include: { owner: true },
        },
      },
      orderBy: { triggeredAt: 'desc' },
    })

    return NextResponse.json<ApiResponse<Alert[]>>(
      { success: true, data: alerts as unknown as Alert[] },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceId, status } = body

    if (!deviceId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Device ID is required' },
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

    const alert = await prisma.alert.create({
      data: {
        deviceId: device.id,
        locationId: device.locationId,
        status: status || 'PENDING',
        triggeredAt: new Date(),
      },
      include: {
        device: true,
        location: {
          include: { owner: true },
        },
      },
    })

    return NextResponse.json<ApiResponse<Alert>>(
      { success: true, data: alert as unknown as Alert },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Create alert error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['ADMIN', 'POLICE'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { alertId, status, notes } = body

    if (!alertId || !status) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Alert ID and status are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: { device: true },
    })

    if (!alert) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Alert not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status,
        notes,
        respondedAt: status === 'RESPONDING' ? new Date() : alert.respondedAt,
        resolvedAt: status === 'RESOLVED' || status === 'FALSE_ALARM' ? new Date() : alert.resolvedAt,
      },
      include: {
        device: true,
        location: {
          include: { owner: true },
        },
      },
    })

    return NextResponse.json<ApiResponse<Alert>>(
      { success: true, data: updatedAlert as unknown as Alert },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Update alert error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { searchParams } = new URL(req.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Alert ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    await prisma.alert.delete({
      where: { id: alertId },
    })

    return NextResponse.json<ApiResponse<null>>(
      { success: true, data: null },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Delete alert error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
