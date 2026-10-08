import { delay, http, HttpResponse } from 'msw'
import { findSession } from './auth-db'
import { nfts } from './nft-db'

const storageKey = 'kurio:mock-favorites:v1'

function getToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
}

function readDatabase(): Record<string, string[]> {
  const stored = localStorage.getItem(storageKey)

  if (!stored) {
    return {}
  }

  const value: unknown = JSON.parse(stored)

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Dados de favoritos inválidos.')
  }

  const database: Record<string, string[]> = {}

  for (const [userId, ids] of Object.entries(value)) {
    if (
      !Array.isArray(ids) ||
      !ids.every((id) => typeof id === 'string')
    ) {
      throw new Error('Dados de favoritos inválidos.')
    }

    database[userId] = [...new Set<string>(ids)]
  }

  return database
}

function unauthorized() {
  return HttpResponse.json(
    {
      code: 'SESSION_EXPIRED',
      message: 'Sua sessão expirou. Entre novamente.',
    },
    { status: 401 },
  )
}

function storageError() {
  return HttpResponse.json(
    {
      code: 'FAVORITES_ERROR',
      message: 'Não foi possível acessar os favoritos. Tente novamente.',
    },
    { status: 500 },
  )
}

export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    await delay(200)

    try {
      const session = await findSession(getToken(request))

      if (!session) {
        return unauthorized()
      }

      const database = readDatabase()

      return HttpResponse.json(database[session.user.id] ?? [])
    } catch {
      return storageError()
    }
  }),

  http.put('/api/favorites/:nftId', async ({ request, params }) => {
    await delay(300)

    try {
      const session = await findSession(getToken(request))

      if (!session) {
        return unauthorized()
      }

      const nftId = String(params.nftId)

      if (!nfts.some((nft) => nft.id === nftId)) {
        return HttpResponse.json(
          {
            code: 'NFT_NOT_FOUND',
            message: 'NFT não encontrado.',
          },
          { status: 404 },
        )
      }

      let body: unknown

      try {
        body = await request.json()
      } catch {
        body = null
      }

      if (
        !body ||
        typeof body !== 'object' ||
        !('favorite' in body) ||
        typeof body.favorite !== 'boolean'
      ) {
        return HttpResponse.json(
          {
            code: 'INVALID_FAVORITE',
            message: 'Informe um estado válido para o favorito.',
          },
          { status: 400 },
        )
      }

      const database = readDatabase()
      const ids = database[session.user.id] ?? []

      const nextIds = body.favorite
        ? [...new Set([...ids, nftId])]
        : ids.filter((id) => id !== nftId)

      database[session.user.id] = nextIds

      localStorage.setItem(storageKey, JSON.stringify(database))

      return HttpResponse.json(nextIds)
    } catch {
      return storageError()
    }
  }),
]