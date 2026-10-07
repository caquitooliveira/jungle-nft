import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <main className="min-h-screen bg-stone-950 p-8 text-stone-100">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>

      <Link
        to="/"
        search={{
          search: '',
          category: [],
          network: [],
          sort: 'newest',
          page: 1,
        }}
        className="mt-4 inline-block underline"
      >
        Voltar ao início
      </Link>
    </main>
  )
}