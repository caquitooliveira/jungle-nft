import { delay, http, HttpResponse } from 'msw'
import {
  authenticate,
  findSession,
  registerUser,
  revokeSession,
} from './auth-db'

function getToken(request: Request) {
  const authorization = request.headers.get('Authorization')

  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : ''
}

async function readBody(request: Request) {
  try {
    const body: unknown = await request.json()

    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function invalidFields(message: string) {
  return HttpResponse.json(
    { code: 'INVALID_FIELDS', message },
    { status: 400 },
  )
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(300)

    const body = await readBody(request)

    if (
      !body ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string' ||
      body.email.length > 254 ||
      body.password.length > 128
    ) {
      return invalidFields('Informe e-mail e senha válidos.')
    }

    const session = await authenticate(body.email, body.password)

    if (!session) {
      return HttpResponse.json(
        {
          code: 'INVALID_CREDENTIALS',
          message: 'E-mail ou senha incorretos.',
        },
        { status: 401 },
      )
    }

    return HttpResponse.json(session)
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(300)

    const body = await readBody(request)

    if (
      !body ||
      typeof body.username !== 'string' ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string'
    ) {
      return invalidFields('Preencha os dados do cadastro.')
    }

    const username = body.username.trim()
    const email = body.email.trim()

    if (username.length < 2 || username.length > 40) {
      return invalidFields(
        'O nome de usuário deve ter entre 2 e 40 caracteres.',
      )
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return invalidFields('Informe um e-mail válido.')
    }

    if (body.password.length < 8 || body.password.length > 128) {
      return invalidFields(
        'A senha deve ter entre 8 e 128 caracteres.',
      )
    }

    const session = await registerUser(
      username,
      email,
      body.password,
    )

    if (!session) {
      return HttpResponse.json(
        {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Este e-mail já está cadastrado.',
        },
        { status: 409 },
      )
    }

    return HttpResponse.json(session, { status: 201 })
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await delay(150)

    const session = await findSession(getToken(request))

    if (!session) {
      return HttpResponse.json(
        {
          code: 'SESSION_EXPIRED',
          message: 'Sua sessão expirou. Entre novamente.',
        },
        { status: 401 },
      )
    }

    return HttpResponse.json(session)
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await revokeSession(getToken(request))

    return new HttpResponse(null, { status: 204 })
  }),
]