import { useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useCartItems } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth-context'

interface SiteHeaderProps {
  isSearchOpen: boolean
  onToggleSearch: () => void
}

const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

export function SiteHeader({
  isSearchOpen,
  onToggleSearch,
}: SiteHeaderProps) {
  const { session, isLoading, openAuth, signOut } = useAuth()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const logoutBusyRef = useRef(false)
  const [authError, setAuthError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const location = useRouterState({
    select: (state) => state.location,
  })

  const items = useCartItems()
  const quantity = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const isHome =
    location.pathname === '/' && location.hash !== 'catalogo'

  const isMarket =
    (location.pathname === '/' && location.hash === 'catalogo') ||
    location.pathname.startsWith('/nfts/')

  const navigationClass = (active: boolean) =>
    `flex min-h-16 items-center border-b-2 text-xs transition-colors ${
      active
        ? 'border-[#cf8946] text-[#e6a15a]'
        : 'border-transparent text-[#f5eee8] hover:text-[#e6a15a]'
    }`

  function closeAccountMenu() {
    if (detailsRef.current) {
      detailsRef.current.open = false
    }
  }

  async function handleSignOut() {
    if (logoutBusyRef.current) {
      return
    }

    logoutBusyRef.current = true
    setIsSigningOut(true)
    setAuthError('')

    try {
      await signOut()
      closeAccountMenu()
    } catch {
      setAuthError('Não foi possível sair. Tente novamente.')
    } finally {
      logoutBusyRef.current = false
      setIsSigningOut(false)
    }
  }

  return (
    <header className="px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr] items-center gap-x-4 border-b border-[#705039]/50 lg:grid-cols-[1fr_auto_1fr]">
        <Link
          to="/"
          search={initialSearch}
          className="justify-self-start text-sm font-bold tracking-widest"
        >
          KURIO
        </Link>

        <nav
          aria-label="Navegação principal"
          className="order-3 col-span-2 justify-self-center lg:order-none lg:col-span-1"
        >
          <ul className="flex items-center gap-5 sm:gap-8">
            <li>
              <Link
                to="/"
                search={initialSearch}
                aria-current={isHome ? 'page' : undefined}
                className={navigationClass(isHome)}
              >
                Início
              </Link>
            </li>

            <li>
              <Link
                to="/"
                search={initialSearch}
                hash="catalogo"
                aria-current={isMarket ? 'page' : undefined}
                className={navigationClass(isMarket)}
              >
                Mercado
              </Link>
            </li>

            <li>
              <span className={navigationClass(false)}>
                Criadores
              </span>
            </li>

            <li>
              <span className={navigationClass(false)}>
                Aprenda
              </span>
            </li>
          </ul>
        </nav>

        <div className="flex min-h-16 items-center justify-self-end gap-3 sm:gap-5">
          <button
            type="button"
            aria-label={isSearchOpen ? 'Fechar busca' : 'Buscar NFTs'}
            aria-expanded={isSearchOpen}
            aria-controls="catalog-search-panel"
            onClick={onToggleSearch}
            className="flex size-9 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6a15a]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
          </button>

          <Link
            to="/carrinho"
            aria-label={`Carrinho com ${quantity} ${
              quantity === 1 ? 'item' : 'itens'
            }`}
            className="relative flex size-9 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6a15a]"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 3h3l3 13h11l3-9H6" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="19" cy="20" r="1" />
            </svg>

            <span
              aria-hidden="true"
              className="absolute -right-1 top-0 flex min-w-4 items-center justify-center rounded-full bg-[#cf8946] px-1 text-[10px] font-bold text-[#160e0a]"
            >
              {quantity}
            </span>
          </Link>

          {isLoading ? (
            <button
              type="button"
              disabled
              className="rounded-md bg-[#cf8946] px-3 py-2 text-xs font-bold text-[#160e0a]"
            >
              Aguarde...
            </button>
          ) : session ? (
            <details
              ref={detailsRef}
              key={session.user.id}
              className="relative"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  closeAccountMenu()
                  detailsRef.current
                    ?.querySelector<HTMLElement>('summary')
                    ?.focus()
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  closeAccountMenu()
                }
              }}
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md bg-[#cf8946] px-3 py-2 text-xs font-bold text-[#160e0a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6a15a] [&::-webkit-details-marker]:hidden">
                Minha conta
                <span aria-hidden="true">▾</span>
              </summary>

              <nav
                aria-label="Menu da conta"
                className="absolute right-0 top-full z-30 mt-2 w-56 rounded-md border border-[#705039] bg-[#281a13] p-2 text-sm shadow-lg"
              >
                <p className="truncate border-b border-[#705039]/50 px-3 py-3 text-xs text-[#c7aa88]">
                  {session.user.username}
                </p>

                <Link
                  to="/perfil"
                  onClick={closeAccountMenu}
                  className="block rounded px-3 py-3 hover:bg-[#36251c] focus-visible:outline-2 focus-visible:outline-[#e6a15a]"
                >
                  Meu perfil
                </Link>

                <Link
                  to="/carteiras"
                  onClick={closeAccountMenu}
                  className="block rounded px-3 py-3 hover:bg-[#36251c] focus-visible:outline-2 focus-visible:outline-[#e6a15a]"
                >
                  Carteiras
                </Link>

                <Link
                  to="/favoritos"
                  onClick={closeAccountMenu}
                  className="block rounded px-3 py-3 hover:bg-[#36251c] focus-visible:outline-2 focus-visible:outline-[#e6a15a]"
                >
                  Lista de interesse
                </Link>

                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => void handleSignOut()}
                  className="mt-1 w-full border-t border-[#705039]/50 px-3 py-3 text-left text-[#e6a15a] disabled:opacity-50"
                >
                  {isSigningOut ? 'Saindo...' : 'Sair'}
                </button>

                {authError && (
                  <p role="alert" className="px-3 pb-3 text-xs text-red-300">
                    {authError}
                  </p>
                )}
              </nav>
            </details>
          ) : (
            <button
              type="button"
              onClick={openAuth}
              className="flex items-center gap-2 rounded-md bg-[#cf8946] px-3 py-2 text-xs font-bold text-[#160e0a]"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  )
}