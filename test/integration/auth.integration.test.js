/**
 * Auth Integration Tests
 *
 * Tests the full auth stack (controller → service → real MongoDB) using
 * an in-memory MongoDB instance. No mocking — every assertion reflects
 * actual database writes and JWT generation.
 *
 * Endpoints covered:
 *   POST /api/auth/register
 *   POST /api/auth/login
 */

const request  = require('supertest');
const { expect } = require('chai');
const bcrypt   = require('bcryptjs');
const User     = require('../../backend/models/User');
const app      = require('../../backend/server');

// Lifecycle is managed by test/integration/hooks.js (Mocha root hooks).

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validOwnerPayload(suffix = 'a') {
  return {
    name:                     'Test Owner',
    email:                    `owner_${suffix}@example.com`,
    password:                 'password123',
    pendingRestaurantName:    'Test Bistro',
    pendingRestaurantAddress: '42 Collins St, Melbourne VIC 3000',
    pendingRestaurantPhone:   '0312345678',
    pendingRestaurantEmail:   `bistro_${suffix}@example.com`,
  };
}

async function seedAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  return User.create({
    name:     'System Admin',
    email:    'admin@system.com',
    password: hash,
    role:     'super_admin',
    status:   'approved',
  });
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register — integration', () => {
  it('creates a new pending owner and returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validOwnerPayload('reg1'));

    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.user).to.have.property('email', 'owner_reg1@example.com');
    expect(res.body.user).to.have.property('status', 'pending');
    expect(res.body.user).not.to.have.property('password');

    const inDB = await User.findOne({ email: 'owner_reg1@example.com' });
    expect(inDB).to.not.be.null;
    expect(inDB.role).to.equal('owner');
  });

  it('returns 409 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send(validOwnerPayload('dup'));

    const res = await request(app)
      .post('/api/auth/register')
      .send(validOwnerPayload('dup'));

    expect(res.status).to.equal(409);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.equal('Email already registered');
  });

  it('returns 400 when name is missing', async () => {
    const { name, ...body } = validOwnerPayload('noname');
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('returns 400 when email is missing', async () => {
    const { email, ...body } = validOwnerPayload('noemail');
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).to.equal(400);
  });

  it('returns 400 when password is missing', async () => {
    const { password, ...body } = validOwnerPayload('nopass');
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).to.equal(400);
  });

  it('returns 400 when restaurant name is missing', async () => {
    const { pendingRestaurantName, ...body } = validOwnerPayload('norestname');
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).to.equal(400);
  });

  it('returns 400 when restaurant address is missing', async () => {
    const { pendingRestaurantAddress, ...body } = validOwnerPayload('noaddr');
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).to.equal(400);
  });

  it('returns 400 when body is completely empty', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login — integration', () => {
  it('returns 200 and a JWT token for a valid admin login', async () => {
    await seedAdmin();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@system.com', password: 'admin123' });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body).to.have.property('token');
    expect(res.body.user.role).to.equal('super_admin');
  });

  it('returns 403 for a pending owner trying to login', async () => {
    await request(app).post('/api/auth/register').send(validOwnerPayload('pending'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner_pending@example.com', password: 'password123' });

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal('Account is not approved');
  });

  it('returns 401 for wrong password', async () => {
    await seedAdmin();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@system.com', password: 'wrongpassword' });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Invalid email or password');
  });

  it('returns 401 for a non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).to.equal(401);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Email and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@system.com' });

    expect(res.status).to.equal(400);
  });

  it('returns 200 after a pending owner is manually approved', async () => {
    await request(app).post('/api/auth/register').send(validOwnerPayload('toapprove'));
    await User.updateOne({ email: 'owner_toapprove@example.com' }, { status: 'approved' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner_toapprove@example.com', password: 'password123' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
  });
});
