import { ws } from 'msw'

const socketUrl = new URL('/', window.location.origin)
socketUrl.protocol =
  window.location.protocol === 'https:' ? 'wss:' : 'ws:'

const realtime = ws.link(socketUrl.href)

export const realtimeHandlers = [
  realtime.addEventListener('connection', ({ client }) => {
    console.info('[MSW] Socket.IO interceptado.')

    const sid = crypto.randomUUID()
    let connected = false

    // Recebe os pacotes enviados pelo Socket.IO do navegador.
    client.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      // O cliente pede para entrar no namespace padrão.
      if (event.data === '40') {
        connected = true
        client.send(`40${JSON.stringify({ sid })}`)
        return
      }

      // "42" identifica um evento Socket.IO.
      if (!connected || !event.data.startsWith('42')) {
        return
      }

      try {
        const payload: unknown = JSON.parse(event.data.slice(2))

        if (
          Array.isArray(payload) &&
          payload[0] === 'client:ready'
        ) {
          client.send(
            `42${JSON.stringify([
              'server:ready',
              { message: 'Conexão em tempo real funcionando.' },
            ])}`,
          )
        }
      } catch {
        console.warn('[MSW] Pacote Socket.IO inválido.')
      }
    })

    // Primeiro abre o Engine.IO. Só confirma o Socket.IO
    // depois que o cliente responder com "40".
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
      window.clearInterval(heartbeat)
    })
  }),
]