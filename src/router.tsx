import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from '@tanstack/react-router'
import { HomePage } from '@/pages/home-page'
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
  component: lazyRouteComponent(
    () => import('@/pages/nft-detail-page'),
    'NftDetailPage',
  ),
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  component: lazyRouteComponent(
    () => import('@/pages/cart-page'),
    'CartPage',
  ),
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  component: lazyRouteComponent(
    () => import('@/pages/checkout-page'),
    'CheckoutPage',
  ),
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pedidos/$orderId',
  component: lazyRouteComponent(
    () => import('@/pages/order-confirmation-page'),
    'OrderConfirmationPage',
  ),
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: lazyRouteComponent(
    () => import('@/pages/profile-page'),
    'ProfilePage',
  ),
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carteiras',
  component: lazyRouteComponent(
    () => import('@/pages/wallets-page'),
    'WalletsPage',
  ),
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favoritos',
  component: lazyRouteComponent(
    () => import('@/pages/favorites-page'),
    'FavoritesPage',
  ),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  profileRoute,
  walletsRoute,
  favoritesRoute,
])

export const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}