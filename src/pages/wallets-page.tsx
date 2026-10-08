import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/layout/site-header'
import { useAuth } from '@/lib/auth-context'
import { getWallets, saveWallet } from '@/services/wallet-service'
import type {
  SavedWallet,
  SaveWalletRequest,
} from '@/types/profile'
import type { AuthSession } from '@/types/auth'
import type { Network } from '@/types/nft'
import type { WalletProvider } from '@/types/order'

const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

const fieldClass =
  'mt-2 h-10 w-full rounded border border-[#705039]/60 bg-transparent px-3 text-sm text-[#f5eee8] placeholder:text-[#b79460]'

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
    : 'Não foi possível salvar a carteira.'
}

export function WalletsPage() {
  const { session, isLoading, openAuth, signOut } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const walletsQuery = useQuery({
    queryKey: ['private', session?.user.id, 'wallets'],
    queryFn: ({ signal }) => getWallets(signal),
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
          void navigate({
            to: '/',
            search: initialSearch,
            hash: 'catalogo',
          })
        }}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start bg-[#281a13]">
          <h2 className="px-4 pt-4 font-bold">Meu perfil</h2>

          <nav aria-label="Menu do perfil" className="mt-3 text-sm">
            <Link
              to="/perfil"
              className="block px-4 py-3 text-[#b79460]"
            >
              Dados do perfil
            </Link>

            <span
              aria-current="page"
              className="block border-l-4 border-[#cf8946] px-4 py-3 text-[#e6a15a]"
            >
              Carteiras
            </span>

            <Link
  to="/favoritos"
  className="block px-4 py-3 text-sm text-[#b79460]"
>
  Lista de interesse
</Link>

            {[
              'Atividade',
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
          <h1 className="sr-only">Minhas carteiras</h1>

          {isLoading ? (
            <p role="status">Recuperando sua sessão...</p>
          ) : !session ? (
            <div>
              <p>Entre para cadastrar suas carteiras.</p>
              <Button
                type="button"
                onClick={openAuth}
                className={`mt-5 ${orangeButton}`}
              >
                Entrar
              </Button>
            </div>
          ) : walletsQuery.isPending ? (
            <p role="status">Carregando carteiras...</p>
          ) : walletsQuery.isError ? (
            <div role="alert">
              <p>{errorMessage(walletsQuery.error)}</p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => void walletsQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <WalletForms
              key={session.user.id}
              session={session}
              wallets={walletsQuery.data}
            />
          )}
        </section>
      </main>
    </div>
  )
}

function WalletForms({
  session,
  wallets,
}: {
  session: AuthSession
  wallets: SavedWallet[]
}) {
  const queryClient = useQueryClient()
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  const primary = wallets.find((wallet) => wallet.isPrimary)
  const secondary = wallets.find((wallet) => !wallet.isPrimary)

  function handleSaved(wallet: SavedWallet) {
    queryClient.setQueryData<SavedWallet[]>(
      ['private', session.user.id, 'wallets'],
      (previous = []) => [
        ...previous.filter(
          (entry) => entry.isPrimary !== wallet.isPrimary,
        ),
        wallet,
      ],
    )
  }

  return (
    <div className="space-y-10">
      <WalletForm
        session={session}
        initialWallet={primary}
        isPrimary
        onSaved={handleSaved}
      />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-bold">Carteira secundária</h2>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sameAsPrimary}
                disabled={!primary}
                onChange={(event) => {
                  const checked = event.target.checked
                  setSameAsPrimary(checked)

                  if (checked) {
                    setIsSecondaryOpen(true)
                  }
                }}
                className="accent-[#cf8946]"
              />
              Igual à carteira principal
            </label>

            <button
              type="button"
              onClick={() => setIsSecondaryOpen(true)}
              className="text-[#e6a15a]"
            >
              {secondary ? 'Editar' : 'Adicionar'}
            </button>
          </div>
        </div>

        {!secondary && !isSecondaryOpen ? (
          <p className="mt-2 text-xs text-[#b79460]">
            Você ainda não adicionou uma carteira secundária.
          </p>
        ) : !isSecondaryOpen && secondary ? (
          <div className="mt-4 space-y-2 text-sm">
            <p>{secondary.nickname}</p>
            <p className="break-all text-[#b79460]">
              {secondary.address}
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <WalletForm
              key={
                sameAsPrimary
                  ? `copy-${primary?.id}-${primary?.address}`
                  : `secondary-${secondary?.id ?? 'new'}`
              }
              session={session}
              initialWallet={sameAsPrimary ? primary : secondary}
              isPrimary={false}
              onSaved={(wallet) => {
                handleSaved(wallet)
                setIsSecondaryOpen(false)
                setSameAsPrimary(false)
              }}
            />
          </div>
        )}
      </section>
    </div>
  )
}

function WalletForm({
  session,
  initialWallet,
  isPrimary,
  onSaved,
}: {
  session: AuthSession
  initialWallet?: SavedWallet
  isPrimary: boolean
  onSaved: (wallet: SavedWallet) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const busyRef = useRef(false)

  const [draft, setDraft] = useState<SaveWalletRequest>(() => ({
    displayName: initialWallet?.displayName ?? session.user.username,
    nickname: initialWallet?.nickname ?? '',
    network: initialWallet?.network ?? 'ethereum',
    profileName: initialWallet?.profileName ?? session.user.username,
    address: initialWallet?.address ?? '',
    secondaryAddress: initialWallet?.secondaryAddress ?? '',
    provider: initialWallet?.provider ?? 'coinbase',
    referralCode: initialWallet?.referralCode ?? '',
    email: initialWallet?.email ?? session.user.email,
    ensName: initialWallet?.ensName ?? '',
    isPrimary,
  }))

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const ensParts = draft.ensName.split('.')
  const ensExtension =
    ensParts.at(-1) === 'sol' ? '.sol' : '.eth'
  const ensLabel = draft.ensName
    ? ensParts.slice(0, -1).join('.')
    : ''

  function updateDraft(changes: Partial<SaveWalletRequest>) {
    setDraft((previous) => ({ ...previous, ...changes }))
    setError('')
    setMessage('')
  }

  async function submit() {
    if (busyRef.current) {
      return
    }

    busyRef.current = true
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const wallet = await saveWallet(draft)
      onSaved(wallet)
      setMessage('Carteira salva.')
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      busyRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      {isPrimary && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold">Carteira principal</h2>

            <button
              type="button"
              onClick={() =>
                formRef.current
                  ?.querySelector<HTMLInputElement>('input')
                  ?.focus()
              }
              className="text-sm text-[#e6a15a]"
            >
              Adicionar
            </button>
          </div>

          <p className="mt-2 text-xs text-[#b79460]">
            Estas carteiras ficam disponíveis no pagamento e para
            receber NFTs comprados.
          </p>
        </div>
      )}

      <fieldset disabled={isSaving}>
        <legend className="sr-only">
          {isPrimary ? 'Dados da carteira principal' : 'Dados da carteira secundária'}
        </legend>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {[
            { name: 'displayName', label: 'Nome de exibição' },
            { name: 'nickname', label: 'Apelido da carteira' },
          ].map((field) => {
            const name = field.name as 'displayName' | 'nickname'

            return (
              <div key={name}>
                <label
                  htmlFor={`${isPrimary}-wallet-${name}`}
                  className="text-sm"
                >
                  {field.label}
                  <span className="text-[#e6a15a]"> *</span>
                </label>

                <Input
                  id={`${isPrimary}-wallet-${name}`}
                  required
                  maxLength={100}
                  value={draft[name]}
                  onChange={(event) =>
                    updateDraft({ [name]: event.target.value })
                  }
                  className={fieldClass}
                />
              </div>
            )
          })}

          <div>
            <label
              htmlFor={`${isPrimary}-wallet-network`}
              className="text-sm"
            >
              Rede <span className="text-[#e6a15a]">*</span>
            </label>

            <select
              id={`${isPrimary}-wallet-network`}
              value={draft.network}
              onChange={(event) =>
                updateDraft({
                  network: event.target.value as Network,
                  address: '',
                })
              }
              className={`${fieldClass} bg-[#160e0a]`}
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="solana">Solana</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`${isPrimary}-wallet-profile-name`}
              className="text-sm"
            >
              Nome do perfil <span className="text-[#e6a15a]">*</span>
            </label>

            <Input
              id={`${isPrimary}-wallet-profile-name`}
              required
              maxLength={100}
              value={draft.profileName}
              onChange={(event) =>
                updateDraft({ profileName: event.target.value })
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor={`${isPrimary}-wallet-address`}
              className="text-sm"
            >
              Endereço da carteira
              <span className="text-[#e6a15a]"> *</span>
            </label>

            <Input
              id={`${isPrimary}-wallet-address`}
              required
              maxLength={44}
              pattern={
                draft.network === 'solana'
                  ? '[1-9A-HJ-NP-Za-km-z]{32,44}'
                  : '0x[a-fA-F0-9]{40}'
              }
              placeholder={
                draft.network === 'solana'
                  ? 'Endereço Solana'
                  : 'Endereço 0x da carteira'
              }
              value={draft.address}
              onChange={(event) =>
                updateDraft({ address: event.target.value })
              }
              className={fieldClass}
            />
          </div>

          <div className="flex items-end">
            <label
              htmlFor={`${isPrimary}-wallet-secondary-address`}
              className="sr-only"
            >
              ENS ou carteira secundária, opcional
            </label>

            <Input
              id={`${isPrimary}-wallet-secondary-address`}
              maxLength={100}
              placeholder="ENS ou carteira secundária (opcional)"
              value={draft.secondaryAddress}
              onChange={(event) =>
                updateDraft({ secondaryAddress: event.target.value })
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor={`${isPrimary}-wallet-provider`}
              className="text-sm"
            >
              Tipo de carteira
              <span className="text-[#e6a15a]"> *</span>
            </label>

            <select
              id={`${isPrimary}-wallet-provider`}
              value={draft.provider}
              onChange={(event) =>
                updateDraft({
                  provider: event.target.value as WalletProvider,
                })
              }
              className={`${fieldClass} bg-[#160e0a]`}
            >
              <option value="metamask">MetaMask</option>
              <option value="walletconnect">WalletConnect</option>
              <option value="coinbase">Coinbase Wallet</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`${isPrimary}-wallet-referral`}
              className="text-sm"
            >
              Código de indicação
              <span className="text-[#e6a15a]"> *</span>
            </label>

            <Input
              id={`${isPrimary}-wallet-referral`}
              required
              maxLength={100}
              value={draft.referralCode}
              onChange={(event) =>
                updateDraft({ referralCode: event.target.value })
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor={`${isPrimary}-wallet-email`}
              className="text-sm"
            >
              E-mail <span className="text-[#e6a15a]">*</span>
            </label>

            <Input
              id={`${isPrimary}-wallet-email`}
              type="email"
              required
              maxLength={254}
              value={draft.email}
              onChange={(event) =>
                updateDraft({ email: event.target.value })
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor={`${isPrimary}-wallet-ens`}
              className="text-sm"
            >
              Nome ENS
            </label>

            <div className="flex gap-2">
              <select
                aria-label="Extensão do nome ENS"
                value={ensExtension}
                onChange={(event) =>
                  updateDraft({
                    ensName: `${ensLabel}${event.target.value}`,
                  })
                }
                className={`${fieldClass} w-20 bg-[#160e0a]`}
              >
                <option value=".eth">.eth</option>
                <option value=".sol">.sol</option>
              </select>

              <Input
                id={`${isPrimary}-wallet-ens`}
                maxLength={96}
                value={ensLabel}
                onChange={(event) =>
                  updateDraft({
                    ensName: event.target.value
                      ? `${event.target.value}${ensExtension}`
                      : '',
                  })
                }
                className={fieldClass}
              />
            </div>
          </div>
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
        disabled={isSaving}
        className={`mt-6 ${orangeButton}`}
      >
        {isSaving ? 'Salvando...' : 'Salvar carteira'}
      </Button>
    </form>
  )
}