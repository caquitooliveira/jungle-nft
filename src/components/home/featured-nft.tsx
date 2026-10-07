export function FeaturedNft() {
  return (
    <section
      aria-labelledby="featured-nft-title"
      className="overflow-hidden rounded-xl border border-[#705039] bg-[#281a13]"
    >
      <div className="p-4">
        <h2
          id="featured-nft-title"
          className="text-sm font-bold uppercase tracking-wider"
        >
          NFT em destaque  <br />
          Oferta Limitada
        </h2>
      </div>

      <img
        src="/images/ape-purple.png"
        alt="NFT de um macaco com roupas e acessórios roxos"
        width={1254}
        height={1254}
        loading="lazy"
        decoding="async"
        className="aspect-square w-full object-cover"
      />

    </section>
  )
}