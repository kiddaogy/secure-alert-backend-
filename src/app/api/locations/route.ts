import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Location } from '@/types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function generatePairingCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['OWNER', 'ADMIN', 'POLICE'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Auto mark offline after 1 minute of no heartbeat
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000)
    await prisma.device.updateMany({
      where: {
        status: 'ONLINE',
        OR: [
          { lastSeen: { lt: oneMinuteAgo } },
          { lastSeen: null },
        ],
      },
      data: { status: 'OFFLINE' },
    })

    const locations = await prisma.location.findMany({
      where: user.role === 'OWNER' ? { ownerId: user.id } : {},
      include: {
        owner: true,
        device: true,
        alerts: {
          where: {
            status: { in: ['PENDING', 'RESPONDING'] },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json<ApiResponse<Location[]>>(
      { success: true, data: locations as unknown as Location[] },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['OWNER'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { name, address, type, policeStation, latitude, longitude } = body

    if (!name || !address || !type || !policeStation) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'All fields are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    let pairingCode = generatePairingCode()
    let exists = await prisma.location.findUnique({ where: { pairingCode } })
    while (exists) {
      pairingCode = generatePairingCode()
      exists = await prisma.location.findUnique({ where: { pairingCode } })
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        type,
        policeStation,
        latitude,
        longitude,
        pairingCode,
        ownerId: user.id,
      },
      include: {
        device: true,
        owner: true,
      },
    })

    return NextResponse.json<ApiResponse<Location>>(
      {
        success: true,
        data: location as unknown as Location,
        message: 'Location created successfully',
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
