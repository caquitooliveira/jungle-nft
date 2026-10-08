import { useQueries, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SiteHeader } from '@/components/layout/site-header'
import { FavoriteButton } from '@/components/nft/favorite-button'
import { useAuth } from '@/lib/auth-context'
import { getFavorites } from '@/services/favorite-service'
import { getNft } from '@/services/nft-service'

const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

export function FavoritesPage() {
  const { session, isLoading, openAuth } = useAuth()
  const navigate = useNavigate()

  const favoritesQuery = useQuery({
    queryKey: ['private', session?.user.id, 'favorites'],
    queryFn: ({ signal }) => {
      if (!session) {
        throw new Error('Entre para consultar seus favoritos.')
      }

      return getFavorites(session.token, signal)
    },
    enabled: Boolean(session),
    retry: false,
  })

  return (
    <div className="min-h-screen bg-[#160e0a] font-mono text-[#f5eee8]">
      <SiteHeader
        isSearchOpen={false}
        onToggleSearch={() => {
          void navigate({
            to: '/',
            search: initialSearch,
            hash: 'catalogo',
          })
        }}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start bg-[#281a13]">
          <h2 className="px-4 pt-4 font-bold">Meu perfil</h2>

          <nav
            aria-label="Menu do perfil"
            className="mt-3 text-sm text-[#b79460]"
          >
            <Link to="/perfil" className="block px-4 py-3">
              Dados do perfil
            </Link>

            <Link to="/carteiras" className="block px-4 py-3">
              Carteiras
            </Link>

            <span
              aria-current="page"
              className="block border-l-4 border-[#cf8946] px-4 py-3 text-[#e6a15a]"
            >
              Lista de interesse
            </span>
          </nav>
        </aside>

        <section className="min-w-0">
          <h1 className="mb-6 text-lg font-bold">Lista de interesse</h1>

          {isLoading ? (
            <p role="status">Recuperando sua sessão...</p>
          ) : !session ? (
            <div>
              <p>Entre para consultar sua lista de interesse.</p>

              <Button
                type="button"
                onClick={openAuth}
                className="mt-5 bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]"
              >
                Entrar
              </Button>
            </div>
          ) : favoritesQuery.isPending ? (
            <p role="status">Carregando favoritos...</p>
          ) : favoritesQuery.isError ? (
            <div role="alert">
              <p>Não foi possível carregar sua lista de interesse.</p>

              <Button
                type="button"
                disabled={favoritesQuery.isFetching}
                onClick={() => void favoritesQuery.refetch()}
                className="mt-4"
              >
                Tentar novamente
              </Button>
            </div>
          ) : favoritesQuery.data.length === 0 ? (
            <div>
              <p className="text-sm text-[#c9b6a5]">
                Você ainda não favoritou nenhum NFT.
              </p>

              <Link
                to="/"
                search={initialSearch}
                hash="catalogo"
                className="mt-4 inline-block text-sm text-[#e6a15a] underline"
              >
                Explorar NFTs
              </Link>
            </div>
          ) : (
            <FavoriteCards
              key={session.user.id}
              ids={favoritesQuery.data}
            />
          )}
        </section>
      </main>
    </div>
  )
}

function FavoriteCards({ ids }: { ids: string[] }) {
  const queries = useQueries({
    queries: ids.map((nftId) => ({
      queryKey: ['nft', nftId],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getNft(nftId, signal),
      retry: false,
    })),
  })

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {queries.map((query, index) => {
        const nftId = ids[index]

        if (query.isPending) {
          return (
            <div key={nftId} role="status" aria-label="Carregando NFT">
              <Skeleton className="aspect-square bg-[#36251c] motion-reduce:animate-none" />
            </div>
          )
        }

        if (query.isError) {
          const unavailable =
            isAxiosError(query.error) &&
            query.error.response?.status === 404

          return (
            <article
              key={nftId}
              className="rounded-lg bg-[#281a13] p-4"
            >
              <p role="alert" className="mb-4 text-sm">
                {unavailable
                  ? 'Este NFT não está mais disponível.'
                  : 'Não foi possível carregar este NFT.'}
              </p>

              {!unavailable && (
                <Button
                  type="button"
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                  className="mb-4"
                >
                  Tentar novamente
                </Button>
              )}

              <FavoriteButton nftId={nftId} />
            </article>
          )
        }

        const nft = query.data

        if (!nft) {
          return null
        }

        const edition =
          nft.editions.find((item) => item.name === '1/50') ??
          nft.editions[0]

        return (
          <article
            key={nft.id}
            className="rounded-lg bg-[#281a13] p-3"
          >
            <Link
              to="/nfts/$nftId"
              params={{ nftId: nft.id }}
              className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6a15a]"
            >
              <img
                src={nft.imageUrl}
                alt=""
                width={1254}
                height={1254}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full rounded-lg object-cover"
              />

              <h2 className="mt-3 text-sm font-bold">{nft.name}</h2>

              <p className="mt-2 text-sm text-[#e6a15a]">
                {edition
                  ? `${edition.priceEth} ETH`
                  : 'Sem edição disponível'}
              </p>
            </Link>

            <div className="mt-4">
              <FavoriteButton nftId={nft.id} />
            </div>
          </article>
        )
      })}
    </div>
  )
}