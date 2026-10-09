import { Button } from '@/components/ui/button'

export function HomeHero() {
  function explore() {
    document.getElementById('catalogo')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
        .matches
        ? 'instant'
        : 'smooth',
    })
  }

  return (
    <section
      aria-labelledby="hero-title"
      className="relative mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#705039] to-[#281a13] p-4 pb-8 md:mt-0 md:grid-cols-2 md:gap-16 md:rounded-none md:bg-none md:p-0 md:py-12"
    >
      <div className="min-w-0">
        <p className="mb-2 text-[10px] md:mb-4 md:text-sm">
          Bem-vindo à Kurio
        </p>

        <h1
          id="hero-title"
          className="text-base font-bold leading-relaxed md:text-4xl md:leading-tight lg:text-5xl"
        >
          <span className="md:hidden">
            SEJA DONO DA
            <br />
            CULTURA DIGITAL
          </span>

          <span className="hidden md:inline">
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </span>
        </h1>

        <p className="mt-2 text-[10px] leading-5 text-[#d2b38e] md:mt-5 md:max-w-lg md:text-sm md:leading-6">
          <span className="md:hidden">
            Descubra NFTs selecionados de criadores do mundo todo.
          </span>

          <span className="hidden md:inline">
            Descubra NFTs selecionados de criadores emergentes e
            consagrados. Colecione arte digital rara, apoie artistas e
            tenha uma parte da cultura da internet.
          </span>
        </p>

        <Button
          type="button"
          onClick={explore}
          className="mt-1 h-9 bg-transparent p-0 text-[11px] text-[#f0a457] hover:bg-transparent md:mt-6 md:h-10 md:bg-[#ce8844] md:px-4 md:text-sm md:text-[#160e0a] md:hover:bg-[#e49b53]"
        >
          EXPLORAR <span aria-hidden="true">→</span>
        </Button>
      </div>

      <div className="relative min-w-0 md:justify-self-end">
        <img
          src="/images/ape-green.webp"
          alt="Macaco de jaqueta verde e óculos, destaque da coleção Kurio"
          width={960}
          height={960}
          fetchPriority="high"
          className="aspect-square w-full rounded-2xl object-cover md:max-w-md"
        />

        <img
          src="/images/ape-purple.webp"
          alt=""
          width={64}
          height={64}
          className="absolute -bottom-2 left-2 size-12 rounded-xl border-2 border-[#d2b38e] object-cover md:hidden"
        />
      </div>
    </section>
  )
}