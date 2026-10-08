import type { AuthSession, User } from '@/types/auth'

interface StoredUser extends User {
  passwordHash: string
  salt: string
}

interface StoredSession {
  token: string
  userId: string
  expiresAt: number
}

interface AuthDatabase {
  users: StoredUser[]
  sessions: StoredSession[]
}

const storageKey = 'kurio:mock-auth:v1'
const sessionDuration = 30 * 60 * 1000

async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    key,
    256,
  )

  return Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function saveDatabase(database: AuthDatabase) {
  localStorage.setItem(storageKey, JSON.stringify(database))
}

async function createStoredUser(
  id: string,
  username: string,
  email: string,
  password: string,
): Promise<StoredUser> {
  const salt = crypto.randomUUID()

  return {
    id,
    username,
    email,
    salt,
    passwordHash: await hashPassword(password, salt),
  }
}

async function initializeDatabase(): Promise<AuthDatabase> {
  const stored = localStorage.getItem(storageKey)

  if (stored) {
    try {
      const database = JSON.parse(stored) as AuthDatabase

      if (
        Array.isArray(database.users) &&
        Array.isArray(database.sessions) &&
        database.users.every(
          (user) =>
            typeof user.id === 'string' &&
            typeof user.username === 'string' &&
            typeof user.email === 'string' &&
            typeof user.salt === 'string' &&
            typeof user.passwordHash === 'string',
        ) &&
        database.sessions.every(
          (session) =>
            typeof session.token === 'string' &&
            typeof session.userId === 'string' &&
            typeof session.expiresAt === 'number',
        )
      ) {
        return database
      }
    } catch {
      // Recria a base de demonstração se os dados estiverem corrompidos.
    }
  }

  const database: AuthDatabase = {
    users: [
      await createStoredUser(
        'user-caio',
        'Caio',
        'caio@kurio.test',
        'Kurio123!',
      ),
      await createStoredUser(
        'user-ana',
        'Ana',
        'ana@kurio.test',
        'Kurio123!',
      ),
    ],
    sessions: [],
  }

  saveDatabase(database)

  return database
}

const databaseReady = initializeDatabase()

function publicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  }
}

function createSession(
  database: AuthDatabase,
  user: StoredUser,
): AuthSession {
  const session: StoredSession = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: Date.now() + sessionDuration,
  }

  database.sessions = database.sessions.filter(
    (entry) => entry.expiresAt > Date.now(),
  )
  database.sessions.push(session)
  saveDatabase(database)

  return {
    user: publicUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  }
}

export async function authenticate(email: string, password: string) {
  const database = await databaseReady
  const user = database.users.find(
    (entry) => entry.email === email.trim().toLowerCase(),
  )

  if (
    !user ||
    (await hashPassword(password, user.salt)) !== user.passwordHash
  ) {
    return null
  }

  return createSession(database, user)
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await createStoredUser(
    crypto.randomUUID(),
    username.trim(),
    normalizedEmail,
    password,
  )

  const database = await databaseReady

  // Verifica depois do hash para evitar dois cadastros simultâneos
  // com o mesmo e-mail.
  if (
    database.users.some((entry) => entry.email === normalizedEmail)
  ) {
    return null
  }

  database.users.push(user)

  return createSession(database, user)
}

export async function findSession(token: string) {
  const database = await databaseReady
  const session = database.sessions.find(
    (entry) =>
      entry.token === token && entry.expiresAt > Date.now(),
  )

  const user = session
    ? database.users.find((entry) => entry.id === session.userId)
    : undefined

  if (!session || !user) {
    return null
  }

  return {
    user: publicUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  } satisfies AuthSession
}

export async function revokeSession(token: string) {
  const database = await databaseReady

  database.sessions = database.sessions.filter(
    (entry) => entry.token !== token,
  )

  saveDatabase(database)
}