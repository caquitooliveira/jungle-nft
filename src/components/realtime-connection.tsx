import { useEffect } from 'react'
import { createRealtimeSocket } from '@/lib/realtime-socket'

export function RealtimeConnection() {
  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | undefined

    async function connect() {
      const socket = await createRealtimeSocket()

      if (cancelled) {
        socket.disconnect()
        return
      }

      function handleConnect() {
        socket.emit('client:ready')
      }

      function handleReady() {
        console.info('[Socket.IO] Conexão em tempo real funcionando.')
      }

      function handleError(error: Error) {
        console.error('[Socket.IO] Falha na conexão:', error.message)
      }

      socket.on('connect', handleConnect)
      socket.on('server:ready', handleReady)
      socket.on('connect_error', handleError)

      cleanup = () => {
        socket.off('connect', handleConnect)
        socket.off('server:ready', handleReady)
        socket.off('connect_error', handleError)
        socket.disconnect()
      }

      socket.connect()
    }

    void connect().catch((error: unknown) => {
      if (!cancelled) {
        console.error('[Socket.IO] Não foi possível iniciar:', error)
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return null
}