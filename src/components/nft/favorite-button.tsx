import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/services/auth-service'
import {
  getFavorites,
  setFavorite,
} from '@/services/favorite-service'

export function FavoriteButton({ nftId }: { nftId: string }) {
  const { session, isLoading, openAuth } = useAuth()

  return (
    <AccountFavoriteButton
      key={`${session?.token ?? 'guest'}:${nftId}`}
      nftId={nftId}
      session={session}
      isLoading={isLoading}
      openAuth={openAuth}
    />
  )
}

function AccountFavoriteButton({
  nftId,
  session,
  isLoading,
  openAuth,
}: {
  nftId: string
  session: ReturnType<typeof useAuth>['session']
  isLoading: boolean
  openAuth: () => void
}) {
  const queryClient = useQueryClient()
  const busyRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const queryKey = ['private', session?.user.id, 'favorites']

  const favoritesQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      if (!session) {
        throw new Error('Entre para consultar seus favoritos.')
      }

      return getFavorites(session.token, signal)
    },
    enabled: Boolean(session),
    retry: false,
  })

  const isFavorite = favoritesQuery.data?.includes(nftId) ?? false

  async function toggleFavorite() {
    if (!session) {
      openAuth()
      return
    }

    if (busyRef.current) {
      return
    }

    if (!favoritesQuery.isSuccess) {
      void favoritesQuery.refetch()
      return
    }

    busyRef.current = true
    setIsSaving(true)
    setError('')

    const token = session.token
    const nextFavorite = !isFavorite
    let previous: string[] | undefined

    try {
      await queryClient.cancelQueries({ queryKey })

      if (getSessionToken() !== token) {
        return
      }

      previous = queryClient.getQueryData<string[]>(queryKey) ?? []

      // Atualiza a interface antes de receber a resposta da API.
      queryClient.setQueryData<string[]>(
        queryKey,
        nextFavorite
          ? [...new Set([...previous, nftId])]
          : previous.filter((id) => id !== nftId),
      )

      await setFavorite(token, nftId, nextFavorite)

      if (getSessionToken() === token) {
        await queryClient.invalidateQueries({ queryKey })
      }
    } catch (error) {
      if (getSessionToken() === token) {
       if (previous !== undefined) {
  const wasFavorite = previous.includes(nftId)

  // Reverte somente este NFT, preservando outras alterações.
  queryClient.setQueryData<string[]>(
    queryKey,
    (current = []) =>
      wasFavorite
        ? [...new Set([...current, nftId])]
        : current.filter((id) => id !== nftId),
  )
}

        setError(
          isAxiosError<{ message?: string }>(error)
            ? error.response?.data?.message ??
                'Não foi possível atualizar o favorito.'
            : 'Não foi possível atualizar o favorito.',
        )
      }
    } finally {
      busyRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        aria-pressed={isFavorite}
        disabled={
          isLoading ||
          isSaving ||
          (Boolean(session) && favoritesQuery.isPending)
        }
        onClick={() => void toggleFavorite()}
        className="border-[#705039] bg-transparent text-xs text-[#e6a15a]"
      >
        {isFavorite ? '♥ Favoritado' : '♡ Favoritar'}
      </Button>

      {favoritesQuery.isError && (
        <p role="alert" className="mt-2 max-w-48 text-xs text-red-300">
          Não foi possível carregar os favoritos. Clique para tentar novamente.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 max-w-48 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}