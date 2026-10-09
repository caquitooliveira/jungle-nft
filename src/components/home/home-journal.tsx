const articles = [
  {
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/ape-black.webp',
    date: '12 de setembro',
    readingTime: '6 min',
  },
  {
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/ape-green.webp',
    date: '13 de setembro',
    readingTime: '2 min',
  },
  {
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/ape-purple.webp',
    date: '15 de setembro',
    readingTime: '3 min',
  },
  {
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/ape-gold.webp',
    date: '15 de setembro',
    readingTime: '2 min',
  },
]

export function HomeJournal() {
  return (
    <section aria-labelledby="journal-title" className="mt-16">
      <h2 id="journal-title" className="text-center text-2xl font-bold">
        Diário da Cunhagem
      </h2>

      <p className="mt-3 text-center text-sm text-[#c7aa88]">
        Histórias, guias e insights para colecionadores sobre o universo
        da propriedade digital.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <article
            key={article.title}
            className="overflow-hidden rounded-lg bg-[#281a13]"
          >
            <img
              src={article.image}
              alt=""
              width={1254}
              height={1254}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />

            <div className="p-4">
              <p className="text-xs text-[#c7aa88]">
                {article.date} · Leitura de {article.readingTime}
              </p>

              <h3 className="mt-3 text-sm font-bold">{article.title}</h3>

              <p className="mt-3 text-xs leading-5 text-[#c7aa88]">
                {article.description}
              </p>

              <p className="mt-3 text-xs text-[#e6a15a]">
                Artigo indisponível nesta demonstração
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
