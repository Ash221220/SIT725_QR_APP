/**
 * General Page Load Tests
 * File: cypress/e2e/pages.cy.js
 *
 * Covers:
 *   1. All frontend pages served by the Express backend
 *   2. Static JS assets
 *
 * Test groups:
 *   - Root route (GET /)
 *   - Login page
 *   - Index / landing page
 *   - Menu page
 *   - Admin dashboard
 *   - Owner dashboard
 *   - Static assets
 *
 * Notes:
 *   Pages that are placeholder stubs will surface failing tests intentionally —
 *   these flag unimplemented pages for the development team.
 *
 * Prerequisites:
 *   1. cd backend && npm start
 *
 * Run: npm run test:e2e
 */

// ─── Root route ───────────────────────────────────────────────────────────────

describe('GET / — root route serves login page', () => {
  it('returns HTTP 200', () => {
    cy.request('/').its('status').should('equal', 200);
  });

  it('serves the login HTML page at the root', () => {
    cy.visit('/');
    cy.get('#loginForm').should('exist');
    cy.title().should('include', 'Login');
  });
});

// ─── login.html ───────────────────────────────────────────────────────────────

describe('GET /pages/login.html', () => {
  it('returns HTTP 200', () => {
    cy.request('/pages/login.html').its('status').should('equal', 200);
  });

  it('page is accessible and renders the login form', () => {
    cy.visit('/pages/login.html');
    cy.get('#loginForm').should('exist');
  });
});

// ─── index.html ───────────────────────────────────────────────────────────────

describe('GET /pages/index.html', () => {
  it('returns HTTP 200', () => {
    cy.request('/pages/index.html').its('status').should('equal', 200);
  });
});

// ─── menu.html ────────────────────────────────────────────────────────────────

describe('GET /pages/menu.html', () => {
  it('returns HTTP 200', () => {
    cy.request('/pages/menu.html').its('status').should('equal', 200);
  });
});

// ─── admin-dashboard.html ─────────────────────────────────────────────────────

describe('GET /pages/admin-dashboard.html', () => {
  it('page loads successfully (200)', () => {
    cy.request('/pages/admin-dashboard.html').its('status').should('equal', 200);
  });

  it('page contains expected HTML structure', () => {
    cy.visit('/pages/admin-dashboard.html');
    cy.get('body').should('exist');
  });
});

// ─── owner-dashboard.html ─────────────────────────────────────────────────────

describe('GET /pages/owner-dashboard.html', () => {
  it('returns HTTP 200', () => {
    cy.request('/pages/owner-dashboard.html').its('status').should('equal', 200);
  });

  it('page is accessible', () => {
    // Owner dashboard redirects unauthenticated users back to login — that is
    // expected behaviour. Just confirm the page itself is served.
    cy.visit('/pages/owner-dashboard.html', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });
});

// ─── Static assets ────────────────────────────────────────────────────────────

describe('Static assets are served correctly', () => {
  it('config.js is reachable', () => {
    cy.request('/js/config.js').its('status').should('equal', 200);
  });

  it('auth.js is reachable', () => {
    cy.request('/js/auth.js').its('status').should('equal', 200);
  });

  it('owner.js is reachable', () => {
    cy.request('/js/owner.js').its('status').should('equal', 200);
  });

  it('admin.js is reachable', () => {
    cy.request('/js/admin.js').its('status').should('equal', 200);
  });
});
