import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import {
  removeCartItem,
  setCartQuantity,
  useCartItems,
} from '@/lib/cart-store'
import { getCartQuote } from '@/services/cart-service'
import { getNfts } from '@/services/nft-service'

const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

const orangeButton =
  'bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]'

function errorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ??
      'Não foi possível calcular o carrinho.'
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir esta ação.'
}

export function CartPage() {
  const items = useCartItems()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const quote = useQuery({
    queryKey: ['cart-quote', { items, coupon }],
    queryFn: ({ signal }) =>
      getCartQuote({ items, coupon: coupon || undefined }, signal),
    enabled: items.length > 0,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  function changeQuantity(
    nftId: string,
    editionId: string,
    quantity: number,
  ) {
    setActionError('')

    try {
      setCartQuantity(nftId, editionId, quantity)
    } catch (error) {
      setActionError(errorMessage(error))
    }
  }

  function removeItem(nftId: string, editionId: string) {
    setActionError('')

    try {
      removeCartItem(nftId, editionId)
    } catch (error) {
      setActionError(errorMessage(error))
    }
  }

  return (
    <div className="min-h-screen bg-[#160e0a] font-mono text-[#f5eee8]">
      <SiteHeader
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen((previous) => !previous)}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {isSearchOpen && (
          <form
            id="catalog-search-panel"
            className="mb-8 flex gap-3"
            onSubmit={(event) => {
              event.preventDefault()

              const form = new FormData(event.currentTarget)

              void navigate({
                to: '/',
                search: {
                  ...initialSearch,
                  search: String(form.get('search') ?? '').trim(),
                },
              })
            }}
          >
            <label htmlFor="cart-search" className="sr-only">
              Buscar NFT ou criador
            </label>

            <Input
              autoFocus
              id="cart-search"
              name="search"
              placeholder="Buscar NFT ou criador"
              className="border-[#705039] bg-[#281a13]"
            />

            <Button type="submit" className={orangeButton}>
              Buscar
            </Button>
          </form>
        )}

        <nav aria-label="Caminho da página" className="mb-6 text-xs">
          <Link to="/" search={initialSearch}>
            Início
          </Link>

          <span aria-hidden="true"> / </span>

          <Link to="/" search={initialSearch} hash="catalogo">
            Mercado
          </Link>

          <span aria-hidden="true"> / </span>
          <span aria-current="page">Carrinho</span>
        </nav>

        <h1 className="sr-only">Carrinho de NFTs</h1>

        {actionError && (
          <p role="alert" className="mb-4 text-sm text-red-300">
            {actionError}
          </p>
        )}

        {items.length === 0 ? (
          <section className="rounded-lg bg-[#281a13] p-8">
            <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>

            <p className="mt-3 text-sm text-[#c9b6a5]">
              Explore o catálogo e escolha uma edição para adicionar.
            </p>

            <Link
              to="/"
              search={initialSearch}
              hash="catalogo"
              className="mt-6 inline-block rounded-md bg-[#cf8946] px-5 py-3 text-sm text-[#160e0a]"
            >
              Explorar NFTs
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section aria-label="Itens do carrinho" className="min-w-0">
              {quote.isPending ? (
                <div role="status" aria-label="Calculando carrinho">
                  {items.map((item) => (
                    <Skeleton
                      key={`${item.nftId}:${item.editionId}`}
                      className="mb-3 h-24 bg-[#36251c] motion-reduce:animate-none"
                    />
                  ))}
                </div>
              ) : quote.isError ? (
                <div>
                  <p role="alert" className="text-sm text-red-300">
                    {errorMessage(quote.error)}
                  </p>

                  <Button
                    type="button"
                    className="mt-4"
                    disabled={quote.isFetching}
                    onClick={() => void quote.refetch()}
                  >
                    Tentar novamente
                  </Button>

                  <p className="mt-6 text-xs text-[#c9b6a5]">
                    Você pode diminuir a quantidade ou remover um item:
                  </p>

                  <ul className="mt-3 space-y-3">
                    {items.map((item) => (
                      <li
                        key={`${item.nftId}:${item.editionId}`}
                        className="flex flex-wrap items-center gap-3 rounded-md bg-[#281a13] p-4 text-xs"
                      >
                        <span className="min-w-0 break-all">
                          {item.editionId}
                        </span>

                        <Button
                          type="button"
                          disabled={item.quantity <= 1}
                          aria-label={`Diminuir quantidade de ${item.editionId}`}
                          onClick={() =>
                            changeQuantity(
                              item.nftId,
                              item.editionId,
                              item.quantity - 1,
                            )
                          }
                        >
                          −
                        </Button>

                        <span>{item.quantity}</span>

                        <Button
                          type="button"
                          onClick={() =>
                            removeItem(item.nftId, item.editionId)
                          }
                        >
                          Remover
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_90px_100px_100px_36px] gap-3 border-b border-[#705039]/50 pb-3 text-xs md:grid">
                    <span>NFTs</span>
                    <span>Preço</span>
                    <span>Edições</span>
                    <span>Total</span>
                    <span className="sr-only">Remover</span>
                  </div>

                  <ul className="space-y-3">
                    {quote.data?.items.map((item) => (
                      <li
                        key={`${item.nftId}:${item.editionId}`}
                        className="grid items-center gap-4 rounded-md bg-[#281a13] p-3 md:grid-cols-[minmax(0,1fr)_90px_100px_100px_36px] md:gap-3"
                      >
                        <Link
                          to="/nfts/$nftId"
                          params={{ nftId: item.nftId }}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <img
                            src={item.imageUrl}
                            alt=""
                            width={64}
                            height={64}
                            className="size-16 shrink-0 rounded-md object-cover"
                          />

                          <div className="min-w-0">
                            <h2 className="text-xs font-bold">
                              {item.name}
                            </h2>

                            <p className="mt-1 text-xs text-[#c9b6a5]">
                              Edição: {item.editionName}
                            </p>
                          </div>
                        </Link>

                        <p className="text-xs text-[#c9b6a5]">
                          <span className="md:sr-only">Preço: </span>
                          {item.unitPriceEth} ETH
                        </p>

                        <div
                          role="group"
                          aria-label={`Quantidade de ${item.name}, edição ${item.editionName}`}
                          className="flex items-center gap-2"
                        >
                          <Button
                            type="button"
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              changeQuantity(
                                item.nftId,
                                item.editionId,
                                item.quantity - 1,
                              )
                            }
                            className={`h-8 w-6 rounded-full p-0 ${orangeButton}`}
                          >
                            −
                          </Button>

                          <span className="text-xs">{item.quantity}</span>

                          <Button
                            type="button"
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            disabled={
                              item.quantity >=
                              Math.min(item.availableQuantity, 100)
                            }
                            onClick={() =>
                              changeQuantity(
                                item.nftId,
                                item.editionId,
                                item.quantity + 1,
                              )
                            }
                            className={`h-8 w-6 rounded-full p-0 ${orangeButton}`}
                          >
                            +
                          </Button>
                        </div>

                        <p className="text-xs font-bold text-[#e6a15a]">
                          <span className="md:sr-only">Total: </span>
                          {item.totalEth} ETH
                        </p>

                        <button
                          type="button"
                          aria-label={`Remover ${item.name}, edição ${item.editionName}`}
                          onClick={() =>
                            removeItem(item.nftId, item.editionId)
                          }
                          className="flex size-9 items-center justify-center rounded text-[#c9b6a5] hover:text-red-300"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            aria-hidden="true"
                          >
                            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <aside aria-labelledby="cart-summary-title">
              <h2
                id="cart-summary-title"
                className="border-b border-[#705039]/50 pb-3 text-sm font-bold"
              >
                Resumo da carteira
              </h2>

              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)

                  setCoupon(
                    String(form.get('coupon') ?? '').trim().toUpperCase(),
                  )
                }}
              >
                <label htmlFor="cart-coupon" className="text-xs">
                  Código promocional
                </label>

                <div className="mt-2 flex">
                  <Input
                    id="cart-coupon"
                    name="coupon"
                    placeholder="Digite o código promocional..."
                    className="min-w-0 rounded-r-none border-[#705039] bg-transparent text-xs"
                  />

                  <Button
                    type="submit"
                    className={`rounded-l-none text-xs ${orangeButton}`}
                  >
                    Aplicar
                  </Button>
                </div>
              </form>

              {coupon && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span>Código informado: {coupon}</span>

                  <button
                    type="button"
                    onClick={() => setCoupon('')}
                    className="underline"
                  >
                    Remover código
                  </button>
                </div>
              )}

              {quote.isSuccess && quote.data ? (
                <dl className="mt-6 space-y-4 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt>Subtotal</dt>
                    <dd>{quote.data.subtotalEth} ETH</dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt>Desconto do lançamento</dt>
                    <dd>− {quote.data.discountEth} ETH</dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt>Taxa de rede</dt>
                    <dd>{quote.data.networkFeeEth} ETH</dd>
                  </div>

                  <div className="flex justify-between gap-3 border-t border-[#705039]/50 pt-4 font-bold">
                    <dt>Total</dt>
                    <dd className="text-[#e6a15a]">
                      {quote.data.totalEth} ETH
                    </dd>
                  </div>
                </dl>
              ) : (
                <p role="status" className="mt-6 text-xs text-[#c9b6a5]">
                  {quote.isError
                    ? 'Corrija o carrinho ou o código para calcular o total.'
                    : 'Calculando valores...'}
                </p>
              )}

              <Button
                type="button"
                disabled={!quote.isSuccess || quote.isFetching}
                onClick={() => void navigate({ to: '/pagamento' })}
                className={`mt-6 w-full text-xs ${orangeButton}`}
              >
                Conectar e finalizar
              </Button>

              <Link
                to="/"
                search={initialSearch}
                hash="catalogo"
                className="mt-4 block text-center text-xs text-[#e6a15a]"
              >
                Continuar explorando
              </Link>
            </aside>
          </div>
        )}

        <CartRecommendations />
      </main>

      <div className="px-6 pb-6">
        <SiteFooter />
      </div>
    </div>
  )
}

function CartRecommendations() {
  const items = useCartItems()
  const [page, setPage] = useState(0)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['nfts', { sort: 'newest', page: 1, pageSize: 50 }],
    queryFn: ({ signal }) =>
      getNfts({ sort: 'newest', page: 1, pageSize: 50 }, signal),
  })

  const recommendations =
    data?.items.filter(
      (nft) => !items.some((item) => item.nftId === nft.id),
    ) ?? []

  const totalPages = Math.ceil(recommendations.length / 5)
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))
  const visibleItems = recommendations.slice(
    currentPage * 5,
    currentPage * 5 + 5,
  )

  return (
    <section className="mb-12 mt-16" aria-labelledby="recommendations-title">
      <h2
        id="recommendations-title"
        className="border-b border-[#705039]/50 pb-3 text-sm font-bold text-[#e6a15a]"
      >
        Colecionadores também viram
      </h2>

      {isPending ? (
        <div
          role="status"
          aria-label="Carregando sugestões"
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              className="aspect-square bg-[#36251c] motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="mt-6">
          <p className="text-xs">Não foi possível carregar sugestões.</p>

          <Button
            type="button"
            className="mt-3"
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : recommendations.length ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {visibleItems.map((nft) => {
              const edition =
                nft.editions.find((item) => item.name === '1/50') ??
                nft.editions[0]

              return (
                <Link
                  key={nft.id}
                  to="/nfts/$nftId"
                  params={{ nftId: nft.id }}
                  className="min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6a15a]"
                >
                  <div className="rounded-md bg-[#281a13] p-3">
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

                  <h3 className="mt-3 text-xs">{nft.name}</h3>

                  <p className="mt-1 text-xs font-bold text-[#e6a15a]">
                    {edition
                      ? `${edition.priceEth} ETH`
                      : 'Sem edição disponível'}
                  </p>
                </Link>
              )
            })}
          </div>

          <nav
            aria-label="Páginas de sugestões"
            className="mt-5 flex justify-center gap-1"
          >
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Mostrar página ${index + 1} de sugestões`}
                aria-current={currentPage === index ? 'page' : undefined}
                onClick={() => setPage(index)}
                className="flex size-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#e6a15a]"
              >
                <span
                  className={`size-2 rounded-full border border-[#cf8946] ${
                    currentPage === index ? 'bg-[#cf8946]' : ''
                  }`}
                />
              </button>
            ))}
          </nav>
        </>
      ) : (
        <p className="mt-6 text-xs text-[#c9b6a5]">
          Nenhuma sugestão disponível.
        </p>
      )}
    </section>
  )
}