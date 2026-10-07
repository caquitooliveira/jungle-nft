import { delay, http, HttpResponse } from 'msw'
import { createNftFixtures } from './nft-fixtures'
import type { NftListResponse } from '@/types/nft'

const nfts = createNftFixtures()

function positiveInteger(
  value: string | null,
  fallback: number,
  maximum: number,
) {
  const number = Number(value)

  return Number.isInteger(number) && number > 0
    ? Math.min(number, maximum)
    : fallback
}

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    await delay(400)

    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.trim().toLowerCase() ?? ''
    const categories = url.searchParams.getAll('category')
    const networks = url.searchParams.getAll('network')
    const sort = url.searchParams.get('sort') ?? 'newest'
    const page = positiveInteger(url.searchParams.get('page'), 1, 10_000)
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 9, 50)

    const filtered = nfts.filter((nft) => {
      const matchesSearch =
        `${nft.name} ${nft.creator}`.toLowerCase().includes(search)

      const matchesCategory =
        categories.length === 0 || categories.includes(nft.category)

      const matchesNetwork =
        networks.length === 0 || networks.includes(nft.network)

      return matchesSearch && matchesCategory && matchesNetwork
    })

    filtered.sort((first, second) => {
      if (sort === 'name') {
        return first.name.localeCompare(second.name)
      }

      return second.createdAt.localeCompare(first.createdAt)
    })

    const start = (page - 1) * pageSize

    return HttpResponse.json<NftListResponse>({
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    })
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(400)

    const nft = nfts.find((item) => item.id === params.id)

    if (!nft) {
      return HttpResponse.json(
        {
          code: 'NFT_NOT_FOUND',
          message: 'NFT não encontrado.',
        },
        { status: 404 },
      )
    }

    return HttpResponse.json(nft)
  }),
]