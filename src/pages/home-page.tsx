import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getNfts } from '@/services/nft-service'

export function HomePage() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['nfts', { page: 1, pageSize: 9, sort: 'newest' }],
    queryFn: ({ signal }) =>
      getNfts({ page: 1, pageSize: 9, sort: 'newest' }, signal),
  })

  return (
    <main className="min-h-screen bg-[#160e0a] px-6 py-10 font-mono text-[#f5eee8]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Kurio NFT Marketplace</h1>
        <p className="mt-3 text-[#c7aa88]">
          Descubra nossa coleção de arte digital.
        </p>

        {isPending ? (
          <div
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Carregando NFTs"
          >
            {Array.from({ length: 9 }, (_, index) => (
              <Skeleton
                key={index}
                className="aspect-square bg-[#36251c] motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-8" role="alert">
            <p>Não foi possível carregar os NFTs.</p>
            <Button
              className="mt-4"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              Tentar novamente
            </Button>
          </div>
        ) : data?.items.length === 0 ? (
          <p className="mt-8" role="status">
            Nenhum NFT encontrado.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((nft) => (
              <article key={nft.id} className="bg-[#281a13] p-4">
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  width={1254}
                  height={1254}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <h2 className="mt-4 font-bold">{nft.name}</h2>
                <p className="mt-2 text-[#e6a15a]">
                  {nft.editions[0]?.priceEth} ETH
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}