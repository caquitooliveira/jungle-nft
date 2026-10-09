import { http, HttpResponse } from 'msw'
import { updateNftEdition } from './nft-db'

export const demoHandlers = [
  http.post('/api/mock/nfts/:id', async ({ request, params }) => {
    try {
      const body: unknown = await request.json()

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Informe os dados da edição.')
      }

      const value = body as Record<string, unknown>

      if (
        typeof value.editionId !== 'string' ||
        (value.priceEth !== undefined &&
          typeof value.priceEth !== 'string') ||
        (value.availableQuantity !== undefined &&
          typeof value.availableQuantity !== 'number')
      ) {
        throw new Error('Informe edição, preço e estoque válidos.')
      }

      const nft = updateNftEdition(String(params.id), value.editionId, {
        priceEth: value.priceEth as string | undefined,
        availableQuantity: value.availableQuantity as number | undefined,
      })

      return HttpResponse.json(nft)
    } catch (error) {
      return HttpResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o NFT.',
        },
        { status: 400 },
      )
    }
  }),
]