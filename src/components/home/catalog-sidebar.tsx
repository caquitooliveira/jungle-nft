import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ethToWei } from '@/lib/eth'
import type { CatalogSearch } from '@/lib/catalog-search'
import type { Nft } from '@/types/nft'

const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
]

const networks = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

interface CatalogSidebarProps {
  filters: CatalogSearch
  nfts: Nft[]
  countsReady: boolean
  onToggle: (key: 'category' | 'network', value: string) => void
  onUpdate: (changes: Partial<CatalogSearch>) => void
  onClear: () => void
}

export function CatalogSidebar({
  filters,
  nfts,
  countsReady,
  onToggle,
  onUpdate,
  onClear,
}: CatalogSidebarProps) {
  const hasFilters = Boolean(
    filters.search ||
      filters.category.length ||
      filters.network.length ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined,
  )

  return (
    <div className="bg-[#281a13] px-6 py-7">
      <fieldset>
        <legend className="mb-4 text-lg font-bold">
          Coleções
        </legend>

        <div className="space-y-1">
          {categories.map((category) => {
            const selected = filters.category.includes(category)
            const count = nfts.filter(
              (nft) => nft.category === category,
            ).length

            return (
              <label
                key={category}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-2.5 text-sm focus-within:outline-2 focus-within:outline-[#e6a15a] ${
                  selected ? 'text-[#e6a15a]' : 'text-[#c7aa88]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle('category', category)}
                  className="sr-only"
                />

                <span className={selected ? 'font-bold' : ''}>
                  {category}
                </span>

                <span>
                  ({countsReady ? count : '…'})
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <PriceRange
        key={`${filters.minPrice ?? ''}:${filters.maxPrice ?? ''}`}
        minimum={filters.minPrice}
        maximum={filters.maxPrice}
        onApply={(minPrice, maxPrice) =>
          onUpdate({ minPrice, maxPrice })
        }
      />

      <fieldset className="mt-8">
        <legend className="mb-4 text-lg font-bold">Rede</legend>

        <div className="space-y-1">
          {networks.map((network) => {
            const selected = filters.network.includes(network.value)
            const count = nfts.filter(
              (nft) => nft.network === network.value,
            ).length

            return (
              <label
                key={network.value}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-2.5 text-sm focus-within:outline-2 focus-within:outline-[#e6a15a] ${
                  selected ? 'text-[#e6a15a]' : 'text-[#c7aa88]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle('network', network.value)}
                  className="sr-only"
                />

                <span className={selected ? 'font-bold' : ''}>
                  {network.label}
                </span>

                <span>
                  ({countsReady ? count : '…'})
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 text-xs text-[#e6a15a] underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

function PriceRange({
  minimum,
  maximum,
  onApply,
}: {
  minimum?: string
  maximum?: string
  onApply: (minimum: string, maximum: string) => void
}) {
  const [minPrice, setMinPrice] = useState(minimum ?? '0.02')
  const [maxPrice, setMaxPrice] = useState(maximum ?? '12.30')
  const [error, setError] = useState('')

  const minValue = Number(minPrice)
  const maxValue = Number(maxPrice)
  const rangeLimit = Math.max(
    15,
    Math.ceil(minValue),
    Math.ceil(maxValue),
  )

  const trackClass =
    'pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6a15a] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#281a13] [&::-webkit-slider-thumb]:bg-[#cf8946] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[#281a13] [&::-moz-range-thumb]:bg-[#cf8946]'

  return (
    <form
      className="mt-8"
      onSubmit={(event) => {
        event.preventDefault()

        try {
          if (ethToWei(minPrice) > ethToWei(maxPrice)) {
            setError('O preço mínimo não pode superar o máximo.')
            return
          }

          setError('')
          onApply(minPrice, maxPrice)
        } catch {
          setError('Informe uma faixa de preço válida.')
        }
      }}
    >
      <h2 className="text-lg font-bold">Faixa de preço</h2>

      <div className="relative mx-2 mt-4 h-8">
        <div className="absolute inset-x-0 top-3.5 h-1 rounded-full bg-[#705039]">
          <div
            className="absolute h-full rounded-full bg-[#cf8946]"
            style={{
              left: `${(minValue / rangeLimit) * 100}%`,
              right: `${100 - (maxValue / rangeLimit) * 100}%`,
            }}
          />
        </div>

        <input
          type="range"
          aria-label="Preço mínimo em ETH"
          min={0}
          max={rangeLimit}
          step="0.01"
          value={minValue}
          onChange={(event) => {
            setMinPrice(
              Math.min(Number(event.target.value), maxValue).toFixed(2),
            )
            setError('')
          }}
          className={`${trackClass} ${
            minValue === maxValue ? 'z-20' : 'z-10'
          }`}
        />

        <input
          type="range"
          aria-label="Preço máximo em ETH"
          min={0}
          max={rangeLimit}
          step="0.01"
          value={maxValue}
          onChange={(event) => {
            setMaxPrice(
              Math.max(Number(event.target.value), minValue).toFixed(2),
            )
            setError('')
          }}
          className={`${trackClass} ${
            minValue === maxValue ? 'z-10' : 'z-20'
          }`}
        />
      </div>

      <p className="mt-2 text-sm">
        Preço: {minPrice.replace('.', ',')} –{' '}
        {maxPrice.replace('.', ',')} ETH
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="mt-3 bg-[#cf8946] text-[#160e0a] hover:bg-[#e6a15a]"
      >
        Aplicar
      </Button>
    </form>
  )
}