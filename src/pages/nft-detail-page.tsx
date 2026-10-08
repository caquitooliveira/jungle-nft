import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { getNft, getNfts } from '@/services/nft-service'
import type { Nft } from '@/types/nft'
import { BuyNftButton } from '@/components/nft/buy-nft-button'
import { FavoriteButton } from '@/components/nft/favorite-button'


const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

const orangeButton =
  'bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]'

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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeSection, setActiveSection] = useState<
    'details' | 'reviews'
  >('details')
  const [shareMessage, setShareMessage] = useState('')
  const [selectedEditionId, setSelectedEditionId] = useState(
    () =>
      nft.editions.find(
        (edition) =>
          edition.name === '1/50' && edition.availableQuantity > 0,
      )?.id ??
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
  const gallery = nft.gallery.length ? nft.gallery : [nft.imageUrl]
  const imageUrl = gallery[selectedImage] ?? nft.imageUrl
  const averageRating = nft.reviews.length
    ? nft.reviews.reduce((total, review) => total + review.rating, 0) /
      nft.reviews.length
    : 0

  async function shareNft() {
    setShareMessage('')

    try {
      if (navigator.share) {
        await navigator.share({
          title: nft.name,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setShareMessage('Link copiado.')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      setShareMessage('Não foi possível compartilhar o link.')
    }
  }

  return (
    <>
      <section className="grid items-start gap-8 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col-reverse gap-4 sm:flex-row">
          <div
            role="group"
            aria-label="Miniaturas do NFT"
            className="flex gap-3 sm:w-20 sm:shrink-0 sm:flex-col"
          >
            {gallery.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`Selecionar imagem ${index + 1}`}
                aria-pressed={selectedImage === index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square min-w-0 flex-1 overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6a15a] sm:flex-none ${
                  selectedImage === index
                    ? 'border-[#e6a15a]'
                    : 'border-transparent'
                }`}
              >
                <img
                  src={image}
                  alt=""
                  width={1254}
                  height={1254}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 rounded-lg bg-[#281a13] p-4">
            <img
              src={imageUrl}
              alt={nft.name}
              width={1254}
              height={1254}
              fetchPriority="high"
              className="aspect-square w-full rounded-xl object-cover"
            />

            <button
              type="button"
              aria-label={`Ampliar imagem de ${nft.name}`}
              onClick={() => dialogRef.current?.showModal()}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-[#281a13] text-white focus-visible:outline-2 focus-visible:outline-[#e6a15a]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="6" />
                <path d="m15 15 6 6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{nft.name}</h1>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xl font-bold text-[#e6a15a]">
              {edition
                ? `${edition.priceEth} ETH`
                : 'Sem edição disponível'}
            </p>

            <button
              type="button"
              onClick={() => {
                setActiveSection('reviews')
                document.getElementById('nft-information')?.scrollIntoView({
                  behavior: 'instant',
                  block: 'start',
                })
              }}
              className="flex flex-wrap items-center gap-2 text-xs"
            >
              <span
                className="text-[#e6a15a]"
                aria-label={`Nota ${averageRating.toFixed(1)} de 5`}
              >
                <span aria-hidden="true">
                  {'★'.repeat(Math.round(averageRating))}
                  {'☆'.repeat(5 - Math.round(averageRating))}
                </span>
              </span>

              <span>{nft.reviews.length} avaliações de colecionadores</span>
            </button>
          </div>

          <div className="mt-4 border-t border-[#705039]/50 pt-4">
            <h2 className="text-xs font-bold">Sobre este NFT:</h2>

            <p className="mt-2 text-xs leading-6 text-[#c9b6a5]">
              {nft.description}
            </p>
          </div>

          <fieldset className="mt-4">
            <legend className="mb-2 text-xs font-bold">
              Edição:
            </legend>

            {nft.editions.length === 0 ? (
              <p className="text-xs text-[#c9b6a5]">
                Este NFT ainda não possui edições.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nft.editions.map((item) => (
                  <label
                    key={item.id}
                    className={`cursor-pointer rounded-full border px-2 py-1 text-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#e6a15a] ${
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
                      className="sr-only"
                    />

                    {item.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div
              role="group"
              aria-label="Quantidade"
              className="flex items-center gap-3"
            >
              <Button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={effectiveQuantity <= 1}
                onClick={() =>
                  setQuantity(Math.max(1, effectiveQuantity - 1))
                }
                className={`h-10 w-8 rounded-full p-0 ${orangeButton}`}
              >
                −
              </Button>

              <span role="status" aria-atomic="true">
                <span className="sr-only">Quantidade: </span>
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
                className={`h-10 w-8 rounded-full p-0 ${orangeButton}`}
              >
                +
              </Button>
            </div>

            <div className="flex gap-2">
              <BuyNftButton
                nftId={nft.id}
                editionId={edition?.id ?? ''}
                quantity={effectiveQuantity}
                availableQuantity={availableQuantity}
              />

              <FavoriteButton nftId={nft.id} />
            </div>
          </div>

          <p className="mt-3 text-xs text-[#c9b6a5]">
            {availableQuantity > 0
              ? `${availableQuantity} unidades disponíveis nesta edição.`
              : 'Edição indisponível.'}
          </p>

          <dl className="mt-5 space-y-3 text-xs text-[#c9b6a5]">
            <div>
              <dt className="inline">ID do token: </dt>
              <dd className="inline">{nft.id}</dd>
            </div>

            <div>
              <dt className="inline">Coleção: </dt>
              <dd className="inline">{nft.collection}</dd>
            </div>

            <div>
              <dt className="inline">Atributos: </dt>
              <dd className="inline">{nft.attributes.join(', ')}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span>Compartilhar este NFT:</span>

            <button
              type="button"
              onClick={() => void shareNft()}
              className="underline underline-offset-4"
            >
              Compartilhar link
            </button>
          </div>

          <p role="status" className="mt-2 text-xs text-[#e6a15a]">
            {shareMessage}
          </p>
        </div>
      </section>

      <section
        id="nft-information"
        className="mt-12 scroll-mt-6"
        aria-label="Informações do NFT"
      >
        <div className="flex flex-wrap gap-6 border-b border-[#705039]/50">
          <button
            type="button"
            aria-pressed={activeSection === 'details'}
            aria-controls="nft-information-content"
            onClick={() => setActiveSection('details')}
            className={`border-b-2 pb-3 text-sm ${
              activeSection === 'details'
                ? 'border-[#e6a15a] text-[#e6a15a]'
                : 'border-transparent'
            }`}
          >
            Detalhes do NFT
          </button>

          <button
            type="button"
            aria-pressed={activeSection === 'reviews'}
            aria-controls="nft-information-content"
            onClick={() => setActiveSection('reviews')}
            className={`border-b-2 pb-3 text-sm ${
              activeSection === 'reviews'
                ? 'border-[#e6a15a] text-[#e6a15a]'
                : 'border-transparent'
            }`}
          >
            Avaliações de colecionadores ({nft.reviews.length})
          </button>
        </div>

        <div id="nft-information-content" className="min-h-48 py-5">
          {activeSection === 'details' ? (
            <div className="space-y-5 text-xs leading-6 text-[#c9b6a5]">
              {nft.details.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}

              <div>
                <h2 className="font-bold text-[#f5eee8]">Rede:</h2>
                <p>{nft.networkDescription}</p>
              </div>

              <div>
                <h2 className="font-bold text-[#f5eee8]">Contrato:</h2>
                <p>{nft.contractDescription}</p>
                <p className="break-all">{nft.contractAddress}</p>
              </div>

              <div>
                <h2 className="font-bold text-[#f5eee8]">
                  Direitos autorais:
                </h2>
                <p>
                  Percentual demonstrativo do criador: {nft.royaltyPercent}%.
                  A compra não transfere automaticamente os direitos
                  autorais da arte.
                </p>
              </div>
            </div>
          ) : nft.reviews.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {nft.reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-lg border border-[#705039]/50 bg-[#281a13] p-4"
                >
                  <h2 className="text-sm font-bold">{review.collector}</h2>

                  <p
                    className="mt-2 text-[#e6a15a]"
                    aria-label={`Nota ${review.rating} de 5`}
                  >
                    <span aria-hidden="true">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                  </p>

                  <p className="mt-3 text-xs leading-6 text-[#c9b6a5]">
                    {review.comment}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#c9b6a5]">
              Ainda não há avaliações para este NFT.
            </p>
          )}
        </div>
      </section>

      <RelatedNfts key={nft.id} nft={nft} />

      <dialog
        ref={dialogRef}
        aria-labelledby="image-dialog-title"
        className="m-auto max-h-[90svh] w-[calc(100%-2rem)] max-w-3xl overflow-auto rounded-xl border border-[#705039] bg-[#281a13] p-4 text-[#f5eee8] backdrop:bg-black/80"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="image-dialog-title" className="font-bold">
            {nft.name}
          </h2>

          <Button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className={orangeButton}
          >
            Fechar
          </Button>
        </div>

        <img
          src={imageUrl}
          alt={nft.name}
          width={1254}
          height={1254}
          className="h-auto w-full rounded-lg"
        />
      </dialog>
    </>
  )
}

function RelatedNfts({ nft }: { nft: Nft }) {
  const [page, setPage] = useState(0)

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['nfts', { sort: 'newest', page: 1, pageSize: 50 }],
    queryFn: ({ signal }) =>
      getNfts(
        { sort: 'newest', page: 1, pageSize: 50 },
        signal,
      ),
  })

  const items =
    data?.items.filter(
      (item) => item.id !== nft.id && item.collection === nft.collection,
    ) ?? []

  const totalPages = Math.ceil(items.length / 5)
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))
  const visibleItems = items.slice(currentPage * 5, currentPage * 5 + 5)

  return (
    <section aria-labelledby="related-nfts-title" className="mb-12 mt-10">
      <h2
        id="related-nfts-title"
        className="border-b border-[#705039]/50 pb-3 text-sm font-bold text-[#e6a15a]"
      >
        Mais desta coleção
      </h2>

      {isPending ? (
        <div
          role="status"
          aria-label="Carregando NFTs relacionados"
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
          <p className="text-sm">
            Não foi possível carregar os NFTs desta coleção.
          </p>

          <Button
            type="button"
            className="mt-3"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : items.length ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {visibleItems.map((item) => {
              const standardEdition = item.editions.find(
                (edition) => edition.name === '1/50',
              ) ?? item.editions[0]

              return (
                <Link
                  key={item.id}
                  to="/nfts/$nftId"
                  params={{ nftId: item.id }}
                  className="min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6a15a]"
                >
                  <div className="rounded-md bg-[#281a13] p-3">
                    <img
                      src={item.imageUrl}
                      alt=""
                      width={1254}
                      height={1254}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  </div>

                  <h3 className="mt-3 text-xs">{item.name}</h3>

                  <p className="mt-1 text-xs font-bold text-[#e6a15a]">
                    {standardEdition
                      ? `${standardEdition.priceEth} ETH`
                      : 'Sem edição disponível'}
                  </p>
                </Link>
              )
            })}
          </div>

          <nav
            aria-label="Páginas de NFTs da coleção"
            className="mt-5 flex justify-center gap-1"
          >
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Mostrar página ${index + 1} da coleção`}
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
        <p className="mt-6 text-sm text-[#c9b6a5]">
          Nenhum outro NFT disponível nesta coleção.
        </p>
      )}
    </section>
  )
}