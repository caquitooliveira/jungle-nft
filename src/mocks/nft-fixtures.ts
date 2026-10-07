import type { Nft } from '@/types/nft'

const artworks = [
  {
    name: 'Emerald Ape',
    imageUrl: '/images/ape-green.png',
    creator: 'Jungle Studio',
  },
  {
    name: 'Sage Nomad',
    imageUrl: '/images/ape-purple.png',
    creator: 'Nomad Collective',
  },
  {
    name: 'Golden Beat',
    imageUrl: '/images/ape-gold.png',
    creator: 'Golden Studio',
  },
  {
    name: 'Neon Vessel',
    imageUrl: '/images/ape-black.png',
    creator: 'Neon Collective',
  },
]

const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
]

const networks = ['ethereum', 'polygon', 'solana'] as const

const prices = ['1.29', '1.69', '0.99', '1.99']

export function createNftFixtures(): Nft[] {
  return Array.from({ length: 24 }, (_, index) => {
    const artwork = artworks[index % artworks.length]
    const number = String(index + 1).padStart(3, '0')

    return {
      id: `nft-${number}`,
      name: `${artwork.name} #${number}`,
      description:
        'Uma obra digital da coleção Kurio, com identidade e estilo próprios.',
      imageUrl: artwork.imageUrl,
      category: categories[Math.floor(index / 4) % categories.length],
      network: networks[Math.floor(index / 2) % networks.length],
      creator: artwork.creator,
      createdAt: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
      editions: [
        {
          id: `nft-${number}-standard`,
          name: 'Standard',
          priceEth: prices[index % prices.length],
          availableQuantity: index === 23 ? 0 : 5,
        },
        {
          id: `nft-${number}-limited`,
          name: 'Limited',
          priceEth: '2.49',
          availableQuantity: 2,
        },
      ],
      version: 1,
    }
  })
}