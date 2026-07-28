import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Alert, AlertStatus } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = requireAuth(req, ['POLICE', 'ADMIN'])
    if (error || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const body = await req.json()
    const { status, notes } = body

    const validStatuses: AlertStatus[] = [
      'PENDING',
      'RESPONDING',
      'RESOLVED',
      'FALSE_ALARM',
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updateData: {
      status: AlertStatus
      notes?: string
      respondedAt?: Date
      resolvedAt?: Date
    } = { status }

    if (notes) updateData.notes = notes
    if (status === 'RESPONDING') updateData.respondedAt = new Date()
    if (status === 'RESOLVED' || status === 'FALSE_ALARM') {
      updateData.resolvedAt = new Date()
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: updateData,
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
        message: 'Alert updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update alert error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
