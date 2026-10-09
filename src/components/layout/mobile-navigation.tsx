import { Link, useRouterState } from '@tanstack/react-router'
import { Heart, House, ShoppingCart, UserRound } from 'lucide-react'
import { useCartItems } from '@/lib/cart-store'

const initialSearch = {
  search: '',
  category: [],
  network: [],
  sort: 'newest' as const,
  page: 1,
}

export function MobileNavigation() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const items = useCartItems()
  const quantity = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  function linkClass(active: boolean) {
    return `relative flex min-h-14 min-w-14 items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-[#e6a15a] ${
      active ? 'text-[#e6a15a]' : 'text-[#d2b38e]'
    }`
  }

  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-[#705039]/40 bg-[#281a13] px-4 pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-center justify-between">
        <li>
          <Link
            to="/"
            search={initialSearch}
            aria-label="Início"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={linkClass(pathname === '/')}
          >
            <House aria-hidden="true" size={23} />
          </Link>
        </li>

        <li>
          <Link
            to="/favoritos"
            aria-label="Lista de interesse"
            aria-current={pathname === '/favoritos' ? 'page' : undefined}
            className={linkClass(pathname === '/favoritos')}
          >
            <Heart aria-hidden="true" size={23} />
          </Link>
        </li>

        <li>
          <Link
            to="/carrinho"
            aria-label={`Carrinho com ${quantity} itens`}
            aria-current={pathname === '/carrinho' ? 'page' : undefined}
            className={linkClass(pathname === '/carrinho')}
          >
            <ShoppingCart aria-hidden="true" size={23} />

            {quantity > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 rounded-full bg-[#cf8946] px-1.5 text-[10px] text-[#160e0a]"
              >
                {quantity}
              </span>
            )}
          </Link>
        </li>

        <li>
          <Link
            to="/perfil"
            aria-label="Meu perfil"
            aria-current={pathname === '/perfil' ? 'page' : undefined}
            className={linkClass(pathname === '/perfil')}
          >
            <UserRound aria-hidden="true" size={23} />
          </Link>
        </li>
      </ul>
    </nav>
  )
}