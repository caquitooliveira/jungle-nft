import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CollectorProfileForm } from '@/components/checkout/collector-profile-form'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { useAuth } from '@/lib/auth-context'
import { useCartItems } from '@/lib/cart-store'
import { getSessionToken } from '@/services/auth-service'
import { getCartQuote } from '@/services/cart-service'
import { getWallets } from '@/services/wallet-service'
import { createOrder, getOrderByKey } from '@/services/order-service'
import type { CartQuote } from '@/types/cart'
import type { AuthSession } from '@/types/auth'
import type {
  CollectorProfile,
  CreateOrderRequest,
  WalletProvider,
} from '@/types/order'
import type { Network } from '@/types/nft'
import type { SavedWallet } from '@/types/profile'

interface CheckoutDraft {
  profile: CollectorProfile
  network: Network
  address: string
  provider: WalletProvider
  coupon: string
}

interface OrderAttempt {
  key: string
  payload: CreateOrderRequest
}

const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

const orangeButton =
  'bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]'

const fieldClass =
  'mt-2 w-full rounded-md border border-[#705039] bg-transparent p-3 text-sm'

function getErrorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ??
        'Não foi possível conectar. Tente novamente.'
    : error instanceof Error
      ? error.message
      : 'Não foi possível concluir esta ação.'
}

function quoteSignature(quote: CartQuote) {
  return JSON.stringify({
    items: quote.items.map((item) => [
      item.nftId,
      item.editionId,
      item.quantity,
      item.unitPriceEth,
      item.totalEth,
    ]),
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    coupon: quote.coupon,
  })
}

function readDraft(session: AuthSession): CheckoutDraft {
  const initialDraft: CheckoutDraft = {
    profile: {
      displayName: session.user.username,
      username: session.user.username,
      profileName: session.user.username,
      email: session.user.email,
      referralCode: '',
      ensName: '',
      secondaryWallet: '',
      observation: '',
    },
    network: 'ethereum',
    address: '',
    provider: 'coinbase',
    coupon: '',
  }

  try {
    const saved = sessionStorage.getItem(
      `kurio:checkout-draft:${session.user.id}`,
    )

    if (saved) {
      const value: unknown = JSON.parse(saved)

      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return initialDraft
      }

      const stored = value as Record<string, unknown>
      const profile = { ...initialDraft.profile }

      if (
        stored.profile &&
        typeof stored.profile === 'object' &&
        !Array.isArray(stored.profile)
      ) {
        const storedProfile =
          stored.profile as Record<string, unknown>

        for (const key of Object.keys(profile) as Array<
          keyof CollectorProfile
        >) {
          if (typeof storedProfile[key] === 'string') {
            profile[key] = storedProfile[key]
          }
        }
      }

      if (profile.ensName === '.eth' || profile.ensName === '.sol') {
        profile.ensName = ''
      }

      return {
        profile,
        network:
          stored.network === 'ethereum' ||
          stored.network === 'polygon' ||
          stored.network === 'solana'
            ? stored.network
            : initialDraft.network,
        provider:
          stored.provider === 'metamask' ||
          stored.provider === 'walletconnect' ||
          stored.provider === 'coinbase'
            ? stored.provider
            : initialDraft.provider,
        address:
          typeof stored.address === 'string' ? stored.address : '',
        coupon:
          typeof stored.coupon === 'string' ? stored.coupon : '',
      }
    }
  } catch {
    // Recupera os valores iniciais se o rascunho estiver inválido.
  }

  return initialDraft
}

function readAttempt(userId: string): OrderAttempt | null {
  try {
    const stored = sessionStorage.getItem(
      `kurio:order-attempt:${userId}`,
    )

    return stored ? (JSON.parse(stored) as OrderAttempt) : null
  } catch {
    return null
  }
}

