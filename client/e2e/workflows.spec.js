import { expect, test } from '@playwright/test'

const shipmentId = 'shipment-test-1'
const initialShipment = {
  id: shipmentId,
  shipperId: 'shipper-test-1',
  goodsDescription: 'Coffee sacks for regional delivery',
  goodsType: 'Agricultural',
  weightKg: 1200,
  pickupLocation: 'Addis Ababa',
  deliveryLocation: 'Dire Dawa',
  pickupDate: '2027-01-15T00:00:00.000Z',
  createdAt: '2026-10-10T00:00:00.000Z',
  specialRequirements: '',
  status: 'PUBLISHED',
  images: [],
}

function envelope(data) {
  return { data, meta: { pagination: { page: 1, limit: 20, total: Array.isArray(data) ? data.length : 0, totalPages: 1 } } }
}

async function installApiMocks(page, initialRole = null) {
  const state = {
    role: null,
    loginRole: initialRole,
    shipment: { ...initialShipment, status: 'DRAFT' },
    bids: [],
    reviews: [],
    targetSuspended: false,
    targetUser: { id: 'shipper-test-1', name: 'Test Shipper', email: 'shipper@example.com', phone: '+251911111111', role: 'SHIPPER', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z' },
  }

  await page.route('http://localhost:5000/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    const user = state.role ? {
      id: `${state.role.toLowerCase()}-test-1`,
      name: state.role === 'SHIPPER' ? 'Test Shipper' : 'Test Transporter',
      email: 'test@example.com',
      role: state.role,
      profileComplete: true,
    } : null
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path === '/auth/me') return user ? json(200, { user }) : json(401, { error: { message: 'Sign in required' } })
    if (path === '/auth/register' && method === 'POST') {
      state.role = JSON.parse(request.postData() || '{}').role || 'SHIPPER'
      return json(201, { user: { ...user, role: state.role } })
    }
    if (path === '/auth/login' && method === 'POST') {
      const credentials = JSON.parse(request.postData() || '{}')
      if (credentials.email === 'shipper@example.com' && state.targetSuspended) return json(403, { error: { message: 'This account has been suspended' } })
      state.role = credentials.email === 'admin@example.com' ? 'ADMIN' : state.loginRole || 'SHIPPER'
      return json(200, { user: { ...user, role: state.role } })
    }
    if (path === '/auth/logout') {
      state.role = null
      return json(200, { success: true })
    }
    if (path === '/shipments' && method === 'POST') {
      state.shipment = { ...state.shipment, ...JSON.parse(request.postData() || '{}'), status: 'DRAFT' }
      return json(201, { data: state.shipment })
    }
    if (path === `/shipments/${shipmentId}/publish` && method === 'PATCH') {
      state.shipment.status = 'PUBLISHED'
      return json(200, { data: state.shipment })
    }
    if (path === `/shipments/${shipmentId}` && method === 'GET') return json(200, { data: state.shipment })
    if (path === '/shipments/dashboard/summary') return json(200, { data: { counts: {}, recentShipments: [] } })
    if (path === `/shipments/${shipmentId}/bids` && method === 'GET') return json(200, { data: state.bids })
    if (path === `/shipments/${shipmentId}/bids/bid-test-1/accept` && method === 'PATCH') {
      state.bids = state.bids.map((bid) => ({ ...bid, status: 'ACCEPTED' }))
      state.shipment.status = 'IN_PROGRESS'
      return json(200, { data: state.bids[0] })
    }
    if (path === `/shipments/${shipmentId}/complete` && method === 'PATCH') {
      state.shipment.status = 'COMPLETED'
      return json(200, { data: state.shipment })
    }
    if (path === `/shipments/${shipmentId}/reviews` && method === 'GET') return json(200, envelope(state.reviews))
    if (path === `/shipments/${shipmentId}/reviews` && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}')
      state.reviews.push({ id: 'review-test-1', reviewerId: 'shipper-test-1', revieweeId: 'transporter-test-1', reviewer: { name: 'Test Shipper' }, ...body })
      return json(201, { data: state.reviews.at(-1) })
    }
    if (path === '/users/transporter-test-1') return json(200, { data: { id: 'transporter-test-1', name: 'Test Transporter', averageRating: null, reviewCount: 0 } })
    if (path === '/admin/metrics') return json(200, { data: { totalUsers: 3, usersByRole: { SHIPPER: 1, TRANSPORTER: 1, ADMIN: 1 }, newRegistrationsLast30Days: 1, shipments: { active: 1, completed: 0, cancelled: 0 } } })
    if (path === '/admin/users' && method === 'GET') {
      const account = { ...state.targetUser, status: state.targetSuspended ? 'SUSPENDED' : 'ACTIVE', suspensionReason: state.targetSuspended ? 'Repeated marketplace policy violations' : null }
      const matches = !url.searchParams.get('status') || url.searchParams.get('status') === account.status
      return json(200, { data: matches ? [account] : [], meta: { pagination: { page: 1, limit: 20, total: matches ? 1 : 0, totalPages: 1 } } })
    }
    if (path === `/admin/users/${state.targetUser.id}/suspend` && method === 'PATCH') {
      state.targetSuspended = true
      state.targetUser.suspensionReason = JSON.parse(request.postData() || '{}').reason
      return json(200, { data: { ...state.targetUser, status: 'SUSPENDED' } })
    }
    if (path === `/admin/users/${state.targetUser.id}/activate` && method === 'PATCH') {
      state.targetSuspended = false
      return json(200, { data: { ...state.targetUser, status: 'ACTIVE' } })
    }
    if (path === '/bids/my') return json(200, envelope(state.bids))
    if (path === `/shipments/${shipmentId}/bids` && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}')
      state.bids = [{ id: 'bid-test-1', shipmentId, transporterId: 'transporter-test-1', status: 'PENDING', createdAt: '2026-10-10T00:00:00.000Z', ...body }]
      return json(201, { data: state.bids[0] })
    }
    if (path === '/notifications') return json(200, envelope([]))
    if (path === '/shipments') return json(200, envelope([]))
    return json(200, { data: {} })
  })

  await page.route('https://*.tile.openstreetmap.org/**', (route) => route.abort())
  return state
}

