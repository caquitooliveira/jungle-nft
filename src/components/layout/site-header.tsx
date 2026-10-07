import { Link } from '@tanstack/react-router'

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
  return (
    <header className="border-b border-[#705039]/40">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-5">
        <Link
          to="/"
          search={initialSearch}
          className="justify-self-start text-xl font-bold tracking-widest"
        >
          KURIO
        </Link>

        <nav aria-label="Navegação principal">
          <ul className="flex items-center gap-4 text-sm sm:gap-8">
            <li>
              <Link
                to="/"
                search={initialSearch}
                className="border-b-2 border-[#e6a15a] pb-2 text-[#e6a15a]"
              >
                Início
              </Link>
            </li>

            <li>
              <a
                href="#catalogo"
                className="transition-colors hover:text-[#e6a15a]"
              >
                Mercado
              </a>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          aria-label={isSearchOpen ? 'Fechar busca' : 'Buscar NFTs'}
          aria-expanded={isSearchOpen}
          aria-controls="catalog-search-panel"
          onClick={onToggleSearch}
          className="flex size-10 items-center justify-center justify-self-end rounded-md transition-colors hover:bg-[#281a13] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6a15a]"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
        </button>
      </div>
    </header>
  )
}