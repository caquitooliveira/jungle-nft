import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeHero } from '@/components/home/home-hero'
import { HomePromotions } from '@/components/home/home-promotions'
import { HomeJournal } from '@/components/home/home-journal'
import { CatalogSidebar } from '@/components/home/catalog-sidebar'
import { FeaturedNft } from '@/components/home/featured-nft'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import type { CatalogSearch } from '@/lib/catalog-search'
import { getNfts } from '@/services/nft-service'

const pageSize = 9

export function HomePage() {
  const filters = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['nfts', { ...filters, pageSize }],
    queryFn: ({ signal }) => getNfts({ ...filters, pageSize }, signal),
  })

  // A base atual possui 24 NFTs. Esta consulta traz o catálogo
  // completo para calcular as contagens, sem usar só a página visível.
  const countsQuery = useQuery({
    queryKey: ['nfts', { sort: 'newest', page: 1, pageSize: 50 }],
    queryFn: ({ signal }) =>
      getNfts(
        { sort: 'newest', page: 1, pageSize: 50 },
        signal,
      ),
  })

  function updateFilters(changes: Partial<CatalogSearch>) {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...changes,
        page: changes.page ?? 1,
      }),
      hash: 'catalogo',
    })
  }

  function toggleFilter(key: 'category' | 'network', value: string) {
    const selected = filters[key]

    updateFilters({
      [key]: selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    })
  }

  function clearFilters() {
    updateFilters({
      search: '',
      category: [],
      network: [],
      sort: 'newest',
      minPrice: undefined,
      maxPrice: undefined,
    })
  }

  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / pageSize),
  )

  return (
    <div className="min-h-screen bg-[#160e0a] font-mono text-[#f5eee8]">
      <SiteHeader
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen((previous) => !previous)}
      />

      <main className="px-6 pb-10">
        <div className="mx-auto max-w-6xl">
          <HomeHero />

          {isSearchOpen && (
            <form
              id="catalog-search-panel"
              className="mt-6 flex gap-3"
              onSubmit={(event) => {
                event.preventDefault()

                const form = new FormData(event.currentTarget)

                updateFilters({
                  search: String(form.get('search') ?? '').trim(),
                })
              }}
            >
              <label htmlFor="catalog-search" className="sr-only">
                Buscar NFT ou criador
              </label>

              <Input
                autoFocus
                key={filters.search}
                id="catalog-search"
                name="search"
                defaultValue={filters.search}
                placeholder="Buscar NFT ou criador"
                className="border-[#705039] bg-[#281a13]"
              />

              <Button
                type="submit"
                className="bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]"
              >
                Buscar
              </Button>
            </form>
          )}

          <div
            id="catalogo"
            className="mt-8 grid scroll-mt-6 items-start gap-8 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]"
          >
            <aside className="min-w-0 space-y-6">
              <CatalogSidebar
                filters={filters}
                nfts={countsQuery.data?.items ?? []}
                countsReady={countsQuery.isSuccess}
                onToggle={toggleFilter}
                onUpdate={updateFilters}
                onClear={clearFilters}
              />

              {countsQuery.isError && (
                <div role="alert" className="text-xs text-red-300">
                  <p>Não foi possível carregar as contagens.</p>

                  <button
                    type="button"
                    disabled={countsQuery.isFetching}
                    onClick={() => void countsQuery.refetch()}
                    className="mt-2 underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              <FeaturedNft />
            </aside>

            <section aria-label="Catálogo de NFTs" className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#705039]/50 pb-3">
                <h2 className="text-sm font-bold text-[#e6a15a]">
                  Todos os NFTs
                </h2>

                <label className="flex items-center gap-2 text-xs">
                  Ordenar por

                  <select
                    value={filters.sort}
                    onChange={(event) =>
                      updateFilters({
                        sort:
                          event.target.value === 'name'
                            ? 'name'
                            : 'newest',
                      })
                    }
                    className="rounded border border-[#705039] bg-[#281a13] p-2"
                  >
                    <option value="newest">Mais recentes</option>
                    <option value="name">Nome</option>
                  </select>
                </label>
              </div>

              {isPending ? (
                <div
                  className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  role="status"
                  aria-label="Carregando NFTs"
                >
                  {Array.from({ length: pageSize }, (_, index) => (
                    <Skeleton
                      key={index}
                      className="aspect-square bg-[#36251c] motion-reduce:animate-none"
                    />
                  ))}
                </div>
              ) : isError ? (
                <div className="mt-6" role="alert">
                  <p>Não foi possível carregar os NFTs.</p>

                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-xs text-[#c7aa88]" role="status">
                    {data?.total ?? 0} NFTs encontrados
                  </p>

                  {data?.items.length === 0 ? (
                    <p className="mt-6 text-sm">
                      Nenhum NFT nesta página.
                    </p>
                  ) : (
                    <div className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                      {data?.items.map((nft) => {
                        const edition =
                          nft.editions.find(
                            (item) => item.name === '1/50',
                          ) ?? nft.editions[0]

                        return (
                          <article key={nft.id} className="min-w-0">
                            <Link
                              to="/nfts/$nftId"
                              params={{ nftId: nft.id }}
                              className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6a15a]"
                            >
                              <div className="bg-[#281a13] p-3">
                                <img
                                  src={nft.imageUrl}
                                  alt=""
                                  width={1254}
                                  height={1254}
                                  loading="lazy"
                                  decoding="async"
                                  className="aspect-square w-full rounded-lg object-cover"
                                />
                              </div>

                              <h3 className="mt-3 text-sm">
                                {nft.name}
                              </h3>

                              <p className="mt-2 text-sm font-bold text-[#e6a15a]">
                                {edition
                                  ? `${edition.priceEth} ETH`
                                  : 'Sem edição disponível'}
                              </p>
                            </Link>
                          </article>
                        )
                      })}
                    </div>
                  )}

                  <nav
                    aria-label="Paginação do catálogo"
                    className="mt-8 flex flex-wrap items-center gap-4 text-sm"
                  >
                    <Button
                      type="button"
                      disabled={filters.page <= 1}
                      onClick={() =>
                        updateFilters({ page: filters.page - 1 })
                      }
                    >
                      Anterior
                    </Button>

                    <span>
                      Página {filters.page} de {totalPages}
                    </span>

                    <Button
                      type="button"
                      disabled={filters.page >= totalPages}
                      onClick={() =>
                        updateFilters({ page: filters.page + 1 })
                      }
                    >
                      Próxima
                    </Button>
                  </nav>
                </>
              )}
            </section>
          </div>

          <HomePromotions
            onExplore={(category) => {
              updateFilters({
                search: '',
                category: [category],
                network: [],
                sort: 'newest',
                minPrice: undefined,
                maxPrice: undefined,
              })

              document.getElementById('catalogo')?.scrollIntoView({
                behavior: 'instant',
              })
            }}
          />

          <HomeJournal />
        </div>
      </main>

      <div className="px-6 pb-6">
        <SiteFooter />
      </div>
    </div>
  )
}