test('register, create a shipment, and publish it', async ({ page }) => {
  const state = await installApiMocks(page)
  await page.goto('/register')
  await page.getByLabel('First Name').fill('Abebe')
  await page.getByLabel('Last Name').fill('Kebede')
  await page.getByLabel('Shipper').check()
  await page.getByLabel('Email Address').fill('test@example.com')
  await page.getByLabel('Phone Number').fill('+251912345678')
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1')
  await page.getByLabel('Confirm Password').fill('StrongPass1')
  await page.getByRole('button', { name: 'Create Account' }).click()

  await expect(page.getByRole('heading', { name: 'Good to see you' })).toBeVisible()
  await page.getByRole('link', { name: /Post a shipment/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Post a shipment' })).toBeVisible()
  await page.locator('textarea').first().fill('Coffee sacks for regional delivery')
  await page.getByPlaceholder('e.g. agricultural, industrial, household').fill('Agricultural')
  await page.locator('input[type="number"]').fill('1200')
  await page.getByPlaceholder('City, area, or address').nth(0).fill('Addis Ababa')
  await page.getByPlaceholder('City, area, or address').nth(1).fill('Dire Dawa')
  await page.locator('input[type="date"]').fill('2027-01-15')
  await page.getByRole('button', { name: 'Publish shipment' }).click()

  await expect(page.getByRole('heading', { name: 'Coffee sacks for regional delivery' })).toBeVisible()
  await expect(page.getByText('PUBLISHED')).toBeVisible()
  expect(state.shipment.status).toBe('PUBLISHED')
})

test('log in, browse a shipment, and submit a bid', async ({ page }) => {
  const state = await installApiMocks(page, 'TRANSPORTER')
  state.shipment.status = 'PUBLISHED'
  await page.goto('/login')
  await page.getByLabel('Email Address').fill('test@example.com')
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('heading', { name: 'Transporter dashboard' })).toBeVisible()

  await page.goto(`/transporter/shipments/${shipmentId}`)
  await expect(page.getByRole('heading', { name: initialShipment.goodsDescription })).toBeVisible()
  await page.getByLabel('Your price (ETB)').fill('25000')
  const future = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const localDateTime = new Date(future.getTime() - future.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  await page.getByLabel('Available pickup time').fill(localDateTime)
  await page.getByLabel('Message to shipper').fill('I can transport this cargo safely.')
  await page.getByRole('button', { name: 'Submit bid' }).click()

  await expect(page.getByRole('heading', { name: 'Your offer' })).toBeVisible()
  await expect(page.getByText('PENDING')).toBeVisible()
  expect(state.bids).toHaveLength(1)
})

test('accept a bid, complete its shipment, and submit a review', async ({ page }) => {
  const state = await installApiMocks(page, 'SHIPPER')
  state.shipment.status = 'PUBLISHED'
  state.bids = [{ id: 'bid-test-1', shipmentId, transporterId: 'transporter-test-1', status: 'PENDING', price: 25000, pickupDate: '2027-01-15T00:00:00.000Z', createdAt: '2026-10-10T00:00:00.000Z', message: 'I can transport this cargo safely.' }]

  await page.goto('/login')
  await page.getByLabel('Email Address').fill('shipper@example.com')
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.goto(`/shipper/shipments/${shipmentId}`)
  await page.getByRole('button', { name: 'Accept bid' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Accept bid' }).click()
  await expect(page.getByText('IN PROGRESS')).toBeVisible()
  expect(state.bids[0].status).toBe('ACCEPTED')

  await page.getByRole('button', { name: 'Mark delivered' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Mark delivered' }).click()
  await expect(page.getByText('COMPLETED')).toBeVisible()
  await page.getByRole('radio', { name: '5 stars' }).click()
  await page.getByLabel('Comment').fill('Delivered carefully and on schedule.')
  await page.getByRole('button', { name: 'Submit review' }).click()
  await expect(page.getByText('Review submitted')).toBeVisible()
  expect(state.reviews).toHaveLength(1)
})

test('admin suspends a user and the suspended account cannot log in', async ({ page }) => {
  const state = await installApiMocks(page, 'ADMIN')
  await page.goto('/login')
  await page.getByLabel('Email Address').fill('admin@example.com')
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
  await page.getByRole('link', { name: /User management/ }).click()
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()
  await page.getByRole('button', { name: 'Suspend', exact: true }).click()
  await page.getByLabel('Reason for suspension').fill('Repeated marketplace policy violations')
  await page.getByRole('dialog').getByRole('button', { name: 'Suspend account' }).click()
  await expect(page.getByText('SUSPENDED')).toBeVisible()
  expect(state.targetSuspended).toBe(true)

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Email Address').fill('shipper@example.com')
  await page.getByLabel('Password', { exact: true }).fill('StrongPass1')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('alert')).toContainText('This account has been suspended')
})
