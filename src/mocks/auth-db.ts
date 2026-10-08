import type { AuthSession, User } from '@/types/auth'
import type {
  ChangePasswordRequest,
  UserProfile,
} from '@/types/profile'


interface StoredUser extends User {
  passwordHash: string
  salt: string
  profile?: UserProfile
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

export class AccountError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'AccountError'
    this.status = status
    this.code = code
  }
}

async function requireAccount(token: string) {
  const database = await databaseReady

  const session = database.sessions.find(
    (entry) =>
      entry.token === token && entry.expiresAt > Date.now(),
  )

  const user = session
    ? database.users.find((entry) => entry.id === session.userId)
    : undefined

  if (!session || !user) {
    throw new AccountError(
      401,
      'SESSION_EXPIRED',
      'Sua sessão expirou. Entre novamente.',
    )
  }

  return { database, user }
}

function profileFor(user: StoredUser): UserProfile {
  return {
    displayName: user.profile?.displayName ?? user.username,
    username: user.username,
    email: user.email,
    ensName: user.profile?.ensName ?? '',
    walletNickname: user.profile?.walletNickname ?? '',
    avatarUrl: user.profile?.avatarUrl ?? null,
  }
}

export async function getAccountProfile(
  token: string,
): Promise<UserProfile> {
  const { user } = await requireAccount(token)
  return profileFor(user)
}

export async function updateAccountProfile(
  token: string,
  payload: UserProfile,
): Promise<UserProfile> {
  const { database, user } = await requireAccount(token)

  const textFields = [
    'displayName',
    'username',
    'email',
    'ensName',
    'walletNickname',
  ] as const

  if (
    !payload ||
    textFields.some(
      (field) => typeof payload[field] !== 'string',
    )
  ) {
    throw new AccountError(
      400,
      'INVALID_PROFILE',
      'Informe dados válidos para o perfil.',
    )
  }

  const displayName = payload.displayName.trim()
  const username = payload.username.trim()
  const email = payload.email.trim().toLowerCase()
  const ensName = payload.ensName.trim().toLowerCase()
  const walletNickname = payload.walletNickname.trim()

  if (
    displayName.length < 2 ||
    displayName.length > 100 ||
    username.length < 2 ||
    username.length > 40
  ) {
    throw new AccountError(
      400,
      'INVALID_NAME',
      'Informe um nome de exibição entre 2 e 100 caracteres e um usuário entre 2 e 40.',
    )
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new AccountError(
      400,
      'INVALID_EMAIL',
      'Informe um e-mail válido.',
    )
  }

  if (
    database.users.some(
      (entry) => entry.id !== user.id && entry.email === email,
    )
  ) {
    throw new AccountError(
      409,
      'EMAIL_ALREADY_REGISTERED',
      'Este e-mail já está cadastrado em outra conta.',
    )
  }

  if (
    walletNickname.length > 100 ||
    ensName.length > 100 ||
    (ensName !== '' &&
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(eth|sol)$/.test(ensName))
  ) {
    throw new AccountError(
      400,
      'INVALID_PROFILE',
      'Confira o apelido da carteira e o nome informado, como caio.eth.',
    )
  }

  const avatarUrl = payload.avatarUrl

  if (
    avatarUrl !== null &&
    (typeof avatarUrl !== 'string' ||
      avatarUrl.length > 700_000 ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
        avatarUrl,
      ))
  ) {
    throw new AccountError(
      400,
      'INVALID_AVATAR',
      'Use uma imagem PNG, JPEG ou WebP de até 500 KB.',
    )
  }

  const profile: UserProfile = {
    displayName,
    username,
    email,
    ensName,
    walletNickname,
    avatarUrl,
  }

  // Persiste antes de alterar a base em memória.
  const nextDatabase: AuthDatabase = {
    ...database,
    users: database.users.map((entry) =>
      entry.id === user.id
        ? { ...entry, username, email, profile }
        : entry,
    ),
  }

  saveDatabase(nextDatabase)
  database.users = nextDatabase.users

  return { ...profile }
}

export async function changeAccountPassword(
  token: string,
  payload: ChangePasswordRequest,
): Promise<void> {
  if (
    !payload ||
    typeof payload.currentPassword !== 'string' ||
    typeof payload.newPassword !== 'string' ||
    payload.currentPassword.length > 128 ||
    payload.newPassword.length < 8 ||
    payload.newPassword.length > 128
  ) {
    throw new AccountError(
      400,
      'INVALID_PASSWORD',
      'Informe a senha atual e uma nova senha entre 8 e 128 caracteres.',
    )
  }

  const { user } = await requireAccount(token)
  const previousHash = user.passwordHash
  const previousSalt = user.salt

  const currentHash = await hashPassword(
    payload.currentPassword,
    previousSalt,
  )

  if (currentHash !== previousHash) {
    throw new AccountError(
      400,
      'WRONG_PASSWORD',
      'A senha atual está incorreta.',
    )
  }

  if (payload.currentPassword === payload.newPassword) {
    throw new AccountError(
      400,
      'SAME_PASSWORD',
      'A nova senha deve ser diferente da atual.',
    )
  }

  const salt = crypto.randomUUID()
  const passwordHash = await hashPassword(
    payload.newPassword,
    salt,
  )

  // Confere novamente a sessão e a senha após as operações assíncronas.
  const { database, user: currentUser } =
    await requireAccount(token)

  if (
    currentUser.passwordHash !== previousHash ||
    currentUser.salt !== previousSalt
  ) {
    throw new AccountError(
      409,
      'PASSWORD_CHANGED',
      'A senha foi alterada durante esta operação. Tente novamente.',
    )
  }

  const nextDatabase: AuthDatabase = {
    users: database.users.map((entry) =>
      entry.id === currentUser.id
        ? { ...entry, salt, passwordHash }
        : entry,
    ),
    // Mantém esta sessão e encerra as outras sessões da mesma conta.
    sessions: database.sessions.filter(
      (entry) =>
        entry.userId !== currentUser.id || entry.token === token,
    ),
  }

  saveDatabase(nextDatabase)
  database.users = nextDatabase.users
  database.sessions = nextDatabase.sessions
}