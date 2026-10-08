import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { HomePage } from '@/pages/home-page'
import { NftDetailPage } from '@/pages/nft-detail-page'
import { CartPage } from '@/pages/cart-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { validateCatalogSearch } from '@/lib/catalog-search'

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomePage,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  component: CartPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftDetailRoute,
  cartRoute,
])

export const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}