export interface CatalogSearch {
  search: string
  category: string[]
  network: string[]
  sort: 'newest' | 'name'
  page: number
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(
      value.filter((item): item is string => typeof item === 'string'),
    )]
  }

  return typeof value === 'string' ? [value] : []
}

export function validateCatalogSearch(
  params: Record<string, unknown>,
): CatalogSearch {
  const page = Number(params.page)

  return {
    search: typeof params.search === 'string' ? params.search : '',
    category: stringArray(params.category),
    network: stringArray(params.network).filter((network) =>
      ['ethereum', 'polygon', 'solana'].includes(network),
    ),
    sort: params.sort === 'name' ? 'name' : 'newest',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}