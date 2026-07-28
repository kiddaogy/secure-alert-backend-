import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.IO is not supported in serverless environments. Use SSE endpoint instead.',
    sseEndpoint: '/api/sse'
  }, { status: 200 })
}
