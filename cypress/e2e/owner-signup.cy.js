/**
 * Owner Signup E2E Tests
 * File: cypress/e2e/owner-signup.cy.js
 *
 * Covers:
 *   1. frontend/pages/owner_signup.html
 *   2. frontend/js/auth.js
 *
 * Test groups:
 *   5a. Page structure
 *   5b. Form validation — required fields
 *   5c. Successful registration
 *   5d. Error handling (duplicate email, server errors)
 *   5e. Navigation link
 *
 * Notes:
 *   API calls are stubbed for error/success cases.
 *   No backend session required — page is publicly accessible.
 *
 * Prerequisites:
 *   1. cd backend && npm start
 *
 * Run: npm run test:e2e
 */

const SIGNUP_URL = '/pages/owner_signup.html';

// ─── Helper ───────────────────────────────────────────────────────────────────

function fillSignupForm(overrides = {}) {
  const data = {
    name: 'Test Owner',
    email: 'newowner@test.com',
    password: 'password123',
    restaurantName: 'Test Bistro',
    restaurantAddress: '42 Collins St',
    restaurantPhone: '0312345678',
    restaurantEmail: 'bistro@test.com',
    ...overrides,
  };

  if (data.name)            cy.get('#name').type(data.name);
  if (data.email)           cy.get('#email').type(data.email);
  if (data.password)        cy.get('#password').type(data.password);
  if (data.restaurantName)  cy.get('#pendingRestaurantName').type(data.restaurantName);
  if (data.restaurantAddress) cy.get('#pendingRestaurantAddress').type(data.restaurantAddress);
  if (data.restaurantPhone) cy.get('#pendingRestaurantPhone').type(data.restaurantPhone);
  if (data.restaurantEmail) cy.get('#pendingRestaurantEmail').type(data.restaurantEmail);
}

// ─── 5a. Page structure ───────────────────────────────────────────────────────

describe('Owner signup — page structure', () => {
  beforeEach(() => cy.visit(SIGNUP_URL));

  it('has the correct page title', () => {
    // TODO: cy.title().should('include', 'Owner Signup');
  });

  it('shows the "Owner Signup" heading', () => {
    // TODO: cy.contains('h4', 'Owner Signup').should('be.visible');
  });

  it('shows all required input fields', () => {
    // TODO: check #name, #email, #password, #pendingRestaurantName,
    //       #pendingRestaurantAddress, #pendingRestaurantPhone, #pendingRestaurantEmail exist
  });

  it('shows the Submit Request button', () => {
    // TODO: cy.get('button[type="submit"]').should('contain.text', 'Submit Request');
  });

  it('shows a link back to login page', () => {
    // TODO: cy.contains('a', 'Login here').should('have.attr', 'href').and('include', 'login.html');
  });
});

// ─── 5b. Form validation — required fields ────────────────────────────────────

describe('Owner signup — form validation', () => {
  beforeEach(() => cy.visit(SIGNUP_URL));

  it('does not submit when all fields are empty', () => {
    // TODO: click submit, assert API not called (no @registerRequest alias)
  });

  it('does not submit when owner name is missing', () => {
    // TODO: fill all except name, submit, assert API not called
  });

  it('does not submit when email is invalid format', () => {
    // TODO: fill with email 'notanemail', submit, assert API not called
  });

  it('does not submit when password is missing', () => {
    // TODO: fill all except password, submit, assert API not called
  });

  it('does not submit when restaurant name is missing', () => {
    // TODO: fill all except restaurantName, submit, assert API not called
  });

  it('does not submit when restaurant address is missing', () => {
    // TODO: fill all except restaurantAddress, submit, assert API not called
  });
});

// ─── 5c. Successful registration ──────────────────────────────────────────────

describe('Owner signup — successful registration', () => {
  it('calls POST /api/auth/register with correct payload', () => {
    cy.visit(SIGNUP_URL);
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: { success: true, message: 'Registration request submitted' },
    }).as('registerRequest');

    // TODO: fillSignupForm(), click submit, cy.wait('@registerRequest'),
    //       assert body contains name, email, pendingRestaurantName etc.
  });

  it('shows a success message after submission', () => {
    // TODO: intercept 201, submit form, assert #signupMessage contains success text
  });
});

// ─── 5d. Error handling ───────────────────────────────────────────────────────

describe('Owner signup — error handling', () => {
  it('shows an error message for duplicate email (409)', () => {
    cy.visit(SIGNUP_URL);
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 409,
      body: { success: false, message: 'Email already registered' },
    }).as('registerRequest');

    // TODO: fillSignupForm(), submit, cy.wait('@registerRequest'),
    //       assert #signupMessage contains 'Email already registered'
  });

  it('shows an error message for server errors (500)', () => {
    // TODO: intercept 500, submit, assert error message shown
  });
});

// ─── 5e. Navigation ───────────────────────────────────────────────────────────

describe('Owner signup — navigation', () => {
  it('navigates to login page when "Login here" link is clicked', () => {
    cy.visit(SIGNUP_URL);
    // TODO: cy.contains('a', 'Login here').click(), assert URL includes login.html
  });
});
