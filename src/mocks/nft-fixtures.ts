import type { Nft } from '@/types/nft'

const artworks = [
  {
    name: 'Emerald Ape',
    imageUrl: '/images/ape-green.png',
    creator: 'Jungle Studio',
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
  },
  {
    name: 'Sage Nomad',
    imageUrl: '/images/ape-purple.png',
    creator: 'Nomad Collective',
    attributes: ['Chapéu', 'Violeta', 'Raro'],
  },
  {
    name: 'Golden Beat',
    imageUrl: '/images/ape-gold.png',
    creator: 'Golden Studio',
    attributes: ['Fones', 'Dourado', 'Musical'],
  },
  {
    name: 'Neon Vessel',
    imageUrl: '/images/ape-black.png',
    creator: 'Neon Collective',
    attributes: ['Traje', 'Marfim', 'Elegante'],
  },
]

const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
]

const networks = ['ethereum', 'polygon', 'solana'] as const
const prices = ['1.19', '1.39', '0.99', '1.79']

const reviewComments = [
  'Gostei dos detalhes e das cores da arte.',
  'Uma peça interessante para minha coleção.',
  'A identidade visual desta coleção é muito bonita.',
]

export function createNftFixtures(): Nft[] {
  return Array.from({ length: 24 }, (_, index) => {
    const artwork = artworks[index % artworks.length]
    const number = String(index + 1).padStart(3, '0')
    const tokenNumber = String(index + 42).padStart(3, '0')
    const network = networks[Math.floor(index / 2) % networks.length]
    const name = `${artwork.name} #${tokenNumber}`
    const collection = 'Kurio Apes'
    const priceEth = prices[index % prices.length]

    return {
      id: `nft-${number}`,
      name,
      description:
        `Um colecionável digital finalizado à mão da coleção ${collection}, ` +
        `com arte desbloqueável e acesso para colecionadores.`,
      details: [
        `${name} é uma obra digital da coleção ${collection}. ` +
          'Cada atributo faz parte da identidade da peça. ' +
          'A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.',
        'A coleção inclui arte em alta resolução e experiências para colecionadores. ' +
          'Nesta aplicação, propriedade, transações e benefícios são simulados.',
      ],
      imageUrl: artwork.imageUrl,
      gallery: Array.from({ length: 4 }, () => artwork.imageUrl),
      category: categories[Math.floor(index / 4) % categories.length],
      collection,
      attributes: artwork.attributes,
      network,
      networkDescription:
        `Registro simulado na rede ${network}, com metadados demonstrativos.`,
      contractAddress: `0x${(index + 1).toString(16).padStart(40, '0')}`,
      contractDescription:
        'Contrato demonstrativo. Nenhuma transação é enviada à blockchain.',
      royaltyPercent: 5,
      reviews: Array.from(
        { length: index === 0 ? 19 : 3 + (index % 5) },
        (_, reviewIndex) => ({
          id: `nft-${number}-review-${reviewIndex + 1}`,
          collector: `Colecionador ${reviewIndex + 1}`,
          rating: reviewIndex % 4 === 0 ? 4 : 5,
          comment: reviewComments[reviewIndex % reviewComments.length],
        }),
      ),
      creator: artwork.creator,
      createdAt: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
      editions: [
        {
          id: `nft-${number}-unique`,
          name: '1/1',
          priceEth: '4.99',
          availableQuantity: 1,
        },
        {
          id: `nft-${number}-limited`,
          name: '1/10',
          priceEth: '2.49',
          availableQuantity: 2,
        },
        {
          id: `nft-${number}-standard`,
          name: '1/50',
          priceEth,
          availableQuantity: index === 23 ? 0 : 5,
        },
        {
          id: `nft-${number}-open`,
          name: 'ABERTA',
          priceEth: '0.49',
          availableQuantity: 20,
        },
      ],
      version: 1,
    }
  })
}