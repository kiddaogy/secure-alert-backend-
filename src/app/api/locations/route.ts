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

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['OWNER', 'ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { locationId, name, address, type, policeStation, latitude, longitude } = body

    if (!locationId || !name || !address || !type || !policeStation) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'All fields are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if user has permission to edit this location
    const existingLocation = await prisma.location.findUnique({
      where: { id: locationId },
    })

    if (!existingLocation) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Location not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (user.role === 'OWNER' && existingLocation.ownerId !== user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'You can only edit your own locations' },
        { status: 403, headers: corsHeaders }
      )
    }

    const location = await prisma.location.update({
      where: { id: locationId },
      data: {
        name,
        address,
        type,
        policeStation,
        latitude,
        longitude,
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
        message: 'Location updated successfully',
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Update location error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req, ['OWNER', 'ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Location ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if user has permission to delete this location
    const existingLocation = await prisma.location.findUnique({
      where: { id: locationId },
      include: { device: true },
    })

    if (!existingLocation) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Location not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (user.role === 'OWNER' && existingLocation.ownerId !== user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'You can only delete your own locations' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Delete associated device if exists
    if (existingLocation.device) {
      await prisma.device.delete({
        where: { id: existingLocation.device.id },
      })
    }

    // Delete the location
    await prisma.location.delete({
      where: { id: locationId },
    })

    return NextResponse.json<ApiResponse<null>>(
      {
        success: true,
        message: 'Location deleted successfully',
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
