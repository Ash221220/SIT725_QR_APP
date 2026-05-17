/**
 * Auth Unit Tests
 *
 * All service calls are stubbed with sinon. No database or running server required.
 *
 * Endpoints covered:
 *   POST /api/auth/register
 *   POST /api/auth/login
 */

// Set env vars before any module is required
process.env.JWT_SECRET     = 'test_secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT           = '5002';

const request    = require('supertest');
const { expect } = require('chai');
const sinon      = require('sinon');

const app         = require('../../backend/server');
const authService = require('../../backend/services/authService');
const AppError    = require('../../backend/utils/AppError');

// ─── Shared fake data ─────────────────────────────────────────────────────────

function validRegisterPayload(overrides = {}) {
  return {
    name:                     'John Doe',
    email:                    'john@test.com',
    password:                 'password123',
    pendingRestaurantName:    'Test Bistro',
    pendingRestaurantAddress: '42 Collins St, Melbourne VIC 3000',
    pendingRestaurantPhone:   '0312345678',
    pendingRestaurantEmail:   'bistro@test.com',
    ...overrides,
  };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  afterEach(() => sinon.restore());

  it('should return 201 and the new user on successful registration', async () => {
    const fakeUser = {
      _id: 'abc123', name: 'John Doe',
      email: 'john@test.com', role: 'owner', status: 'pending',
    };
    sinon.stub(authService, 'registerOwner').resolves(fakeUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send(validRegisterPayload());

    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.user).to.have.property('email', 'john@test.com');
    expect(res.body.user).to.have.property('status', 'pending');
    expect(res.body.user).not.to.have.property('password');
  });

  it('should return 400 when name is missing', async () => {
    const { name, ...body } = validRegisterPayload();
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when email is missing', async () => {
    const { email, ...body } = validRegisterPayload();
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when password is missing', async () => {
    const { password, ...body } = validRegisterPayload();
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when restaurant name is missing', async () => {
    const { pendingRestaurantName, ...body } = validRegisterPayload();
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when restaurant address is missing', async () => {
    const { pendingRestaurantAddress, ...body } = validRegisterPayload();
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 409 when the email is already registered', async () => {
    sinon.stub(authService, 'registerOwner').rejects(new AppError('Email already registered', 409, 'EMAIL_ALREADY_REGISTERED'));

    const res = await request(app)
      .post('/api/auth/register')
      .send(validRegisterPayload());

    expect(res.status).to.equal(409);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.equal('Email already registered');
  });

  it('should return 400 when the request body is completely empty', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  afterEach(() => sinon.restore());

  it('should return 200 and a token on successful login', async () => {
    const fakeResult = {
      token: 'fake.jwt.token',
      user: { _id: 'abc123', name: 'John', email: 'john@test.com', role: 'owner', status: 'approved' },
    };
    sinon.stub(authService, 'loginUser').resolves(fakeResult);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@test.com', password: 'password123' });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('role', 'owner');
  });

  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.equal('Email and password are required');
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@test.com' });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when the request body is completely empty', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 when credentials are invalid', async () => {
    sinon.stub(authService, 'loginUser').rejects(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrongpassword' });

    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.equal('Invalid email or password');
  });

  it('should return 401 for a non-existent email', async () => {
    sinon.stub(authService, 'loginUser').rejects(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 when the account is not yet approved', async () => {
    sinon.stub(authService, 'loginUser').rejects(new AppError('Account is not approved', 403, 'OWNER_NOT_APPROVED'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pending@test.com', password: 'password123' });

    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.equal('Account is not approved');
  });
});
