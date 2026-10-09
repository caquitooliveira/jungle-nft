import { expect, test } from '@playwright/test'

test('carrega o catálogo e permite abrir um NFT', async ({ page }) => {
  await page.goto('/')

  const catalog = page.getByRole('region', {
    name: 'Catálogo de NFTs',
  })

  await expect(catalog.getByRole('article')).toHaveCount(9)

  await catalog
    .getByRole('link')
    .filter({ hasText: /#/ })
    .first()
    .click()

  await expect(page).toHaveURL(/\/nfts\/nft-\d+/)

  await expect(
    page.getByRole('heading', { level: 1 }),
  ).toBeVisible()

  await expect(
    page.getByRole('group', {
      name: 'Miniaturas do NFT',
    }),
  ).toBeVisible()
})

test('preserva a categoria ao recarregar', async ({ page }, testInfo) => {
  await page.goto('/')

  async function openMobileFilters() {
    if (testInfo.project.name !== 'mobile') {
      return
    }

    const toggle = page.getByText('Filtros do catálogo', {
      exact: true,
    })

    await expect(toggle).toBeVisible()
    await toggle.click()
  }

  await openMobileFilters()

  const musicCheckbox = page.getByRole('checkbox', {
    name: /Música/,
  })

  await expect(musicCheckbox).toBeVisible()

  await page.locator('label').filter({
    has: musicCheckbox,
  }).click()

  await expect(musicCheckbox).toBeChecked()

  await expect(page).toHaveURL((url) =>
    (url.searchParams.get('category') ?? '').includes('Música'),
  )

  await page.reload()
  await openMobileFilters()

  await expect(musicCheckbox).toBeVisible()
  await expect(musicCheckbox).toBeChecked()
})

test('atualiza preço e estoque em tempo real', async ({ page }) => {
  const connected = page.waitForEvent('console', {
    predicate: (message) =>
      message.text().includes(
        '[Socket.IO] Conexão em tempo real funcionando.',
      ),
  })

  await page.goto('/nfts/nft-001')
  await connected

  await expect(
    page.getByRole('heading', { level: 1 }),
  ).toContainText('Emerald Ape')

  const standardEdition = page.getByRole('radio', {
    name: '1/50',
    exact: true,
  })

  await page
    .locator('label')
    .filter({ has: standardEdition })
    .click()

  await expect(standardEdition).toBeChecked()

  const updateStatus = await page.evaluate(async () => {
    const response = await fetch('/api/mock/nfts/nft-001', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        editionId: 'nft-001-standard',
        priceEth: '1.75',
        availableQuantity: 3,
      }),
    })

    return response.status
  })

  expect(updateStatus).toBe(200)

  await expect(
    page.getByText('1.75 ETH', { exact: true }).first(),
  ).toBeVisible()

  await expect(
    page.getByText(
      '3 unidades disponíveis nesta edição.',
      { exact: true },
    ),
  ).toBeVisible()

  const unavailableStatus = await page.evaluate(async () => {
    const response = await fetch('/api/mock/nfts/nft-001', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        editionId: 'nft-001-standard',
        availableQuantity: 0,
      }),
    })

    return response.status
  })

  expect(unavailableStatus).toBe(200)

  await expect(
    page.getByText('Edição indisponível.', { exact: true }),
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: 'Aumentar quantidade',
    }),
  ).toBeDisabled()

  await page.reload()

  await page
    .locator('label')
    .filter({
      has: page.getByRole('radio', {
        name: '1/50',
        exact: true,
      }),
    })
    .click()

  await expect(
    page.getByRole('radio', {
      name: '1/50',
      exact: true,
    }),
  ).toBeChecked()

  await expect(
    page.getByText('Edição indisponível.', { exact: true }),
  ).toBeVisible()
})

test('a página inicial não ultrapassa a largura da tela', async ({
  page,
}) => {
  await page.goto('/')

  const catalog = page.getByRole('region', {
    name: 'Catálogo de NFTs',
  })

  await expect(catalog.getByRole('article')).toHaveCount(9)

  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))

  expect(dimensions.content).toBeLessThanOrEqual(
    dimensions.viewport + 1,
  )
})