export function CheckoutPage() {
  const { session, isLoading, openAuth } = useAuth()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#160e0a] font-mono text-[#f5eee8]">
      <SiteHeader
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen((previous) => !previous)}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {isSearchOpen && (
          <form
            id="catalog-search-panel"
            className="mb-8 flex gap-3"
            onSubmit={(event) => {
              event.preventDefault()

              const form = new FormData(event.currentTarget)

              void navigate({
                to: '/',
                search: {
                  ...initialSearch,
                  search: String(form.get('search') ?? '').trim(),
                },
              })
            }}
          >
            <label htmlFor="checkout-search" className="sr-only">
              Buscar NFT ou criador
            </label>

            <Input
              autoFocus
              id="checkout-search"
              name="search"
              placeholder="Buscar NFT ou criador"
              className="border-[#705039] bg-[#281a13]"
            />

            <Button type="submit" className={orangeButton}>
              Buscar
            </Button>
          </form>
        )}

        <nav aria-label="Caminho da página" className="mb-8 text-xs">
          <Link to="/" search={initialSearch}>
            Início
          </Link>

          <span aria-hidden="true"> / </span>

          <Link to="/" search={initialSearch} hash="catalogo">
            Mercado
          </Link>

          <span aria-hidden="true"> / </span>
          <span aria-current="page">Pagamento</span>
        </nav>

        <h1 className="sr-only">Pagamento</h1>

        {isLoading ? (
          <p role="status">Recuperando sua sessão...</p>
        ) : session ? (
          <CheckoutForm key={session.user.id} session={session} />
        ) : (
          <section className="rounded-lg bg-[#281a13] p-8">
            <h2 className="text-xl font-bold">
              Entre para continuar a compra
            </h2>

            <p className="mt-3 text-sm text-[#c9b6a5]">
              Seu carrinho e seu rascunho continuam salvos.
            </p>

            <Button
              type="button"
              onClick={openAuth}
              className={`mt-6 ${orangeButton}`}
            >
              Entrar ou criar conta
            </Button>
          </section>
        )}
      </main>

      <div className="px-6 pb-6">
        <SiteFooter />
      </div>
    </div>
  )
}

