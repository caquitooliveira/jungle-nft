import { delay, http, HttpResponse } from 'msw'
import { findSession } from './auth-db'
import { calculateCartQuote, MockApiError } from './cart-quote'
import type { CartQuote } from '@/types/cart'
import type {
  CollectorProfile,
  CheckoutWallet,
  Order,
} from '@/types/order'

interface StoredOrder {
  order: Order
  fingerprint: string
}

const storageKey = 'kurio:mock-orders:v1'

function readOrders(): StoredOrder[] {
  const stored = localStorage.getItem(storageKey)

  if (!stored) {
    return []
  }

  const parsed: unknown = JSON.parse(stored)

  if (!Array.isArray(parsed)) {
    throw new Error('A base de pedidos é inválida.')
  }

  return parsed as StoredOrder[]
}

function saveOrders(orders: StoredOrder[]) {
  localStorage.setItem(storageKey, JSON.stringify(orders))
}

function getToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
}

function fail(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status })
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>

    return `{${Object.keys(object)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify(object[key])}`,
      )
      .join(',')}}`
  }

  return JSON.stringify(value) ?? 'null'
}

function quoteSignature(quote: CartQuote) {
  return stableStringify({
    items: quote.items.map((item) => ({
      nftId: item.nftId,
      editionId: item.editionId,
      quantity: item.quantity,
      unitPriceEth: item.unitPriceEth,
      totalEth: item.totalEth,
    })),
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    coupon: quote.coupon,
  })
}

function readProfile(value: unknown): CollectorProfile {
  if (!value || typeof value !== 'object') {
    throw new MockApiError(
      400,
      'INVALID_PROFILE',
      'Preencha o perfil do colecionador.',
    )
  }

  const raw = value as Record<string, unknown>

  const field = (name: string, required = false) => {
    const value = raw[name]

    if (value !== undefined && typeof value !== 'string') {
      throw new MockApiError(
        400,
        'INVALID_PROFILE',
        'Os campos do perfil devem conter texto.',
      )
    }

    const text = typeof value === 'string' ? value.trim() : ''

    if ((required && !text) || text.length > 500) {
      throw new MockApiError(
        400,
        'INVALID_PROFILE',
        'Confira os campos obrigatórios do perfil.',
      )
    }

    return text
  }

  const profile: CollectorProfile = {
    displayName: field('displayName', true),
    username: field('username', true),
    profileName: field('profileName', true),
    email: field('email', true),
    referralCode: field('referralCode'),
    ensName: field('ensName'),
    secondaryWallet: field('secondaryWallet'),
    observation: field('observation'),
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    throw new MockApiError(
      400,
      'INVALID_PROFILE',
      'Informe um e-mail válido.',
    )
  }

  return profile
}

function readWallet(value: unknown): CheckoutWallet {
  if (!value || typeof value !== 'object') {
    throw new MockApiError(
      400,
      'INVALID_WALLET',
      'Selecione uma carteira.',
    )
  }

  const wallet = value as Record<string, unknown>

  if (
    !['metamask', 'walletconnect', 'coinbase'].includes(
      String(wallet.provider),
    ) ||
    !['ethereum', 'polygon', 'solana'].includes(
      String(wallet.network),
    ) ||
    typeof wallet.address !== 'string'
  ) {
    throw new MockApiError(
      400,
      'INVALID_WALLET',
      'Confira a carteira e a rede selecionadas.',
    )
  }

  const address = wallet.address.trim()
  const validAddress =
    wallet.network === 'solana'
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
      : /^0x[a-fA-F0-9]{40}$/.test(address)

  if (!validAddress) {
    throw new MockApiError(
      400,
      'INVALID_WALLET',
      'Informe um endereço válido para a rede selecionada.',
    )
  }

  return {
    provider: wallet.provider as CheckoutWallet['provider'],
    network: wallet.network as CheckoutWallet['network'],
    address,
  }
}

export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    await delay(300)

    const session = await findSession(getToken(request))

    if (!session) {
      return fail(
        401,
        'SESSION_EXPIRED',
        'Entre novamente para confirmar a compra.',
      )
    }

    const idempotencyKey = request.headers.get('Idempotency-Key')

    if (!idempotencyKey || idempotencyKey.length > 100) {
      return fail(
        400,
        'INVALID_IDEMPOTENCY_KEY',
        'A identificação da tentativa de compra é inválida.',
      )
    }

    try {
      const raw: unknown = await request.json()

      if (!raw || typeof raw !== 'object') {
        return fail(400, 'INVALID_ORDER', 'Pedido inválido.')
      }

      const body = raw as Record<string, unknown>
      const fingerprint = stableStringify(body)
      const orders = readOrders()

      const existing = orders.find(
        (entry) =>
          entry.order.userId === session.user.id &&
          entry.order.idempotencyKey === idempotencyKey,
      )

      if (existing) {
        if (existing.fingerprint !== fingerprint) {
          return fail(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Esta tentativa já foi usada para outro conteúdo.',
          )
        }

        return HttpResponse.json(existing.order)
      }

      const profile = readProfile(body.profile)
      const wallet = readWallet(body.wallet)
      const quote = calculateCartQuote(body)

      if (!quote.items.length) {
        return fail(400, 'EMPTY_CART', 'Seu carrinho está vazio.')
      }

      if (
        !body.acceptedQuote ||
        typeof body.acceptedQuote !== 'object'
      ) {
        return fail(
          400,
          'QUOTE_REQUIRED',
          'Confira o resumo antes de confirmar a compra.',
        )
      }

      const acceptedQuote = body.acceptedQuote as CartQuote

      if (!Array.isArray(acceptedQuote.items)) {
        return fail(400, 'QUOTE_REQUIRED', 'Resumo inválido.')
      }

      if (quoteSignature(acceptedQuote) !== quoteSignature(quote)) {
        return HttpResponse.json(
          {
            code: 'QUOTE_CHANGED',
            message:
              'Os valores mudaram. Confira o novo resumo e confirme novamente.',
            quote,
          },
          { status: 409 },
        )
      }

      const now = new Date().toISOString()

      const order: Order = {
        id: crypto.randomUUID(),
        userId: session.user.id,
        idempotencyKey,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        readyAt: Date.now() + 2_000,
        version: 1,
        transactionId:
          `0x${crypto.randomUUID().replaceAll('-', '')}` +
          crypto.randomUUID().replaceAll('-', ''),
        quote: structuredClone(quote),
        profile,
        wallet,
      }

      orders.push({ order, fingerprint })
      saveOrders(orders)

      return HttpResponse.json(order, { status: 201 })
    } catch (error) {
      if (error instanceof MockApiError) {
        return fail(error.status, error.code, error.message)
      }

      return fail(
        500,
        'ORDER_PROCESSING_ERROR',
        'Não foi possível processar o pedido. Consulte a tentativa antes de repetir.',
      )
    }
  }),

  http.get('/api/orders/by-key/:key', async ({ request, params }) => {
    const session = await findSession(getToken(request))

    if (!session) {
      return fail(401, 'SESSION_EXPIRED', 'Entre novamente.')
    }

    const stored = readOrders().find(
      (entry) =>
        entry.order.userId === session.user.id &&
        entry.order.idempotencyKey === params.key,
    )

    if (!stored) {
      return fail(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    }

    return HttpResponse.json(stored.order)
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await delay(150)

    const session = await findSession(getToken(request))

    if (!session) {
      return fail(401, 'SESSION_EXPIRED', 'Entre novamente.')
    }

    const orders = readOrders()
    const stored = orders.find(
      (entry) =>
        entry.order.id === params.id &&
        entry.order.userId === session.user.id,
    )

    if (!stored) {
      return fail(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
    }

    if (
      stored.order.status === 'pending' &&
      stored.order.readyAt <= Date.now()
    ) {
      stored.order = {
        ...stored.order,
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
        version: stored.order.version + 1,
      }

      saveOrders(orders)
    }

    return HttpResponse.json(stored.order)
  }),
]