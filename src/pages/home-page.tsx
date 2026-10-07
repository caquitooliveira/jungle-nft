import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeHero } from '@/components/home/home-hero'
import { HomePromotions } from '@/components/home/home-promotions'
import { HomeJournal } from '@/components/home/home-journal'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import type { CatalogSearch } from '@/lib/catalog-search'
import { ethToWei } from '@/lib/eth'
import { getNfts } from '@/services/nft-service'
import { FeaturedNft } from '@/components/home/featured-nft'

const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
]

const networks = ['ethereum', 'polygon', 'solana']
const pageSize = 9

export function HomePage() {
  const filters = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const [priceError, setPriceError] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['nfts', { ...filters, pageSize }],
    queryFn: ({ signal }) => getNfts({ ...filters, pageSize }, signal),
  })

  function updateFilters(changes: Partial<CatalogSearch>) {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...changes,
        page: changes.page ?? 1,
      }),
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
    setPriceError('')

    updateFilters({
      search: '',
      category: [],
      network: [],
      sort: 'newest',
      minPrice: undefined,
      maxPrice: undefined,
    })
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))

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

              <Button type="submit">Buscar</Button>
            </form>
          )}

          <div
            id="catalogo"
            className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]"
          >
            <aside className="space-y-6">
              <fieldset>
                <legend className="mb-3 font-bold">Coleções</legend>

                {categories.map((category) => (
                  <label
                    key={category}
                    className="mb-3 flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={() => toggleFilter('category', category)}
                    />

                    {category}
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <legend className="mb-3 font-bold">Rede</legend>

                {networks.map((network) => (
                  <label
                    key={network}
                    className="mb-3 flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.network.includes(network)}
                      onChange={() => toggleFilter('network', network)}
                    />

                    {network}
                  </label>
                ))}
              </fieldset>

              <form
                key={`${filters.minPrice ?? ''}:${filters.maxPrice ?? ''}`}
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()

                  const form = new FormData(event.currentTarget)
                  const minimum = String(form.get('minPrice') ?? '')
                    .trim()
                    .replace(',', '.')
                  const maximum = String(form.get('maxPrice') ?? '')
                    .trim()
                    .replace(',', '.')

                  try {
                    const minWei = minimum ? ethToWei(minimum) : undefined
                    const maxWei = maximum ? ethToWei(maximum) : undefined

                    if (
                      minWei !== undefined &&
                      maxWei !== undefined &&
                      minWei > maxWei
                    ) {
                      setPriceError(
                        'O preço mínimo não pode superar o máximo.',
                      )
                      return
                    }

                    setPriceError('')

                    updateFilters({
                      minPrice: minimum || undefined,
                      maxPrice: maximum || undefined,
                    })
                  } catch {
                    setPriceError(
                      'Informe preços válidos, com até 18 casas decimais.',
                    )
                  }
                }}
              >
                <h2 className="font-bold">Faixa de preço em ETH</h2>

                <label htmlFor="min-price" className="block">
                  Preço mínimo
                </label>

                <Input
                  id="min-price"
                  name="minPrice"
                  inputMode="decimal"
                  defaultValue={filters.minPrice ?? ''}
                  placeholder="0,00"
                  aria-invalid={Boolean(priceError)}
                  aria-describedby={priceError ? 'price-error' : undefined}
                />

                <label htmlFor="max-price" className="block">
                  Preço máximo
                </label>

                <Input
                  id="max-price"
                  name="maxPrice"
                  inputMode="decimal"
                  defaultValue={filters.maxPrice ?? ''}
                  placeholder="3,00"
                  aria-invalid={Boolean(priceError)}
                  aria-describedby={priceError ? 'price-error' : undefined}
                />

                {priceError && (
                  <p
                    id="price-error"
                    role="alert"
                    className="text-sm text-red-300"
                  >
                    {priceError}
                  </p>
                )}

                <Button type="submit">Aplicar preço</Button>
              </form>

              <Button type="button" onClick={clearFilters}>
                Limpar filtros
              </Button>
              <FeaturedNft />
            </aside>

            <section aria-label="Catálogo de NFTs" className="min-w-0">
              <label className="flex flex-wrap items-center gap-3">
                Ordenar por

                <select
                  value={filters.sort}
                  onChange={(event) =>
                    updateFilters({
                      sort: event.target.value === 'name' ? 'name' : 'newest',
                    })
                  }
                  className="rounded border border-[#705039] bg-[#281a13] p-2"
                >
                  <option value="newest">Mais recentes</option>
                  <option value="name">Nome</option>
                </select>
              </label>

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
                  <p className="mt-4" role="status">
                    {data?.total ?? 0} NFTs encontrados
                  </p>

                  {data?.items.length === 0 ? (
                    <p className="mt-6">Nenhum NFT nesta página.</p>
                  ) : (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {data?.items.map((nft) => (
                        <article
                          key={nft.id}
                          className="bg-[#281a13] p-3"
                        >
                          <img
                            src={nft.imageUrl}
                            alt={nft.name}
                            width={1254}
                            height={1254}
                            loading="lazy"
                            decoding="async"
                            className="aspect-square w-full rounded-lg object-cover"
                          />

                          <h2 className="mt-3 font-bold">{nft.name}</h2>

                          <p className="mt-2 text-[#e6a15a]">
                            {nft.editions[0]?.priceEth} ETH
                          </p>
                        </article>
                      ))}
                    </div>
                  )}

                  <nav
                    aria-label="Paginação do catálogo"
                    className="mt-6 flex flex-wrap items-center gap-4"
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
              setPriceError('')

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