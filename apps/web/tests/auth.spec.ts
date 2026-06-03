import { expect, test } from '@playwright/test'

const SIGNUP_EMAIL = `pw-smoke-${Date.now()}@rootmatching.dev`
const SIGNUP_PASSWORD = 'TempPass!2026'
const SIGNUP_NAME = 'Playwright Smoke'

test('signup via login page sets better-auth.session_token and lands on dashboard', async ({
  page,
  baseURL,
}) => {
  expect(baseURL).toBeTruthy()
  await page.goto('/login')

  // Switch to register tab. Tab buttons + submit button share the "회원가입"
  // label, so scope each to its wrapper.
  await page.locator('section > div.mb-6').getByRole('button', { name: '회원가입' }).click()

  await page.getByLabel('이름').fill(SIGNUP_NAME)
  await page.getByLabel('이메일').fill(SIGNUP_EMAIL)
  await page.getByLabel('비밀번호').fill(SIGNUP_PASSWORD)
  await page.getByLabel('발주처').check()
  await page.locator('input[type="checkbox"]').check()
  await page.locator('form').getByRole('button', { name: '회원가입' }).click()

  await page.waitForURL(/\/dashboard|\/role-select/, { timeout: 15_000 })

  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find((c) => c.name.startsWith('better-auth.session_token'))
  expect(sessionCookie).toBeDefined()
  expect(sessionCookie?.httpOnly).toBe(true)
  expect(sessionCookie?.secure).toBe(false)
  expect(sessionCookie?.sameSite).toMatch(/Lax/i)
})
