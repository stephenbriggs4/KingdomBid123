import { expect, test } from '@playwright/test'

const mobileViewport = { width: 375, height: 812 }
const runtimeErrors = new WeakMap()

test.beforeEach(async ({ page }) => {
  const errors = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()} (${message.location().url || 'unknown source'})`)
  })
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) || []).toEqual([])
})

async function expectNoHorizontalDocumentOverflow(page) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth)
}

async function expectSingleMain(page) {
  await expect(page.locator('main')).toHaveCount(1)
}

async function expectMobileControlTargets(page) {
  const undersized = await page.locator(
    '#root button, #root [role="button"], #root [role="tab"], #root input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), #root select, #root textarea',
  ).evaluateAll((elements) => elements
    .filter((element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      const hiddenFromUsers = element.closest('[aria-hidden="true"]') || element.tabIndex < 0
      return !hiddenFromUsers && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    })
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        label: (element.innerText || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '').trim(),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
    })
    .filter((target) => target.width < 44 || target.height < 44))
  expect(undersized).toEqual([])
}

async function openAnonymousRoute(page, hash) {
  const restRequests = []
  page.on('request', (request) => {
    if (request.url().includes('/rest/v1/')) restRequests.push(request.url())
  })
  await page.route('http://127.0.0.1:54321/rest/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '*/0' },
      body: '[]',
    })
  })
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto(`/${hash}`)
  await expect(page.locator('#root')).not.toBeEmpty()
  return restRequests
}

test('anonymous landing renders one main landmark without viewport overflow', async ({ page }) => {
  await page.setViewportSize(mobileViewport)
  const restRequests = await openAnonymousRoute(page, '#landing')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expectSingleMain(page)
  await expectNoHorizontalDocumentOverflow(page)
  await expectMobileControlTargets(page)
  expect(restRequests.filter((url) => url.includes('/platform_settings'))).toEqual([])
})

for (const route of ['#vendor-signup', '#guest-post-project']) {
  test(`${route} keeps the entire legal-consent row inside a phone viewport`, async ({ page }) => {
    await page.setViewportSize(mobileViewport)
    await openAnonymousRoute(page, route)

    const row = page.locator('.kb-legal-consent-row').first()
    const checkbox = row.locator('input[type="checkbox"]')
    const label = row.locator('label')
    await expect(row).toBeVisible()
    await expect(checkbox).toBeVisible()
    await expect(label).toContainText('Terms')
    await expect(label).toContainText('Privacy Notice')

    const geometry = await row.evaluate((element) => {
      const rowRect = element.getBoundingClientRect()
      const checkboxRect = element.querySelector('input')?.getBoundingClientRect()
      const labelRect = element.querySelector('label')?.getBoundingClientRect()
      return {
        viewportWidth: document.documentElement.clientWidth,
        rowLeft: rowRect.left,
        rowRight: rowRect.right,
        checkboxWidth: checkboxRect?.width || 0,
        checkboxRight: checkboxRect?.right || 0,
        labelLeft: labelRect?.left || 0,
        labelRight: labelRect?.right || 0,
        labelWidth: labelRect?.width || 0,
      }
    })

    expect(geometry.rowLeft).toBeGreaterThanOrEqual(0)
    expect(geometry.rowRight).toBeLessThanOrEqual(geometry.viewportWidth)
    expect(geometry.checkboxWidth).toBeGreaterThanOrEqual(15)
    expect(geometry.labelWidth).toBeGreaterThan(120)
    expect(geometry.labelLeft).toBeGreaterThanOrEqual(geometry.checkboxRight)
    expect(geometry.labelRight).toBeLessThanOrEqual(geometry.viewportWidth)
    await expectNoHorizontalDocumentOverflow(page)
    await expectMobileControlTargets(page)
  })
}

test('mobile auth header stays readable and anonymous', async ({ page }) => {
  await page.setViewportSize(mobileViewport)
  await openAnonymousRoute(page, '#auth')

  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  const homeLink = page.getByRole('button', { name: /back to home/i }).or(page.getByRole('link', { name: /back to home/i }))
  await expect(homeLink).toBeVisible()
  await expectSingleMain(page)
  await expectNoHorizontalDocumentOverflow(page)
  await expectMobileControlTargets(page)
})

test('a direct password-reset route fails closed without a recovery session', async ({ page }) => {
  await page.setViewportSize(mobileViewport)
  await openAnonymousRoute(page, '#reset-password')

  await expect(page.getByText(/reset link is invalid or expired/i)).toBeVisible()
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await expectSingleMain(page)
  await expectMobileControlTargets(page)
})
