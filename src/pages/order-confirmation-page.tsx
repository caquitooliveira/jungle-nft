import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Order } from '@/types/order'
import { Link, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { completeCartOrder } from '@/lib/cart-store'
import { getOrder } from '@/services/order-service'

const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

const walletNames = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

function clearMatchingAttempt(
  userId: string,
  idempotencyKey: string,
) {
  const storageKey = `kurio:order-attempt:${userId}`
  const stored = sessionStorage.getItem(storageKey)

  if (!stored) {
    return
  }

  const attempt: unknown = JSON.parse(stored)

  if (
    attempt &&
    typeof attempt === 'object' &&
    'key' in attempt &&
    attempt.key === idempotencyKey
  ) {
    // Um recibo antigo não apaga uma tentativa de outra compra.
    sessionStorage.removeItem(storageKey)
  }
}

export function OrderConfirmationPage() {
  const { orderId } = useParams({ from: '/pedidos/$orderId' })
  const { session, isLoading, openAuth } = useAuth()

  const query = useQuery({
    queryKey: ['private', session?.user.id, 'order', orderId],
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: Boolean(session),
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 1_000 : false,
  })

  return (
    <OrderReceipt
      key={`${session?.user.id ?? 'guest'}:${orderId}`}
      query={query}
      session={session}
      isLoading={isLoading}
      openAuth={openAuth}
    />
  )
}

type ReceiptProps = {
  query: UseQueryResult<Order, Error>
  session: ReturnType<typeof useAuth>['session']
  isLoading: boolean
  openAuth: () => void
}

function OrderReceipt({
  query,
  session,
  isLoading,
  openAuth,
}: ReceiptProps) {
  const order = query.data
  const userId = session?.user.id
  const [cartError, setCartError] = useState('')
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    if (
      !order ||
      !userId ||
      order.userId !== userId ||
      order.status === 'pending'
    ) {
      return
    }

    let cancelled = false

    async function synchronizeCart() {
      if (!order || !userId) {
        return
      }

      try {
        if (order.status === 'confirmed') {
          await completeCartOrder(
            userId,
            order.id,
            order.quote.items,
          )
        }

        if (cancelled) {
          return
        }

        clearMatchingAttempt(userId, order.idempotencyKey)
        setCartError('')
      } catch (error) {
        if (!cancelled) {
          setCartError(
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o carrinho.',
          )
        }
      }
    }

    void synchronizeCart()

    return () => {
      cancelled = true
    }
  }, [order, userId, retryVersion])

  return (
    <main className="min-h-screen bg-[#160e0a] px-4 py-8 font-mono text-[#f5eee8]">
      <section className="relative mx-auto max-w-2xl border-b-8 border-[#cf8946] bg-[#281a13]">
        <Link
          to="/"
          search={initialSearch}
          aria-label="Fechar recibo e voltar ao início"
          className="absolute right-5 top-4 text-xl text-[#e6a15a]"
        >
          ×
        </Link>

        {isLoading ? (
          <p role="status" className="p-8">
            Recuperando sua sessão...
          </p>
        ) : !session ? (
          <div className="p-8">
            <h1 className="text-xl font-bold">
              Entre para consultar o pedido
            </h1>

            <Button type="button" onClick={openAuth} className="mt-5">
              Entrar
            </Button>
          </div>
        ) : query.isPending ? (
          <p role="status" className="p-8">
            Consultando pedido...
          </p>
        ) : query.isError ? (
          <div role="alert" className="p-8">
            <h1 className="text-xl font-bold">
              {isAxiosError(query.error) &&
              query.error.response?.status === 404
                ? 'Pedido não encontrado nesta conta'
                : 'Não foi possível consultar o pedido'}
            </h1>

            <Button
              type="button"
              className="mt-5"
              onClick={() => void query.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : order ? (
          <>
            <header className="px-8 pb-6 pt-12 text-center">
              <svg
                width="72"
                height="84"
                viewBox="0 0 72 84"
                fill="none"
                stroke="#cf8946"
                strokeWidth="2"
                aria-hidden="true"
                className="mx-auto"
              >
                <path d="M8 38 36 14l28 24v40H8V38Z" />
                <path d="M16 45V8h40v37M8 38l28 26 28-26M8 78l22-20M64 78 42 58" />
                <text
                  x="36"
                  y="29"
                  textAnchor="middle"
                  fill="#cf8946"
                  stroke="none"
                  fontSize="10"
                >
                  THANK
                </text>
                <text
                  x="36"
                  y="41"
                  textAnchor="middle"
                  fill="#cf8946"
                  stroke="none"
                  fontSize="10"
                >
                  YOU
                </text>
              </svg>

              <h1 className="mt-5 text-lg font-bold text-[#d2b38e]">
                {order.status === 'confirmed'
                  ? 'Seus NFTs agora estão na sua carteira'
                  : order.status === 'refused'
                    ? 'Sua compra foi recusada'
                    : 'Sua compra está sendo processada'}
              </h1>

              <p role="status" className="mt-3 text-xs text-[#c9b6a5]">
                {order.status === 'pending'
                  ? 'Aguarde a confirmação do pedido.'
                  : 'Transação de demonstração.'}
              </p>
            </header>

            <dl className="grid gap-5 border-y border-[#cf8946] px-8 py-5 text-xs sm:grid-cols-4">
              <div>
                <dt className="font-bold">ID da transação</dt>
                <dd
                  className="mt-2 text-[#d2b38e]"
                  title={order.transactionId}
                >
                  {order.transactionId.slice(0, 8)}…
                  {order.transactionId.slice(-4)}
                </dd>
              </div>

              <div>
                <dt>Data</dt>
                <dd className="mt-2 text-[#d2b38e]">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </dd>
              </div>

              <div>
                <dt>Total</dt>
                <dd className="mt-2 text-[#d2b38e]">
                  {order.quote.totalEth} ETH
                </dd>
              </div>

              <div>
                <dt className="font-bold">Carteira</dt>
                <dd className="mt-2 text-[#d2b38e]">
                  {walletNames[order.wallet.provider]}
                </dd>
              </div>
            </dl>

            <div className="p-8">
              <h2 className="font-bold">Detalhes da transação</h2>

              <ul className="mt-5 space-y-5">
                {order.quote.items.map((item) => (
                  <li
                    key={`${item.nftId}:${item.editionId}`}
                    className="flex flex-wrap items-center gap-4"
                  >
                    <img
                      src={item.imageUrl}
                      alt=""
                      width={80}
                      height={80}
                      className="size-20 rounded-lg object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold">{item.name}</h3>
                      <p className="mt-2 text-xs text-[#c9b6a5]">
                        {item.editionName} × {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-[#e6a15a]">
                      {item.totalEth} ETH
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-8 space-y-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Desconto</dt>
                  <dd>− {order.quote.discountEth} ETH</dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt>Taxa de rede</dt>
                  <dd>{order.quote.networkFeeEth} ETH</dd>
                </div>

                <div className="flex justify-between gap-3 font-bold">
                  <dt>Total</dt>
                  <dd className="text-[#e6a15a]">
                    {order.quote.totalEth} ETH
                  </dd>
                </div>
              </dl>

              {cartError && (
                <div role="alert" className="mt-6 text-sm text-red-300">
                  <p>
                    {order.status === 'confirmed'
                      ? 'A compra foi confirmada, mas houve um problema ao atualizar os dados locais.'
                      : 'Houve um problema ao encerrar a tentativa salva.'}
                  </p>

                  <p className="mt-2">{cartError}</p>

                  <Button
                    type="button"
                    className="mt-3"
                    onClick={() =>
                      setRetryVersion((previous) => previous + 1)
                    }
                  >
                    Tentar atualizar novamente
                  </Button>
                </div>
              )}

              <p className="mt-6 border-t border-[#705039] pt-5 text-center text-xs leading-6 text-[#d2b38e]">
                {order.status === 'confirmed'
                  ? 'Compra simulada confirmada. Nenhuma transação foi enviada à blockchain.'
                  : order.status === 'refused'
                    ? 'Os itens permanecem no carrinho.'
                    : 'Você pode recarregar esta página para consultar o mesmo pedido.'}
              </p>

              <div className="mt-6 text-center">
                <Button
                  type="button"
                  disabled
                  className="bg-[#cf8946] text-[#160e0a]"
                >
                  Ver no Etherscan
                </Button>

                <p className="mt-3 text-[10px] text-[#c9b6a5]">
                  Indisponível para transações simuladas.
                </p>

                <Link
                  to="/"
                  search={initialSearch}
                  className="mt-5 inline-block text-xs text-[#e6a15a] underline"
                >
                  Continuar explorando
                </Link>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}