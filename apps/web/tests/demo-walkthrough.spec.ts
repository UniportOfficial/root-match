import { expect, test, type Page } from '@playwright/test'

const CLIENT_EMAIL = 'hong@techsolution.co.kr'
const FACTORY_EMAIL = 'factory@example.kr'
const PASSWORD = 'TempPass!2026'
const DEMO_FACTORY_ID = '1'
const DEMO_COMPANIES_API_PATTERN = '**/companies?limit=100'

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL(/\/dashboard|\/factory\/requests|\/role-select/, { timeout: 15_000 })
}

test('demo walkthrough keeps client and factory flows usable', async ({ browser, baseURL }) => {
  test.setTimeout(60_000)
  expect(baseURL).toBeTruthy()

  const clientContext = await browser.newContext({ baseURL })
  const clientPage = await clientContext.newPage()
  await login(clientPage, CLIENT_EMAIL)
  await expect(
    clientPage.getByText('최근 활동 데이터가 연결되면 이 영역에 표시됩니다.'),
  ).toBeVisible()

  await clientPage.route(DEMO_COMPANIES_API_PATTERN, async (route) => {
    await route.fulfill({ status: 401, body: 'demo auth mismatch' })
  })

  await clientPage.goto('/companies')
  await expect(clientPage.getByRole('heading', { name: '기업 디렉토리' })).toBeVisible()
  await expect(clientPage.getByText('견적 요청')).toBeVisible()
  await expect(clientPage.getByText('AI 매칭')).toBeVisible()
  await expect(clientPage.locator('main').getByText('조건에 맞는 기업이 없습니다.')).toHaveCount(0)
  await expect(clientPage.getByText('문래정밀가공')).toBeVisible()

  await clientPage.getByRole('link', { name: /상세/ }).first().click()
  await expect(clientPage).toHaveURL(new RegExp(`/factories/${DEMO_FACTORY_ID}`))
  await expect(clientPage.getByRole('heading', { name: '문래정밀가공' })).toBeVisible()
  await expect(clientPage.getByRole('link', { name: /견적 요청하기/ }).first()).toBeVisible()

  await clientPage.goto('/request?demo=true')
  await clientPage.getByRole('button', { name: /예시 데이터로 채우기/ }).click()
  await clientPage
    .locator('form#request-form')
    .getByRole('button', { name: /AI 매칭 시작/ })
    .click()
  await clientPage.waitForURL(/\/matching/, { timeout: 20_000 })
  const exampleRecommendations = clientPage.getByRole('button', { name: '예시 추천 보기' })
  if (await exampleRecommendations.isVisible().catch(() => false)) {
    await exampleRecommendations.click()
  }
  await expect(clientPage.getByText('문래정밀가공').first()).toBeVisible()
  await clientContext.close()

  const factoryContext = await browser.newContext({ baseURL })
  const factoryPage = await factoryContext.newPage()
  await login(factoryPage, FACTORY_EMAIL)

  await factoryPage.goto('/request')
  await expect(factoryPage).toHaveURL(/\/factory\/requests/)

  await factoryPage.goto('/factory/requests')
  await expect(factoryPage.getByText('받은 요청')).toBeVisible()
  await expect(factoryPage.getByText('공개 견적')).toBeVisible()

  await factoryPage.goto(`/factories/${DEMO_FACTORY_ID}?demo=true`)
  await expect(factoryPage.getByRole('heading', { name: '문래정밀가공' })).toBeVisible()
  await expect(factoryPage.getByRole('link', { name: /견적 요청하기/ })).toHaveCount(0)
  await factoryContext.close()
})
