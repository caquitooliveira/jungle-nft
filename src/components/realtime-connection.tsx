import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createRealtimeSocket } from '@/lib/realtime-socket'
import type { Nft } from '@/types/nft'

interface NftUpdate {
  nftId: string
  version: number
}

function isNftUpdate(value: unknown): value is NftUpdate {
  if (!value || typeof value !== 'object') {
    return false
  }

  const update = value as Record<string, unknown>

  return (
    typeof update.nftId === 'string' &&
    typeof update.version === 'number' &&
    Number.isSafeInteger(update.version) &&
    update.version > 0
  )
}

export function RealtimeConnection() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | undefined
    const receivedVersions = new Map<string, number>()

    function refreshCatalog() {
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      void queryClient.invalidateQueries({ queryKey: ['nft'] })
      void queryClient.invalidateQueries({
        queryKey: ['cart-quote'],
      })
    }

    async function connect() {
      const socket = await createRealtimeSocket()

      if (cancelled) {
        socket.disconnect()
        return
      }

      function handleConnect() {
        // Também recupera mudanças perdidas durante uma desconexão.
        refreshCatalog()
        socket.emit('client:ready')
      }

      function handleReady() {
        console.info('[Socket.IO] Conexão em tempo real funcionando.')
      }

      function handleUpdate(value: unknown) {
        if (!isNftUpdate(value)) {
          return
        }

        const cached = queryClient.getQueryData<Nft>([
          'nft',
          value.nftId,
        ])

        const knownVersion = Math.max(
          receivedVersions.get(value.nftId) ?? 0,
          cached?.version ?? 0,
        )

        // Ignora eventos repetidos ou anteriores ao estado conhecido.
        if (value.version <= knownVersion) {
          return
        }

        receivedVersions.set(value.nftId, value.version)

        void queryClient.invalidateQueries({
          queryKey: ['nft', value.nftId],
          exact: true,
        })

        // Preço pode mudar a composição dos resultados filtrados.
        void queryClient.invalidateQueries({ queryKey: ['nfts'] })
        void queryClient.invalidateQueries({
          queryKey: ['cart-quote'],
        })

        console.info(
          '[Socket.IO] NFT atualizado:',
          value.nftId,
          `versão ${value.version}`,
        )
      }

      function handleError(error: Error) {
        console.error('[Socket.IO] Falha na conexão:', error.message)
      }

      socket.on('connect', handleConnect)
      socket.on('server:ready', handleReady)
      socket.on('nft:updated', handleUpdate)
      socket.on('connect_error', handleError)

      cleanup = () => {
        socket.off('connect', handleConnect)
        socket.off('server:ready', handleReady)
        socket.off('nft:updated', handleUpdate)
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
  }, [queryClient])

  return null
}