export async function createRealtimeSocket() {
  // Carrega depois que o MSW já foi iniciado.
  const { io } = await import('socket.io-client')

  return io(window.location.origin, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    timeout: 10_000,
  })
}