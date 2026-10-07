import { Button } from '@/components/ui/button'

interface HomePromotionsProps {
  onExplore: (category: string) => void
}

export function HomePromotions({ onExplore }: HomePromotionsProps) {
  return (
    <section
      aria-label="Destaques do marketplace"
      className="mt-16 grid gap-6 md:grid-cols-2"
    >
      <article className="grid grid-cols-2 overflow-hidden rounded-lg bg-[#281a13]">
        <img
          src="/images/ape-green.png"
          alt="Macaco de jaqueta verde e óculos"
          width={1254}
          height={1254}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        <div className="flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-sm font-bold">
            Lançamentos gênesis de edição limitada
          </h2>
          <p className="mt-3 text-xs leading-5 text-[#c7aa88]">
            Colecione edições escassas diretamente dos criadores.
          </p>
          <Button
            className="mt-4 bg-[#ce8844] text-[#160e0a] hover:bg-[#e49b53]"
            onClick={() => onExplore('Colecionáveis')}
          >
            Explorar →
          </Button>
        </div>
      </article>

      <article className="grid grid-cols-2 overflow-hidden rounded-lg bg-[#281a13]">
        <img
          src="/images/ape-black.png"
          alt="Macaco de paletó claro"
          width={1254}
          height={1254}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        <div className="flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-sm font-bold">
            Arte digital selecionada e muito mais
          </h2>
          <p className="mt-3 text-xs leading-5 text-[#c7aa88]">
            Explore novos artistas, coleções e obras digitais.
          </p>
          <Button
            className="mt-4 bg-[#ce8844] text-[#160e0a] hover:bg-[#e49b53]"
            onClick={() => onExplore('Arte digital')}
          >
            Explorar →
          </Button>
        </div>
      </article>
    </section>
  )
}