/**
 * Cart, Order & Analytics Integration Tests — GET endpoints only
 */

const request = require('supertest');
const { expect } = require('chai');
const bcrypt = require('bcryptjs');
const User = require('../../backend/models/User');
const Cart = require('../../backend/models/Cart');
const Order = require('../../backend/models/Order');
const app = require('../../backend/server');

async function seedAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'System Admin',
    email: 'admin@system.com',
    password: hash,
    role: 'super_admin',
    status: 'approved',
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@system.com', password: 'admin123' });
  return { token: res.body.token };
}

async function seedOwnerWithSession(suffix = 'getapi') {
  const { token: adminToken } = await seedAdmin();

  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Owner',
      email: `${suffix}@example.com`,
      password: 'password123',
      pendingRestaurantName: 'Test Bistro',
      pendingRestaurantAddress: '1 Test St',
      pendingRestaurantPhone: '0400000000',
      pendingRestaurantEmail: `bistro_${suffix}@example.com`,
    });

  const ownerId = regRes.body.user._id;
  await request(app)
    .patch(`/api/admin/owners/${ownerId}/approve`)
    .set('Authorization', `Bearer ${adminToken}`);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${suffix}@example.com`, password: 'password123' });

  const restaurantId = loginRes.body.user.restaurantId;
  const ownerToken = loginRes.body.token;

  await request(app)
    .post(`/api/admin/restaurants/${restaurantId}/tables`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ totalTables: 3 });

  const sessionRes = await request(app)
    .post('/api/sessions/start')
    .send({ restaurantId, tableNumber: 1 });

  return {
    ownerToken,
    restaurantId,
    sessionId: sessionRes.body.session._id,
    tableId: sessionRes.body.session.tableId,
    tableNumber: sessionRes.body.session.tableNumber,
  };
}

describe('GET /api/cart/:sessionId — integration', () => {
  it('returns cart with items when cart exists in db', async () => {
    const { sessionId, restaurantId, tableId, tableNumber } = await seedOwnerWithSession('getcart');

    await Cart.create({
      sessionId,
      restaurantId,
      tableId,
      tableNumber,
      items: [{ menuItemId: '507f1f77bcf86cd799439012', name: 'Burger', price: 15, quantity: 2 }],
      subtotal: 30,
    });

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.status).to.equal(200);
    expect(res.body.cart.itemCount).to.equal(2);
    expect(res.body.cart.subtotal).to.equal(30);
  });

  it('returns empty cart when none exists', async () => {
    const { sessionId } = await seedOwnerWithSession('emptycart');

    const res = await request(app).get(`/api/cart/${sessionId}`);
    expect(res.status).to.equal(200);
    expect(res.body.cart.items).to.have.lengthOf(0);
    expect(res.body.cart.itemCount).to.equal(0);
  });
});

describe('GET /api/orders/:orderId — integration', () => {
  it('returns order by id', async () => {
    const { sessionId, restaurantId, tableId, tableNumber } = await seedOwnerWithSession('getorder');

    const order = await Order.create({
      restaurantId,
      tableId,
      tableNumber,
      sessionId,
      sessionNumber: 1,
      items: [{ menuItemId: '507f1f77bcf86cd799439012', name: 'Burger', price: 15, quantity: 1 }],
      subtotal: 15,
      tax: 1.5,
      totalAmount: 16.5,
    });

    const res = await request(app).get(`/api/orders/${order._id}`);
    expect(res.status).to.equal(200);
    expect(res.body.order.totalAmount).to.equal(16.5);
  });
});

describe('GET /api/analytics/my/summary — integration', () => {
  it('returns summary for owner restaurant', async () => {
    const { ownerToken, restaurantId, sessionId, tableId, tableNumber } =
      await seedOwnerWithSession('analytics');

    await Order.create({
      restaurantId,
      tableId,
      tableNumber,
      sessionId,
      sessionNumber: 1,
      items: [{ name: 'Burger', price: 15, quantity: 2 }],
      subtotal: 30,
      tax: 3,
      totalAmount: 33,
    });

    const res = await request(app)
      .get('/api/analytics/my/summary')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.summary.totalOrders).to.equal(1);
    expect(res.body.summary.totalRevenue).to.equal(33);
    expect(res.body.summary.topItem).to.equal('Burger');
    expect(res.body.summary.busiestTable).to.equal(1);
  });
});
