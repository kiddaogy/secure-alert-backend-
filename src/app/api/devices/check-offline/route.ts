import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function GET() {
  try {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000)

    const offlineDevices = await prisma.device.updateMany({
      where: {
        status: 'ONLINE',
        OR: [
          { lastSeen: { lt: oneMinuteAgo } },
          { lastSeen: null },
        ],
      },
      data: { status: 'OFFLINE' },
    })

    return NextResponse.json<ApiResponse<{ updated: number }>>(
      {
        success: true,
        data: { updated: offlineDevices.count },
        message: `Marked ${offlineDevices.count} devices offline`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Check offline error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000)

    const offlineDevices = await prisma.device.updateMany({
      where: {
        status: 'ONLINE',
        OR: [
          { lastSeen: { lt: oneMinuteAgo } },
          { lastSeen: null },
        ],
      },
      data: { status: 'OFFLINE' },
    })

    return NextResponse.json<ApiResponse<{ updated: number }>>(
      {
        success: true,
        data: { updated: offlineDevices.count },
        message: `Marked ${offlineDevices.count} devices offline`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Check offline error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
