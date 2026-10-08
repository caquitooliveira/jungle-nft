import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/layout/site-header'
import { useAuth } from '@/lib/auth-context'
import {
  changePassword,
  getProfile,
  saveProfile,
} from '@/services/profile-service'
import type { UserProfile } from '@/types/profile'
import { Link } from '@tanstack/react-router'

const fieldClass =
  'mt-2 h-10 w-full rounded border border-[#705039]/60 bg-transparent px-3 text-sm'

const orangeButton =
  'bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]'

function errorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'Não foi possível conectar. Tente novamente.'
    )
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível salvar os dados.'
}

export function ProfilePage() {
  const { session, isLoading, openAuth, signOut } = useAuth()
  const [logoutError, setLogoutError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['private', session?.user.id, 'profile'],
    queryFn: ({ signal }) => getProfile(signal),
    enabled: Boolean(session),
    retry: false,
    staleTime: Infinity,
  })

  async function handleSignOut() {
    setIsSigningOut(true)
    setLogoutError('')

    try {
      await signOut()
    } catch (error) {
      setLogoutError(errorMessage(error))
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#160e0a] font-mono text-[#f5eee8]">
      <SiteHeader
        isSearchOpen={false}
        onToggleSearch={() => {
          window.location.assign('/#catalogo')
        }}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start bg-[#281a13]">
          <h2 className="px-4 pt-4 font-bold">Meu perfil</h2>

          <nav aria-label="Menu do perfil" className="mt-3 text-sm">
            <span
              aria-current="page"
              className="block border-l-4 border-[#cf8946] px-4 py-3 text-[#e6a15a]"
            >
              Dados do perfil
            </span>

            <Link
            to="/carteiras"
            className= "block px-4 py-3 text-[#b79460]"
            >
                Carteiras
            </Link>

            {[
              
              'Atividade',
              'Lista de interesse',
              'Ofertas',
              'Arquivos baixados',
              'Suporte',
            ].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                className="block w-full px-4 py-3 text-left text-[#b79460]"
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            disabled={!session || isSigningOut}
            onClick={() => void handleSignOut()}
            className="w-full border-t border-[#705039] px-4 py-3 text-left text-sm text-[#e6a15a] disabled:opacity-50"
          >
            {isSigningOut ? 'Saindo...' : 'Sair'}
          </button>

          {logoutError && (
            <p role="alert" className="px-4 pb-4 text-xs text-red-300">
              {logoutError}
            </p>
          )}
        </aside>

        <section className="min-w-0">
          <h1 className="mb-6 text-lg font-bold">
            Perfil do colecionador
          </h1>

          {isLoading ? (
            <p role="status">Recuperando sua sessão...</p>
          ) : !session ? (
            <div>
              <p>Entre para consultar e editar seu perfil.</p>
              <Button
                type="button"
                onClick={openAuth}
                className={`mt-5 ${orangeButton}`}
              >
                Entrar
              </Button>
            </div>
          ) : profileQuery.isPending ? (
            <p role="status">Carregando perfil...</p>
          ) : profileQuery.isError ? (
            <div role="alert">
              <p>{errorMessage(profileQuery.error)}</p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => void profileQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <ProfileForm
              key={session.user.id}
              initialProfile={profileQuery.data}
              userId={session.user.id}
            />
          )}
        </section>
      </main>
    </div>
  )
}

function ProfileForm({
  initialProfile,
  userId,
}: {
  initialProfile: UserProfile
  userId: string
}) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)
  const [profile, setProfile] = useState(initialProfile)
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirmation: '',
  })
  const [visiblePasswords, setVisiblePasswords] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isReadingAvatar, setIsReadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const ensParts = profile.ensName.split('.')
  const ensExtension =
    ensParts.at(-1) === 'sol' ? '.sol' : '.eth'
  const ensLabel = profile.ensName
    ? ensParts.slice(0, -1).join('.')
    : ''

  function updateProfile(field: keyof UserProfile, value: string) {
    setProfile((previous) => ({ ...previous, [field]: value }))
    setError('')
    setMessage('')
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setError('')
    setMessage('')

    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 500_000
    ) {
      setError('Escolha uma imagem PNG, JPEG ou WebP de até 500 KB.')
      return
    }

    setIsReadingAvatar(true)

    try {
      const avatarUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Não foi possível ler a imagem.'))
          }
        }

        reader.onerror = () =>
          reject(new Error('Não foi possível ler a imagem.'))

        reader.readAsDataURL(file)
      })

      setProfile((previous) => ({ ...previous, avatarUrl }))
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setIsReadingAvatar(false)
    }
  }

  async function submit() {
    if (busyRef.current || isReadingAvatar) {
      return
    }

    const changingPassword = Boolean(
      passwords.current || passwords.next || passwords.confirmation,
    )

    if (
      changingPassword &&
      (!passwords.current || passwords.next.length < 8)
    ) {
      setError('Informe a senha atual e uma nova senha de pelo menos 8 caracteres.')
      return
    }

    if (changingPassword && passwords.next !== passwords.confirmation) {
      setError('A confirmação deve ser igual à nova senha.')
      return
    }

    busyRef.current = true
    setIsSaving(true)
    setError('')
    setMessage('')

    let profileSaved = false

    try {
      const saved = await saveProfile(profile)
      profileSaved = true

      setProfile(saved)
      queryClient.setQueryData(['private', userId, 'profile'], saved)

      if (changingPassword) {
        await changePassword({
          currentPassword: passwords.current,
          newPassword: passwords.next,
        })

        setPasswords({ current: '', next: '', confirmation: '' })
      }

      await queryClient.invalidateQueries({ queryKey: ['session'] })

      setMessage(
        changingPassword
          ? 'Perfil e senha atualizados.'
          : 'Perfil atualizado.',
      )
    } catch (error) {
      setError(
        profileSaved && changingPassword
          ? `O perfil foi salvo. Não foi possível concluir a alteração de senha: ${errorMessage(error)}`
          : errorMessage(error),
      )
    } finally {
      busyRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <fieldset disabled={isSaving || isReadingAvatar}>
        <legend className="sr-only">Dados do perfil</legend>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-display-name" className="text-sm">
              Nome de exibição <span className="text-[#e6a15a]">*</span>
            </label>
            <Input
              id="profile-display-name"
              required
              minLength={2}
              maxLength={100}
              value={profile.displayName}
              onChange={(event) =>
                updateProfile('displayName', event.target.value)
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="profile-username" className="text-sm">
              Nome de usuário <span className="text-[#e6a15a]">*</span>
            </label>
            <Input
              id="profile-username"
              required
              minLength={2}
              maxLength={40}
              value={profile.username}
              onChange={(event) =>
                updateProfile('username', event.target.value)
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="text-sm">
              E-mail <span className="text-[#e6a15a]">*</span>
            </label>
            <Input
              id="profile-email"
              type="email"
              required
              maxLength={254}
              value={profile.email}
              onChange={(event) =>
                updateProfile('email', event.target.value)
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="profile-ens-name" className="text-sm">
              Nome ENS
            </label>
            <div className="flex gap-2">
              <select
                aria-label="Extensão do nome ENS"
                value={ensExtension}
                onChange={(event) =>
                  updateProfile(
                    'ensName',
                    `${ensLabel}${event.target.value}`,
                  )
                }
                className={`${fieldClass} w-20 bg-[#160e0a]`}
              >
                <option value=".eth">.eth</option>
                <option value=".sol">.sol</option>
              </select>
              <Input
                id="profile-ens-name"
                maxLength={96}
                value={ensLabel}
                onChange={(event) =>
                  updateProfile(
                    'ensName',
                    event.target.value
                      ? `${event.target.value}${ensExtension}`
                      : '',
                  )
                }
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-wallet-nickname" className="text-sm">
              Apelido da carteira
            </label>
            <Input
              id="profile-wallet-nickname"
              maxLength={100}
              value={profile.walletNickname}
              onChange={(event) =>
                updateProfile('walletNickname', event.target.value)
              }
              className={fieldClass}
            />
          </div>

          <div>
            <p className="text-sm">Avatar</p>

            <div className="mt-2 flex items-center gap-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Seu avatar"
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-[#281a13] text-[#e6a15a]"
                >
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </span>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Selecionar avatar"
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => void handleAvatar(event)}
              />

              <Button
                type="button"
                className={orangeButton}
                onClick={() => fileRef.current?.click()}
              >
                Alterar
              </Button>

              <button
                type="button"
                disabled={!profile.avatarUrl}
                onClick={() =>
                  setProfile((previous) => ({
                    ...previous,
                    avatarUrl: null,
                  }))
                }
                className="text-xs disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        </div>

        <h2 className="mb-4 mt-8 text-sm font-bold">Alterar senha</h2>

        <div className="space-y-5 sm:w-[calc(50%-12px)]">
          {[
            { key: 'current', label: 'Senha atual' },
            { key: 'next', label: 'Nova senha' },
            { key: 'confirmation', label: 'Confirmar nova senha' },
          ].map((field) => {
            const key = field.key as keyof typeof passwords

            return (
              <div key={key}>
                <label htmlFor={`profile-password-${key}`} className="text-sm">
                  {field.label}
                </label>
                <Input
                  id={`profile-password-${key}`}
                  type={visiblePasswords ? 'text' : 'password'}
                  autoComplete={
                    key === 'current'
                      ? 'current-password'
                      : 'new-password'
                  }
                  maxLength={128}
                  value={passwords[key]}
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                  className={fieldClass}
                />
              </div>
            )
          })}

          <button
            type="button"
            aria-pressed={visiblePasswords}
            onClick={() => setVisiblePasswords((previous) => !previous)}
            className="text-xs text-[#e6a15a]"
          >
            {visiblePasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-300">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-5 text-sm text-green-300">
          {message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSaving || isReadingAvatar}
        className={`mt-6 min-w-28 ${orangeButton}`}
      >
        {isSaving
          ? 'Salvando...'
          : isReadingAvatar
            ? 'Carregando imagem...'
            : 'Salvar'}
      </Button>
    </form>
  )
}