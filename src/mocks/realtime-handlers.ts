import { ws } from 'msw'
import { subscribeNftUpdates } from './nft-db'

const socketUrl = new URL('/', window.location.origin)
socketUrl.protocol =
  window.location.protocol === 'https:' ? 'wss:' : 'ws:'

const realtime = ws.link(socketUrl.href)

export const realtimeHandlers = [
  realtime.addEventListener('connection', ({ client }) => {
    const sid = crypto.randomUUID()
    let connected = false

    function emit(event: string, payload: unknown) {
      client.send(`42${JSON.stringify([event, payload])}`)
    }

    const unsubscribe = subscribeNftUpdates((nft) => {
      if (connected) {
        emit('nft:updated', {
          nftId: nft.id,
          version: nft.version,
        })
      }
    })

    client.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      if (event.data === '40') {
        connected = true
        client.send(`40${JSON.stringify({ sid })}`)
        return
      }

      if (!connected || !event.data.startsWith('42')) {
        return
      }

      try {
        const payload: unknown = JSON.parse(event.data.slice(2))

        if (
          Array.isArray(payload) &&
          payload[0] === 'client:ready'
        ) {
          emit('server:ready', { connected: true })
        }
      } catch {
        console.warn('[MSW] Pacote Socket.IO inválido.')
      }
    })

    queueMicrotask(() => {
      client.send(
        `0${JSON.stringify({
          sid,
          upgrades: [],
          pingInterval: 20_000,
          pingTimeout: 10_000,
          maxPayload: 1_000_000,
        })}`,
      )
    })

    const heartbeat = window.setInterval(() => {
      client.send('2')
    }, 20_000)

    client.addEventListener('close', () => {
      connected = false
      window.clearInterval(heartbeat)
      unsubscribe()
    })
  }),
]