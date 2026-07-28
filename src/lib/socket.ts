import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest } from 'next'
import { Server as NetServer } from 'net'

export type NextApiResponseWithSocket = NextApiRequest & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const initSocketIO = (httpServer: HTTPServer) => {
  if (!httpServer) {
    throw new Error('HTTP server is required for Socket.IO')
  }

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-alerts', () => {
      socket.join('alerts')
      console.log('Client joined alerts room:', socket.id)
    })

    socket.on('join-admin', () => {
      socket.join('admin')
      console.log('Client joined admin room:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export const getSocketIO = (req: NextApiResponseWithSocket): SocketIOServer | undefined => {
  if (!req.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    const httpServer: HTTPServer = req.socket.server as any
    const io = initSocketIO(httpServer)
    req.socket.server.io = io
  }
  return req.socket.server.io
}
