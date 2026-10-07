import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { getNft } from '@/services/nft-service'
import type { Nft } from '@/types/nft'


const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['nft', nftId],
    queryFn: ({ signal }) => getNft(nftId, signal),
    retry: (failureCount, queryError) => {
      if (
        isAxiosError(queryError) &&
        queryError.response?.status === 404
      ) {
        return false
      }

      return failureCount < 1
    },
  })

  const isNotFound =
    isAxiosError(error) && error.response?.status === 404

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
            <label htmlFor="detail-search" className="sr-only">
              Buscar NFT ou criador
            </label>

            <Input
              autoFocus
              id="detail-search"
              name="search"
              placeholder="Buscar NFT ou criador"
              className="border-[#705039] bg-[#281a13]"
            />

            <Button type="submit">Buscar</Button>
          </form>
        )}

        <nav aria-label="Caminho da página" className="mb-6 text-sm">
          <Link
            to="/"
            search={initialSearch}
            className="underline underline-offset-4"
          >
            Início
          </Link>

          <span aria-hidden="true"> / </span>
          <span>Detalhes do NFT</span>
        </nav>

        {isPending ? (
          <div
            role="status"
            aria-label="Carregando detalhes do NFT"
            className="grid gap-8 lg:grid-cols-2"
          >
            <Skeleton className="aspect-square bg-[#36251c] motion-reduce:animate-none" />

            <div className="space-y-5">
              <Skeleton className="h-10 w-3/4 bg-[#36251c] motion-reduce:animate-none" />
              <Skeleton className="h-8 w-1/3 bg-[#36251c] motion-reduce:animate-none" />
              <Skeleton className="h-32 bg-[#36251c] motion-reduce:animate-none" />
            </div>
          </div>
        ) : isError ? (
          <section role="alert" className="py-12">
            <h1 className="text-2xl font-bold">
              {isNotFound
                ? 'NFT não encontrado'
                : 'Não foi possível carregar este NFT'}
            </h1>

            <p className="mt-3 text-[#c9b6a5]">
              {isNotFound
                ? 'Este NFT não está disponível no catálogo.'
                : 'Tente carregar os dados novamente.'}
            </p>

            {!isNotFound && (
              <Button
                type="button"
                className="mt-6"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Tentar novamente
              </Button>
            )}
          </section>
        ) : data ? (
          <NftDetails key={data.id} nft={data} />
        ) : null}
      </main>

      <div className="px-6 pb-6">
        <SiteFooter />
      </div>
    </div>
  )
}

function NftDetails({ nft }: { nft: Nft }) {
  const [selectedEditionId, setSelectedEditionId] = useState(
    () =>
      nft.editions.find((edition) => edition.availableQuantity > 0)?.id ??
      nft.editions[0]?.id ??
      '',
  )
  const [quantity, setQuantity] = useState(1)

  const edition = nft.editions.find(
    (item) => item.id === selectedEditionId,
  )
  const availableQuantity = Math.max(
    0,
    edition?.availableQuantity ?? 0,
  )
  const effectiveQuantity = Math.min(quantity, availableQuantity)

  return (
    <>
      <section className="grid items-start gap-8 lg:grid-cols-2">
        <div className="rounded-xl bg-[#281a13] p-4">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            width={1254}
            height={1254}
            fetchPriority="high"
            className="aspect-square w-full rounded-lg object-cover"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {nft.name}
          </h1>

          <p className="mt-3 text-xl font-bold text-[#e6a15a]">
            {edition ? `${edition.priceEth} ETH` : 'Sem edição disponível'}
          </p>

          <div className="mt-5 border-t border-[#705039]/50 pt-5">
            <h2 className="font-bold">Sobre este NFT</h2>

            <p className="mt-3 text-sm leading-7 text-[#c9b6a5]">
              {nft.description}
            </p>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-bold">
              Edição
            </legend>

            {nft.editions.length === 0 ? (
              <p className="text-sm text-[#c9b6a5]">
                Este NFT ainda não possui edições.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nft.editions.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${
                      selectedEditionId === item.id
                        ? 'border-[#e6a15a] text-[#e6a15a]'
                        : 'border-[#705039] text-[#c9b6a5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`edition-${nft.id}`}
                      value={item.id}
                      checked={selectedEditionId === item.id}
                      onChange={() => {
                        setSelectedEditionId(item.id)
                        setQuantity(1)
                      }}
                      className="accent-[#e6a15a]"
                    />

                    {item.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="mt-6">
            <p id="quantity-label" className="mb-3 text-sm font-bold">
              Quantidade
            </p>

            <div
              role="group"
              aria-labelledby="quantity-label"
              className="flex items-center gap-4"
            >
              <Button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={effectiveQuantity <= 1}
                onClick={() =>
                  setQuantity(Math.max(1, effectiveQuantity - 1))
                }
                className="bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]"
              >
                −
              </Button>

              <span role="status" aria-atomic="true">
                {effectiveQuantity}
              </span>

              <Button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={effectiveQuantity >= availableQuantity}
                onClick={() =>
                  setQuantity(
                    Math.min(availableQuantity, effectiveQuantity + 1),
                  )
                }
                className="bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]"
              >
                +
              </Button>
            </div>

            <p className="mt-3 text-xs text-[#c9b6a5]">
              {availableQuantity > 0
                ? `${availableQuantity} unidades disponíveis nesta edição.`
                : 'Edição indisponível.'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              disabled
              aria-describedby="purchase-status"
              className="bg-[#cf8946] text-[#160e0a]"
            >
              Comprar
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled
              aria-describedby="purchase-status"
              className="border-[#705039] bg-transparent text-[#e6a15a]"
            >
              Favoritar
            </Button>
          </div>

          <p
            id="purchase-status"
            className="mt-3 text-xs text-[#c9b6a5]"
          >
            Compra e favoritos serão habilitados nas próximas etapas.
          </p>

          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="inline text-[#c9b6a5]">Criador: </dt>
              <dd className="inline">{nft.creator}</dd>
            </div>

            <div>
              <dt className="inline text-[#c9b6a5]">Categoria: </dt>
              <dd className="inline">{nft.category}</dd>
            </div>

            <div>
              <dt className="inline text-[#c9b6a5]">Rede: </dt>
              <dd className="inline capitalize">{nft.network}</dd>
            </div>

            <div>
              <dt className="inline text-[#c9b6a5]">Identificador: </dt>
              <dd className="inline">{nft.id}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="nft-description-title"
        className="mt-12"
      >
        <h2
          id="nft-description-title"
          className="border-b border-[#705039]/50 pb-3 font-bold text-[#e6a15a]"
        >
          Detalhes do NFT
        </h2>

        <p className="mt-4 text-sm leading-7 text-[#c9b6a5]">
          {nft.description}
        </p>
      </section>
    </>
  )
}