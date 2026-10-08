import { delay, http, HttpResponse } from 'msw'
import { calculateCartQuote, MockApiError } from './cart-quote'

export const cartHandlers = [
  http.post('/api/cart/quote', async ({ request }) => {
    await delay(300)

    try {
      const body: unknown = await request.json()
      const quote = calculateCartQuote(body)

      return HttpResponse.json(quote)
    } catch (error) {
      if (error instanceof MockApiError) {
        return HttpResponse.json(
          { code: error.code, message: error.message },
          { status: error.status },
        )
      }

      return HttpResponse.json(
        {
          code: 'INVALID_CART',
          message: 'Não foi possível interpretar o carrinho.',
        },
        { status: 400 },
      )
    }
  }),
]