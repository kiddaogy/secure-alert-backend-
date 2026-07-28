import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = getTokenFromHeader(authHeader)

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    verifyToken(token)
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

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
      Connection: 'keep-alive',
    },
  })
}