function CheckoutForm({ session }: { session: AuthSession }) {
  const items = useCartItems()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const busyRef = useRef(false)
  const [draft, setDraft] = useState(() => readDraft(session))
  const [attempt, setAttempt] = useState<OrderAttempt | null>(
    () => readAttempt(session.user.id),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const quoteKey = [
    'cart-quote',
    { items, coupon: draft.coupon },
  ]

  const quote = useQuery({
    queryKey: quoteKey,
    queryFn: ({ signal }) =>
      getCartQuote(
        { items, coupon: draft.coupon || undefined },
        signal,
      ),
    enabled: items.length > 0 && !attempt,
    retry: false,
    staleTime: 0,
  })

  const walletsQuery = useQuery({
    queryKey: ['private', session.user.id, 'wallets'],
    queryFn: ({ signal }) => getWallets(signal),
    enabled: !attempt,
    retry: false,
    staleTime: 0,
  })

  const savedWallets = walletsQuery.data ?? []

  const selectedWallet = savedWallets.find(
    (wallet) =>
      wallet.address === draft.address.trim() &&
      wallet.network === draft.network &&
      wallet.provider === draft.provider,
  )

  function updateDraft(nextDraft: CheckoutDraft) {
    try {
      sessionStorage.setItem(
        `kurio:checkout-draft:${session.user.id}`,
        JSON.stringify(nextDraft),
      )

      setDraft(nextDraft)
      setError('')
    } catch {
      setError('Não foi possível salvar o rascunho no navegador.')
    }
  }

  function applySavedWallet(wallet: SavedWallet) {
    updateDraft({
      ...draft,
      network: wallet.network,
      address: wallet.address,
      provider: wallet.provider,
      profile: {
        ...draft.profile,
        profileName: wallet.profileName,
        referralCode: wallet.referralCode,
        ensName: wallet.ensName,
        secondaryWallet: wallet.secondaryAddress,
      },
    })
  }

  function ensureCurrentSession() {
    if (getSessionToken() !== session.token) {
      throw new Error(
        'Sua sessão mudou. Entre novamente antes de confirmar a compra.',
      )
    }
  }

  async function finishOrder(currentAttempt: OrderAttempt) {
    ensureCurrentSession()

    let order

    try {
      order = await getOrderByKey(currentAttempt.key)
    } catch (error) {
      if (
        !isAxiosError(error) ||
        error.response?.status !== 404
      ) {
        throw error
      }

      ensureCurrentSession()

      order = await createOrder(
        currentAttempt.payload,
        currentAttempt.key,
      )
    }

    ensureCurrentSession()

    await navigate({
      to: '/pedidos/$orderId',
      params: { orderId: order.id },
    })
  }

  async function submitOrder() {
    if (busyRef.current) {
      return
    }

    busyRef.current = true
    setIsSubmitting(true)
    setError('')

    try {
      ensureCurrentSession()

      if (attempt) {
        await finishOrder(attempt)
        return
      }

      if (!quote.data) {
        throw new Error('Aguarde o cálculo do resumo.')
      }

      const latestQuote = await getCartQuote({
        items,
        coupon: draft.coupon || undefined,
      })

      ensureCurrentSession()

      if (
        quoteSignature(latestQuote) !== quoteSignature(quote.data)
      ) {
        queryClient.setQueryData(quoteKey, latestQuote)

        setError(
          'Os valores mudaram. Confira o novo resumo e confirme novamente.',
        )
        return
      }

      const nextAttempt: OrderAttempt = {
        key: crypto.randomUUID(),
        payload: {
          items: items.map((item) => ({ ...item })),
          coupon: draft.coupon || undefined,
          acceptedQuote: latestQuote,
          profile: { ...draft.profile },
          wallet: {
            address: draft.address.trim(),
            network: draft.network,
            provider: draft.provider,
          },
        },
      }

      sessionStorage.setItem(
        `kurio:order-attempt:${session.user.id}`,
        JSON.stringify(nextAttempt),
      )

      setAttempt(nextAttempt)
      await finishOrder(nextAttempt)
    } catch (error) {
      if (
        isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0) &&
        error.response?.data?.code !== 'IDEMPOTENCY_CONFLICT'
      ) {
        try {
          sessionStorage.removeItem(
            `kurio:order-attempt:${session.user.id}`,
          )

          setAttempt(null)
          void quote.refetch()
        } catch {
          setError(
            'Não foi possível atualizar a tentativa salva. Recarregue a página antes de tentar novamente.',
          )
          return
        }
      }

      setError(getErrorMessage(error))
    } finally {
      busyRef.current = false
      setIsSubmitting(false)
    }
  }

  if (!items.length && !attempt) {
    return (
      <section className="rounded-lg bg-[#281a13] p-8">
        <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>

        <Link
          to="/"
          search={initialSearch}
          hash="catalogo"
          className="mt-4 inline-block text-[#e6a15a] underline"
        >
          Explorar NFTs
        </Link>
      </section>
    )
  }

  const summary = attempt?.payload.acceptedQuote ?? quote.data

  return (
    <form
      className="mb-16 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
      onSubmit={(event) => {
        event.preventDefault()
        void submitOrder()
      }}
    >
      <div className="min-w-0">
        {savedWallets.length > 0 && !attempt && (
          <div className="mb-6">
            <label
              htmlFor="checkout-saved-wallet"
              className="text-sm"
            >
              Carteira cadastrada
            </label>

            <select
              id="checkout-saved-wallet"
              disabled={isSubmitting}
              value={selectedWallet?.id ?? ''}
              onChange={(event) => {
                const wallet = savedWallets.find(
                  (entry) => entry.id === event.target.value,
                )

                if (wallet) {
                  applySavedWallet(wallet)
                } else {
                  updateDraft({ ...draft, address: '' })
                }
              }}
              className={`${fieldClass} bg-[#160e0a]`}
            >
              <option value="">Informar endereço manualmente</option>

              {savedWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.nickname} — {wallet.network}
                  {wallet.isPrimary ? ' — Principal' : ' — Secundária'}
                </option>
              ))}
            </select>
          </div>
        )}

        {walletsQuery.isError && !attempt && (
          <div role="alert" className="mb-6 text-xs text-red-300">
            <p>
              Não foi possível carregar suas carteiras salvas.
              Você pode preencher o endereço manualmente.
            </p>

            <button
              type="button"
              disabled={walletsQuery.isFetching}
              onClick={() => void walletsQuery.refetch()}
              className="mt-2 underline"
            >
              Tentar carregar novamente
            </button>
          </div>
        )}

        <CollectorProfileForm
          profile={draft.profile}
          network={draft.network}
          address={draft.address}
          provider={draft.provider}
          disabled={isSubmitting || Boolean(attempt)}
          onProfileChange={(profile) =>
            updateDraft({ ...draft, profile })
          }
          onNetworkChange={(network) =>
            updateDraft({ ...draft, network, address: '' })
          }
          onAddressChange={(address) =>
            updateDraft({ ...draft, address })
          }
          onProviderChange={(provider) =>
            updateDraft({ ...draft, provider })
          }
        />
      </div>

      <section
        aria-labelledby="checkout-summary-title"
        className="min-w-0"
      >
        <h2
          id="checkout-summary-title"
          className="text-lg font-bold"
        >
          Seus NFTs
        </h2>

        {summary ? (
          <>
            <div className="mt-3 flex justify-between border-b border-[#705039]/50 pb-3 text-sm">
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>

            <ul className="mt-3 space-y-3">
              {summary.items.map((item) => (
                <li
                  key={`${item.nftId}:${item.editionId}`}
                  className="flex flex-wrap items-center gap-3 bg-[#281a13] p-3"
                >
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 rounded-md object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-xs text-[#c9b6a5]">
                      {item.editionName} × {item.quantity}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-[#e6a15a]">
                    {item.totalEth} ETH
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p role="status" className="mt-5 text-sm">
            {quote.isError
              ? 'Não foi possível calcular o resumo.'
              : 'Calculando resumo...'}
          </p>
        )}

        <label
          htmlFor="checkout-coupon"
          className="mt-6 block text-xs"
        >
          Tem um código promocional? Aplique aqui
        </label>

        <Input
          id="checkout-coupon"
          disabled={isSubmitting || Boolean(attempt)}
          value={draft.coupon}
          onChange={(event) =>
            updateDraft({
              ...draft,
              coupon: event.target.value.trim().toUpperCase(),
            })
          }
          placeholder="KURIO10"
          className={fieldClass}
        />

        {quote.isError && !attempt && (
          <div role="alert" className="mt-4 text-xs text-red-300">
            <p>{getErrorMessage(quote.error)}</p>

            {draft.coupon && (
              <button
                type="button"
                onClick={() =>
                  updateDraft({ ...draft, coupon: '' })
                }
                className="mt-3 underline"
              >
                Remover código promocional
              </button>
            )}

            <button
              type="button"
              onClick={() => void quote.refetch()}
              className="mt-3 block underline"
            >
              Tentar calcular novamente
            </button>

            <Link
              to="/carrinho"
              className="mt-3 block underline"
            >
              Corrigir itens no carrinho
            </Link>
          </div>
        )}

        {summary && (
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Subtotal</dt>
              <dd>{summary.subtotalEth} ETH</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt>Desconto do lançamento</dt>
              <dd>− {summary.discountEth} ETH</dd>
            </div>

            <div className="flex justify-between gap-3">
              <dt>Taxa de rede</dt>
              <dd>{summary.networkFeeEth} ETH</dd>
            </div>

            <div className="flex justify-between gap-3 border-t border-[#705039] pt-4 font-bold">
              <dt>Total</dt>
              <dd className="text-[#e6a15a]">
                {summary.totalEth} ETH
              </dd>
            </div>
          </dl>
        )}

        <fieldset
          disabled={isSubmitting || Boolean(attempt)}
          className="mt-6"
        >
          <legend className="mb-3 text-center font-bold">
            Carteira e rede
          </legend>

          {[
            { value: 'walletconnect', label: 'WalletConnect' },
            { value: 'metamask', label: 'MetaMask' },
            { value: 'coinbase', label: 'Coinbase Wallet' },
          ].map((wallet) => (
            <label
              key={wallet.value}
              className={`mb-3 flex items-center gap-3 rounded-md border p-4 text-sm ${
                draft.provider === wallet.value
                  ? 'border-[#cf8946]'
                  : 'border-[#705039]'
              }`}
            >
              <input
                type="radio"
                name="wallet-provider"
                checked={draft.provider === wallet.value}
                onChange={() =>
                  updateDraft({
                    ...draft,
                    provider: wallet.value as WalletProvider,
                  })
                }
                className="accent-[#cf8946]"
              />

              {wallet.label}
            </label>
          ))}
        </fieldset>

        {attempt && (
          <p
            role="status"
            className="mt-4 text-xs text-[#c9b6a5]"
          >
            Existe uma tentativa salva. Vamos consultar esse pedido
            antes de enviar novamente.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button
          type="submit"
          formNoValidate={Boolean(attempt)}
          disabled={
            isSubmitting ||
            (!attempt && (!quote.isSuccess || quote.isFetching))
          }
          className={`mt-6 w-full ${orangeButton}`}
        >
          {isSubmitting
            ? 'Aguarde...'
            : attempt
              ? 'Consultar tentativa de compra'
              : 'Confirmar compra'}
        </Button>
      </section>
    </form>
  )
}