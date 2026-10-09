import { Button } from '@/components/ui/button'

export function HomeHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-center gap-8 py-12 md:grid-cols-2 md:gap-16"
    >
      <div>
        <p className="mb-4 text-sm">Bem-vindo à Kurio</p>

        <h1
          id="hero-title"
          className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl"
        >
          SEJA DONO DO FUTURO
          <br />
          DA ARTE DIGITAL
        </h1>

        <p className="mt-5 max-w-lg text-sm leading-6 text-[#c7aa88]">
          Descubra NFTs selecionados de criadores emergentes e consagrados.
          Colecione arte digital rara, apoie artistas e tenha uma parte da
          cultura da internet.
        </p>

        <Button
          className="mt-6 bg-[#ce8844] text-[#160e0a] hover:bg-[#e49b53]"
          onClick={() => {
            document.getElementById('catalogo')?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'instant'
                : 'smooth',
            })
          }}
        >
          EXPLORAR
        </Button>
      </div>

      <img
        src="/images/ape-green.webp"
        alt="Macaco de jaqueta verde e óculos, destaque da coleção Kurio"
        width={1254}
        height={1254}
        fetchPriority="high"
        className="aspect-square w-full max-w-md justify-self-center rounded-2xl object-cover md:justify-self-end"
      />
    </section>
  )
}