import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { addCartItem } from '@/lib/cart-store'

interface BuyNftButtonProps {
  nftId: string
  editionId: string
  quantity: number
  availableQuantity: number
}

export function BuyNftButton({
  nftId,
  editionId,
  quantity,
  availableQuantity,
}: BuyNftButtonProps) {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  return (
    <div>
      <Button
        type="button"
        disabled={!editionId || quantity < 1 || availableQuantity < 1}
        onClick={() => {
          setError('')

          try {
            addCartItem(
              { nftId, editionId, quantity },
              availableQuantity,
            )
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : 'Não foi possível salvar o carrinho.',
            )
            return
          }

          void navigate({ to: '/carrinho' as never })
        }}
        className="bg-[#cf8946] px-6 text-xs uppercase text-[#160e0a] hover:bg-[#e6a15a]"
      >
        Comprar
      </Button>

      {error && (
        <p role="alert" className="mt-2 max-w-60 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}