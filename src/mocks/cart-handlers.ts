import { delay, http, HttpResponse } from 'msw'
import { nfts } from './nft-db'
import { ethToWei, weiToEth } from '@/lib/eth'
import type {
  CartQuote,
  CartQuoteLine,
} from '@/types/cart'

function invalidRequest(message: string) {
  return HttpResponse.json(
    { code: 'INVALID_CART', message },
    { status: 400 },
  )
}

export const cartHandlers = [
  http.post('/api/cart/quote', async ({ request }) => {
    await delay(300)

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return invalidRequest('O conteúdo do carrinho é inválido.')
    }

    if (!body || typeof body !== 'object') {
      return invalidRequest('O conteúdo do carrinho é inválido.')
    }

    const payload = body as Record<string, unknown>

    if (
      !Array.isArray(payload.items) ||
      payload.items.length > 100
    ) {
      return invalidRequest('Informe uma lista válida de itens.')
    }

    if (
      payload.coupon !== undefined &&
      typeof payload.coupon !== 'string'
    ) {
      return invalidRequest('Informe um código promocional válido.')
    }

    const coupon =
      typeof payload.coupon === 'string'
        ? payload.coupon.trim().toUpperCase()
        : ''

    if (coupon && coupon !== 'KURIO10') {
      return HttpResponse.json(
        {
          code: 'INVALID_COUPON',
          message: 'Código promocional inválido.',
        },
        { status: 400 },
      )
    }

    const lines: CartQuoteLine[] = []
    const seen = new Set<string>()
    let subtotal = 0n

    for (const rawItem of payload.items) {
      if (!rawItem || typeof rawItem !== 'object') {
        return invalidRequest('Um dos itens é inválido.')
      }

      const item = rawItem as Record<string, unknown>

      if (
        typeof item.nftId !== 'string' ||
        typeof item.editionId !== 'string' ||
        typeof item.quantity !== 'number' ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return invalidRequest('Um dos itens possui dados inválidos.')
      }

      const key = `${item.nftId}:${item.editionId}`

      if (seen.has(key)) {
        return invalidRequest('O carrinho contém edições duplicadas.')
      }

      seen.add(key)

      const nft = nfts.find((entry) => entry.id === item.nftId)
      const edition = nft?.editions.find(
        (entry) => entry.id === item.editionId,
      )

      if (!nft || !edition) {
        return HttpResponse.json(
          {
            code: 'CART_ITEM_NOT_FOUND',
            message: 'Um NFT ou uma edição não está mais disponível.',
          },
          { status: 409 },
        )
      }

      if (item.quantity > edition.availableQuantity) {
        return HttpResponse.json(
          {
            code: 'INSUFFICIENT_STOCK',
            message:
              `A edição ${edition.name} de ${nft.name} possui ` +
              `${edition.availableQuantity} unidades disponíveis.`,
          },
          { status: 409 },
        )
      }

      const lineTotal =
        ethToWei(edition.priceEth) * BigInt(item.quantity)

      subtotal += lineTotal

      lines.push({
        nftId: nft.id,
        editionId: edition.id,
        quantity: item.quantity,
        name: nft.name,
        imageUrl: nft.imageUrl,
        editionName: edition.name,
        unitPriceEth: edition.priceEth,
        totalEth: weiToEth(lineTotal),
        availableQuantity: edition.availableQuantity,
      })
    }

    const discount = coupon ? subtotal / 10n : 0n
    const networkFee = lines.length ? ethToWei('0.016') : 0n

    return HttpResponse.json<CartQuote>({
      items: lines,
      subtotalEth: weiToEth(subtotal),
      discountEth: weiToEth(discount),
      networkFeeEth: weiToEth(networkFee),
      totalEth: weiToEth(subtotal - discount + networkFee),
      coupon: coupon || null,
    })
  }),
]