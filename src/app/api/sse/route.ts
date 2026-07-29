import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )
      }

      sendEvent({ type: 'connected', message: 'SSE Connected' })

      const interval = setInterval(async () => {
        try {
          const alerts = await prisma.alert.findMany({
            where: {
              status: { in: ['PENDING', 'RESPONDING'] },
            },
            include: {
              device: true,
              location: {
                include: { owner: true },
              },
            },
            orderBy: { triggeredAt: 'desc' },
          })

          sendEvent({ type: 'alerts', data: alerts })
        } catch (error) {
          console.error('SSE error:', error)
        }
      }, 3000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders,
    },
  })
}
