import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openLogin(page: Page) {
  await page.getByRole('banner').getByRole('button', {
    name: 'Entrar',
    exact: true,
  }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  return dialog
}

async function signIn(page: Page) {
  const dialog = await openLogin(page)

  await dialog.getByLabel('E-mail', { exact: true }).fill(
    'caio@kurio.test',
  )

  await dialog.getByLabel('Senha', { exact: true }).fill(
    'Kurio123!',
  )

  await dialog.locator('form').getByRole('button', {
    name: 'Entrar',
    exact: true,
  }).click()

  await expect(dialog).not.toBeVisible()

  await expect(
    page.getByRole('banner').locator('summary'),
  ).toContainText('Minha conta')
}

test('mostra erro ao informar senha incorreta', async ({ page }) => {
  await page.goto('/')

  const dialog = await openLogin(page)

  await dialog.getByLabel('E-mail', { exact: true }).fill(
    'caio@kurio.test',
  )

  await dialog.getByLabel('Senha', { exact: true }).fill(
    'SenhaIncorreta123!',
  )

  await dialog.locator('form').getByRole('button', {
    name: 'Entrar',
    exact: true,
  }).click()

  await expect(dialog.getByRole('alert')).toContainText(
    'E-mail ou senha incorretos.',
  )

  await expect(dialog).toBeVisible()
})

test('mantém a sessão ao recarregar e permite sair', async ({ page }) => {
  await page.goto('/')
  await signIn(page)

  await page.reload()

  const accountMenu = page.getByRole('banner').locator('summary')

  await expect(accountMenu).toContainText('Minha conta')
  await accountMenu.click()

  await page.getByRole('banner').getByRole('button', {
    name: 'Sair',
    exact: true,
  }).click()

  await expect(
    page.getByRole('banner').getByRole('button', {
      name: 'Entrar',
      exact: true,
    }),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByRole('banner').getByRole('button', {
      name: 'Entrar',
      exact: true,
    }),
  ).toBeVisible()
})

test('valida a confirmação de senha e cadastra uma conta', async ({
  page,
}) => {
  await page.goto('/')

  const dialog = await openLogin(page)

  await dialog.getByRole('button', {
    name: 'Criar conta',
    exact: true,
  }).click()

  await dialog.getByLabel('Nome de usuário', {
    exact: true,
  }).fill('Colecionador E2E')

  await dialog.getByLabel('E-mail', { exact: true }).fill(
    'colecionador-e2e@kurio.test',
  )

  await dialog.getByLabel('Senha', { exact: true }).fill(
    'TesteKurio123!',
  )

  await dialog.getByLabel('Confirmar senha', {
    exact: true,
  }).fill('OutraSenha123!')

  await dialog.locator('form').getByRole('button', {
    name: 'Criar conta',
    exact: true,
  }).click()

  await expect(dialog.getByRole('alert')).toContainText(
    'As senhas não coincidem.',
  )

  await dialog.getByLabel('Confirmar senha', {
    exact: true,
  }).fill('TesteKurio123!')

  await dialog.locator('form').getByRole('button', {
    name: 'Criar conta',
    exact: true,
  }).click()

  await expect(dialog).not.toBeVisible()

  await expect(
    page.getByRole('banner').locator('summary'),
  ).toContainText('Minha conta')
})

test('compra um NFT e não repete a baixa ao reabrir o recibo', async ({
  page,
}) => {
  test.setTimeout(60_000)

  await page.goto('/nfts/nft-001')

  await expect(
    page.getByRole('heading', { level: 1 }),
  ).toContainText('Emerald Ape')

  const edition = page.getByRole('radio', {
    name: '1/50',
    exact: true,
  })

  await page.locator('label').filter({
    has: edition,
  }).click()

  await expect(edition).toBeChecked()

  await expect(
    page.getByText(
      '5 unidades disponíveis nesta edição.',
      { exact: true },
    ),
  ).toBeVisible()

  await page.getByRole('button', {
    name: 'Comprar',
    exact: true,
  }).click()

  await expect(page).toHaveURL(/\/carrinho/)

  // Entrar deve preservar o item adicionado como visitante.
  await signIn(page)

  await page.goto('/pagamento')

  await expect(
    page.getByRole('heading', {
      name: 'Seus NFTs',
      exact: true,
    }),
  ).toBeVisible()

  await page.locator('#checkout-display-name').fill('Caio E2E')
  await page.locator('#checkout-username').fill('caio-e2e')
  await page.locator('#checkout-profile-name').fill('Coleção E2E')
  await page.locator('#checkout-email').fill('caio@kurio.test')

  await page.locator('#checkout-network').selectOption('ethereum')
  await page.locator('#checkout-wallet-type').selectOption('coinbase')

  await page.locator('#checkout-address').fill(
    '0x1111111111111111111111111111111111111111',
  )

  await page.locator('#checkout-referral').fill('DEMO')

  await page.getByRole('button', {
    name: 'Confirmar compra',
    exact: true,
  }).click()

  await expect(page).toHaveURL(/\/pedidos\/[^/?]+/)

  const receiptUrl = page.url()

  await expect(
    page.getByRole('heading', {
      name: 'Seus NFTs agora estão na sua carteira',
      exact: true,
    }),
  ).toBeVisible()

  await page.goto('/nfts/nft-001')

  await page.locator('label').filter({
    has: page.getByRole('radio', {
      name: '1/50',
      exact: true,
    }),
  }).click()

  await expect(
    page.getByText(
      '4 unidades disponíveis nesta edição.',
      { exact: true },
    ),
  ).toBeVisible()

  // Consulta novamente o mesmo pedido.
  await page.goto(receiptUrl)

  await expect(
    page.getByRole('heading', {
      name: 'Seus NFTs agora estão na sua carteira',
      exact: true,
    }),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByRole('heading', {
      name: 'Seus NFTs agora estão na sua carteira',
      exact: true,
    }),
  ).toBeVisible()

  await page.goto('/nfts/nft-001')

  await page.locator('label').filter({
    has: page.getByRole('radio', {
      name: '1/50',
      exact: true,
    }),
  }).click()

  await expect(
    page.getByText(
      '4 unidades disponíveis nesta edição.',
      { exact: true },
    ),
  ).toBeVisible()

  // A confirmação deve retirar o item comprado do carrinho.
  await page.goto('/carrinho')

  await expect(
    page.getByText(/Seu carrinho está vazio/).first(),
  ).toBeVisible()
})