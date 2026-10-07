const highlights = [
  {
    icon: 'W',
    title: 'Segurança da carteira',
    description:
      'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    icon: 'C',
    title: 'Criadores em destaque',
    description:
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital.',
  },
  {
    icon: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Descubra novidades, lançamentos e tendências do mercado.',
  },
]

const groups = [
  {
    title: 'Meu perfil',
    items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador'],
  },
  {
    title: 'Central de ajuda',
    items: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
    ],
  },
  {
    title: 'Coleções',
    items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
]

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl bg-[#281a13]">
      <div className="grid gap-8 p-6 md:grid-cols-2 lg:grid-cols-4">
        {highlights.map((highlight) => (
          <section key={highlight.title}>
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ce8844] font-bold text-[#160e0a]"
            >
              {highlight.icon}
            </span>

            <h2 className="mt-4 text-sm font-bold">{highlight.title}</h2>

            <p className="mt-3 text-xs leading-5 text-[#c7aa88]">
              {highlight.description}
            </p>
          </section>
        ))}

        <section>
          <h2 className="text-sm font-bold">
            Antecipe-se ao próximo lançamento
          </h2>

          <label htmlFor="newsletter-email" className="sr-only">
            E-mail para novidades
          </label>

          <div className="mt-4 flex">
            <input
              id="newsletter-email"
              type="email"
              placeholder="Digite seu e-mail..."
              disabled
              className="min-w-0 flex-1 rounded-l bg-[#3b2513] p-2 text-xs"
            />
            <button
              type="button"
              disabled
              className="rounded-r bg-[#ce8844] px-3 text-sm text-[#160e0a]"
            >
              Enviar
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-[#c7aa88]">
            Newsletter indisponível nesta demonstração.
          </p>
        </section>
      </div>

      <div className="grid gap-4 bg-[#3b2513] px-6 py-5 text-xs md:grid-cols-4">
        <p className="font-bold tracking-widest">KURIO</p>
        <p>Feito para colecionadores, criadores e cultura</p>
        <p>contato@email.com</p>
        <p>+55 11 4002 8922</p>
      </div>

      <div className="grid gap-8 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="text-sm font-bold">{group.title}</h2>

            <ul className="mt-3 space-y-2 text-xs text-[#c7aa88]">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="text-sm font-bold">Redes sociais</h2>
          <p className="mt-3 text-xs text-[#c7aa88]">
            Canais não disponíveis na demonstração.
          </p>

          <h2 className="mt-6 text-sm font-bold">Carteiras compatíveis</h2>
          <p className="mt-3 text-xs text-[#e6a15a]">
            MetaMask · WalletConnect · Coinbase
          </p>
        </section>
      </div>
    </footer>
  )
}