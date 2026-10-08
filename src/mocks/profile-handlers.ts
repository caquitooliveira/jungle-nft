import { delay, http, HttpResponse } from 'msw'
import {
  AccountError,
  changeAccountPassword,
  getAccountProfile,
  updateAccountProfile,
} from './auth-db'
import type {
  ChangePasswordRequest,
  UserProfile,
} from '@/types/profile'

function getToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
}

function errorResponse(error: unknown) {
  if (error instanceof AccountError) {
    return HttpResponse.json(
      { code: error.code, message: error.message },
      { status: error.status },
    )
  }

  if (error instanceof SyntaxError) {
    return HttpResponse.json(
      {
        code: 'INVALID_BODY',
        message: 'Os dados enviados são inválidos.',
      },
      { status: 400 },
    )
  }

  return HttpResponse.json(
    {
      code: 'PROFILE_ERROR',
      message: 'Não foi possível salvar os dados. Tente novamente.',
    },
    { status: 500 },
  )
}

export const profileHandlers = [
  http.get('/api/profile', async ({ request }) => {
    await delay(200)

    try {
      const profile = await getAccountProfile(getToken(request))
      return HttpResponse.json(profile)
    } catch (error) {
      return errorResponse(error)
    }
  }),

  http.put('/api/profile', async ({ request }) => {
    await delay(300)

    try {
      const token = getToken(request)

      // Verifica a sessão antes de processar os dados enviados.
      await getAccountProfile(token)

      const payload = (await request.json()) as UserProfile
      const profile = await updateAccountProfile(token, payload)

      return HttpResponse.json(profile)
    } catch (error) {
      return errorResponse(error)
    }
  }),

  http.put('/api/profile/password', async ({ request }) => {
    await delay(300)

    try {
      const token = getToken(request)
      await getAccountProfile(token)

      const payload =
        (await request.json()) as ChangePasswordRequest

      await changeAccountPassword(token, payload)

      return new HttpResponse(null, { status: 204 })
    } catch (error) {
      return errorResponse(error)
    }
  }),
]