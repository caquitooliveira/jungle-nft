import { delay, http, HttpResponse } from 'msw'
import { findSession } from './auth-db'
import type {
  SavedWallet,
  SaveWalletRequest,
} from '@/types/profile'

const storageKey = 'kurio:mock-wallets:v1'

type WalletDatabase = Record<string, SavedWallet[]>

function getToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
}

function readDatabase(): WalletDatabase {
  const stored = localStorage.getItem(storageKey)

  if (!stored) {
    return {}
  }

  const database: unknown = JSON.parse(stored)

  if (
    !database ||
    typeof database !== 'object' ||
    Array.isArray(database)
  ) {
    throw new Error('Os dados salvos das carteiras são inválidos.')
  }

  for (const wallets of Object.values(database)) {
    if (
      !Array.isArray(wallets) ||
      wallets.length > 2 ||
      !wallets.every(
        (wallet) =>
          wallet &&
          typeof wallet === 'object' &&
          typeof wallet.id === 'string' &&
          validateWallet(wallet) === null,
      )
    ) {
      throw new Error('Os dados salvos das carteiras são inválidos.')
    }
  }

  return database as WalletDatabase
}

function validateWallet(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'Informe os dados da carteira.'
  }

  const wallet = value as Record<string, unknown>

  const fields = [
    'displayName',
    'nickname',
    'profileName',
    'address',
    'secondaryAddress',
    'referralCode',
    'email',
    'ensName',
  ]

  if (
    fields.some((field) => typeof wallet[field] !== 'string') ||
    typeof wallet.isPrimary !== 'boolean'
  ) {
    return 'Confira os dados da carteira.'
  }

  for (const field of ['displayName', 'nickname', 'profileName']) {
    const text = wallet[field] as string

    if (!text.trim() || text.length > 100) {
      return 'Preencha os nomes e o apelido com até 100 caracteres.'
    }
  }

  if (
    !['ethereum', 'polygon', 'solana'].includes(
      String(wallet.network),
    ) ||
    !['metamask', 'walletconnect', 'coinbase'].includes(
      String(wallet.provider),
    )
  ) {
    return 'Selecione uma rede e um tipo de carteira válidos.'
  }

  const addressPattern =
    wallet.network === 'solana'
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      : /^0x[a-fA-F0-9]{40}$/

  if (!addressPattern.test((wallet.address as string).trim())) {
    return 'Informe um endereço válido para a rede selecionada.'
  }

  const email = (wallet.email as string).trim()

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return 'Informe um e-mail válido.'
  }

  const ensName = (wallet.ensName as string).trim()

  if (
    ensName.length > 100 ||
    (ensName !== '' &&
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(eth|sol)$/i.test(ensName))
  ) {
    return 'Informe um nome válido, como caio.eth.'
  }

  if (
    (wallet.secondaryAddress as string).length > 100 ||
    (wallet.referralCode as string).length > 100
  ) {
    return 'A carteira secundária e o código devem ter até 100 caracteres.'
  }

  return null
}

function sessionExpired() {
  return HttpResponse.json(
    {
      code: 'SESSION_EXPIRED',
      message: 'Sua sessão expirou. Entre novamente.',
    },
    { status: 401 },
  )
}

function unexpectedError(error: unknown) {
  return HttpResponse.json(
    {
      code: 'WALLET_ERROR',
      message:
        error instanceof SyntaxError
          ? 'Os dados enviados ou salvos são inválidos.'
          : 'Não foi possível acessar as carteiras. Tente novamente.',
    },
    { status: 500 },
  )
}

export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    await delay(200)

    try {
      const session = await findSession(getToken(request))

      if (!session) {
        return sessionExpired()
      }

      const database = readDatabase()

      return HttpResponse.json(database[session.user.id] ?? [])
    } catch (error) {
      return unexpectedError(error)
    }
  }),

  http.put('/api/wallets', async ({ request }) => {
    await delay(300)

    try {
      const session = await findSession(getToken(request))

      if (!session) {
        return sessionExpired()
      }

      let body: unknown

      try {
        body = await request.json()
      } catch {
        return HttpResponse.json(
          {
            code: 'INVALID_BODY',
            message: 'Os dados enviados são inválidos.',
          },
          { status: 400 },
        )
      }

      const validationError = validateWallet(body)

      if (validationError) {
        return HttpResponse.json(
          {
            code: 'INVALID_WALLET',
            message: validationError,
          },
          { status: 400 },
        )
      }

      const payload = body as SaveWalletRequest
      const database = readDatabase()
      const wallets = database[session.user.id] ?? []
      const previous = wallets.find(
        (wallet) => wallet.isPrimary === payload.isPrimary,
      )

      const wallet: SavedWallet = {
        id: previous?.id ?? crypto.randomUUID(),
        displayName: payload.displayName.trim(),
        nickname: payload.nickname.trim(),
        network: payload.network,
        profileName: payload.profileName.trim(),
        address: payload.address.trim(),
        secondaryAddress: payload.secondaryAddress.trim(),
        provider: payload.provider,
        referralCode: payload.referralCode.trim(),
        email: payload.email.trim().toLowerCase(),
        ensName: payload.ensName.trim().toLowerCase(),
        isPrimary: payload.isPrimary,
      }

      database[session.user.id] = [
        ...wallets.filter(
          (entry) => entry.isPrimary !== wallet.isPrimary,
        ),
        wallet,
      ]

      localStorage.setItem(storageKey, JSON.stringify(database))

      return HttpResponse.json(wallet)
    } catch (error) {
      return unexpectedError(error)
    }
  }),
]