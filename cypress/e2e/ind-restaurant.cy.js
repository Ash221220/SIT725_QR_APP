/**
 * Individual Restaurant Tables & QR Codes Admin Page E2E Tests
 * File: cypress/e2e/ind-restaurant.cy.js
 *
 * Covers:
 *   1. frontend/pages/ind_restaurant.html
 *   2. frontend/js/admin.js
 *
 * Test groups:
 *   9a. Authentication guard
 *   9b. Page structure
 *   9c. Tables loaded from API
 *   9d. QR code display
 *   9e. Missing restaurantId in URL
 *   9f. API error handling
 *   9g. Back button navigation
 *   9h. Logout
 *
 * Notes:
 *   This page reads restaurantId and name from URL query params (?id=...&name=...).
 *   All API calls are stubbed — tests do not require a running backend.
 *   Stubs must be registered BEFORE cy.visit() as admin.js fires API
 *   calls immediately on DOMContentLoaded.
 *
 * Prerequisites:
 *   1. cd backend && npm start
 *
 * Run: npm run test:e2e
 */

const RESTAURANT_ID   = 'rest1';
const RESTAURANT_NAME = 'Pizza Palace';
const PAGE_URL        = `/pages/ind_restaurant.html?id=${RESTAURANT_ID}&name=${encodeURIComponent(RESTAURANT_NAME)}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stubTables(tables = []) {
  cy.intercept('GET', `/api/admin/restaurants/${RESTAURANT_ID}/tables`, {
    statusCode: 200,
    body: { tables },
  }).as('getTables');
}

function visitAsAdmin(url = PAGE_URL) {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'fake.admin.jwt');
      win.localStorage.setItem('user', JSON.stringify({
        _id: 'admin1', name: 'Super Admin', email: 'admin@system.com', role: 'super_admin',
      }));
    },
  });
}

const FAKE_TABLES = [
  { _id: 't1', tableNumber: 1, isActive: true,  qrCodeUrl: 'https://example.com/qr/1' },
  { _id: 't2', tableNumber: 2, isActive: false, qrCodeUrl: 'https://example.com/qr/2' },
  { _id: 't3', tableNumber: 3, isActive: true,  qrCodeUrl: '' },
];

// ─── 9a. Authentication guard ─────────────────────────────────────────────────

describe('Individual restaurant page — authentication guard', () => {
  it('redirects to login.html when no token is stored', () => {
    // TODO: cy.visit(PAGE_URL), assert URL includes login.html
  });

  it('redirects to login.html when user is an owner', () => {
    // TODO: visit with owner role, assert redirect
  });

  it('loads the page when role is super_admin', () => {
    stubTables();
    visitAsAdmin();
    // TODO: cy.wait('@getTables'), assert URL includes ind_restaurant.html
  });
});

// ─── 9b. Page structure ───────────────────────────────────────────────────────

describe('Individual restaurant page — page structure', () => {
  beforeEach(() => {
    stubTables(FAKE_TABLES);
    visitAsAdmin();
    cy.wait('@getTables');
  });

  it('shows the restaurant name in the page heading', () => {
    // TODO: cy.get('#restaurantDetailsTitle')
    //         .should('contain.text', 'Pizza Palace');
  });

  it('shows a Back to Restaurants link', () => {
    // TODO: cy.contains('a', 'Back to Restaurants')
    //         .should('have.attr', 'href').and('include', 'restaurants.html');
  });

  it('shows the Admin navbar brand', () => {
    // TODO: cy.get('nav .brand-logo').should('contain.text', 'Admin');
  });
});

// ─── 9c. Tables loaded from API ───────────────────────────────────────────────

describe('Individual restaurant page — tables rendering', () => {
  it('renders a card for each table', () => {
    stubTables(FAKE_TABLES);
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: cy.get('#restaurantTablesContainer .card').should('have.length', 3);
  });

  it('shows the table number on each card', () => {
    stubTables(FAKE_TABLES);
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: cy.get('#restaurantTablesContainer')
    //         .should('contain.text', 'Table 1')
    //         .and('contain.text', 'Table 2');
  });

  it('shows active/inactive status on each card', () => {
    stubTables(FAKE_TABLES);
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: first card should contain 'Active', second 'Inactive'
  });

  it('shows "No tables found" when the restaurant has no tables', () => {
    stubTables([]);
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: cy.get('#restaurantTablesContainer')
    //         .should('contain.text', 'No tables found');
  });
});

// ─── 9d. QR code display ──────────────────────────────────────────────────────

describe('Individual restaurant page — QR codes', () => {
  it('renders a QR code image when qrCodeUrl is present', () => {
    stubTables(FAKE_TABLES);
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: cy.get('#restaurantTablesContainer img.qr-image')
    //         .first().should('have.attr', 'src', 'https://example.com/qr/1');
  });

  it('shows "QR code not available" when qrCodeUrl is empty', () => {
    stubTables(FAKE_TABLES);
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: third card (table 3) has no qrCodeUrl — assert it shows "QR code not available"
  });
});

// ─── 9e. Missing restaurantId in URL ─────────────────────────────────────────

describe('Individual restaurant page — missing URL params', () => {
  it('shows an error when no restaurantId is in the URL', () => {
    // admin.js checks for restaurantId from query params and shows an error if missing
    cy.visit('/pages/ind_restaurant.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake.admin.jwt');
        win.localStorage.setItem('user', JSON.stringify({
          _id: 'admin1', name: 'Super Admin', email: 'admin@system.com', role: 'super_admin',
        }));
      },
    });
    // TODO: cy.get('#restaurantTablesContainer')
    //         .should('contain.text', 'Restaurant ID is missing');
  });
});

// ─── 9f. API error handling ───────────────────────────────────────────────────

describe('Individual restaurant page — API errors', () => {
  it('shows an error message when GET /tables returns 401', () => {
    cy.intercept('GET', `/api/admin/restaurants/${RESTAURANT_ID}/tables`, {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('getTables');
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: cy.get('#restaurantTablesContainer').should('contain.text', 'Unauthorized');
  });

  it('shows an error message when the restaurant is not found (404)', () => {
    cy.intercept('GET', `/api/admin/restaurants/${RESTAURANT_ID}/tables`, {
      statusCode: 404,
      body: { message: 'Restaurant not found' },
    }).as('getTables');
    visitAsAdmin();
    cy.wait('@getTables');
    // TODO: cy.get('#restaurantTablesContainer').should('contain.text', 'Restaurant not found');
  });
});

// ─── 9g. Back button navigation ───────────────────────────────────────────────

describe('Individual restaurant page — navigation', () => {
  it('navigates back to restaurants.html when Back link is clicked', () => {
    stubTables();
    visitAsAdmin();
    // TODO: cy.contains('a', 'Back to Restaurants').click();
    //       cy.url().should('include', 'restaurants.html');
  });
});

// ─── 9h. Logout ───────────────────────────────────────────────────────────────

describe('Individual restaurant page — logout', () => {
  it('clears localStorage and redirects to login.html on logout', () => {
    stubTables();
    visitAsAdmin();
    // TODO: cy.get('#logoutDropdownBtn').click({ force: true });
    //       cy.url().should('include', 'login.html');
    //       assert localStorage cleared
  });
});
