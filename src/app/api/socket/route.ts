import { NextApiRequest } from 'next'
import { Server as NetServer } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponseWithSocket, initSocketIO } from '@/lib/socket'

export const dynamic = 'force-dynamic'

export async function GET(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    const httpServer: any = res.socket.server
    const io = initSocketIO(httpServer)
    res.socket.server.io = io
  }

  return new Response('Socket.IO server initialized', { status: 200 })
}
