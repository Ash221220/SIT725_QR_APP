/**
 * Restaurants Admin Page E2E Tests
 * File: cypress/e2e/restaurants.cy.js
 *
 * Covers:
 *   1. frontend/pages/restaurants.html
 *   2. frontend/js/admin.js
 *
 * Test groups:
 *   8a. Authentication guard
 *   8b. Page structure
 *   8c. Restaurants table — loaded from API
 *   8d. Restaurant count summary card
 *   8e. Row click navigates to individual restaurant page
 *   8f. Search / filter
 *   8g. API error handling
 *   8h. Logout
 *
 * Notes:
 *   All API calls are stubbed — tests do not require a running backend.
 *   Stubs must be registered BEFORE cy.visit() as admin.js fires API
 *   calls immediately on DOMContentLoaded.
 *
 * Prerequisites:
 *   1. cd backend && npm start
 *
 * Run: npm run test:e2e
 */

const PAGE_URL = '/pages/restaurants.html';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stubRestaurants(restaurants = []) {
  cy.intercept('GET', '/api/admin/restaurants', {
    statusCode: 200,
    body: { restaurants },
  }).as('getRestaurants');
}

function visitAsAdmin() {
  cy.visit(PAGE_URL, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'fake.admin.jwt');
      win.localStorage.setItem('user', JSON.stringify({
        _id: 'admin1', name: 'Super Admin', email: 'admin@system.com', role: 'super_admin',
      }));
    },
  });
}

const FAKE_RESTAURANTS = [
  { _id: 'rest1', name: 'Pizza Palace', address: '1 Main St', isActive: true,  totalTables: 5 },
  { _id: 'rest2', name: 'Burger Barn',  address: '2 High St', isActive: false, totalTables: 0 },
];

// ─── 8a. Authentication guard ─────────────────────────────────────────────────

describe('Restaurants page — authentication guard', () => {
  it('redirects to login.html when no token is stored', () => {
    // TODO: cy.visit(PAGE_URL), assert URL includes login.html
  });

  it('redirects to login.html when user is an owner', () => {
    // TODO: visit with owner role, assert redirect
  });

  it('loads the page when role is super_admin', () => {
    stubRestaurants();
    visitAsAdmin();
    // TODO: cy.wait('@getRestaurants'), assert URL includes restaurants.html
  });
});

// ─── 8b. Page structure ───────────────────────────────────────────────────────

describe('Restaurants page — page structure', () => {
  beforeEach(() => {
    stubRestaurants();
    visitAsAdmin();
    cy.wait('@getRestaurants');
  });

  it('shows the "Restaurants" heading', () => {
    // TODO: cy.get('h4').should('contain.text', 'Restaurants');
  });

  it('shows table headers: Name, Address, Active, Total Tables', () => {
    // TODO: check th cells
  });

  it('shows the search input', () => {
    // TODO: cy.get('#restaurantSearch').should('exist');
  });

  it('shows the restaurant count summary card', () => {
    // TODO: cy.get('#restaurantCount').should('exist');
  });
});

// ─── 8c. Restaurants table ────────────────────────────────────────────────────

describe('Restaurants page — table content', () => {
  it('renders a row for each restaurant', () => {
    stubRestaurants(FAKE_RESTAURANTS);
    visitAsAdmin();
    cy.wait('@getRestaurants');
    // TODO: cy.get('#restaurantsTable tr').should('have.length', 2);
  });

  it('shows restaurant name, address, active status and table count', () => {
    stubRestaurants(FAKE_RESTAURANTS);
    visitAsAdmin();
    cy.wait('@getRestaurants');
    // TODO: assert 'Pizza Palace', '1 Main St', 'Yes', '5' in first row
    //       assert 'No' in second row
  });

  it('shows "No restaurants found" when list is empty', () => {
    stubRestaurants([]);
    visitAsAdmin();
    cy.wait('@getRestaurants');
    // TODO: cy.get('#restaurantsTable').should('contain.text', 'No restaurants found');
  });
});

// ─── 8d. Restaurant count card ────────────────────────────────────────────────

describe('Restaurants page — count card', () => {
  it('shows the correct restaurant count', () => {
    stubRestaurants(FAKE_RESTAURANTS);
    visitAsAdmin();
    cy.wait('@getRestaurants');
    // TODO: cy.get('#restaurantCount').should('have.text', '2');
  });
});

// ─── 8e. Row click navigates to individual restaurant page ────────────────────

describe('Restaurants page — row navigation', () => {
  it('navigates to ind_restaurant.html with correct id when a row is clicked', () => {
    stubRestaurants(FAKE_RESTAURANTS);
    visitAsAdmin();
    cy.wait('@getRestaurants');
    // TODO: cy.get('#restaurantsTable tr').first().click();
    //       cy.url().should('include', 'ind_restaurant.html')
    //               .and('include', 'rest1');
  });
});

// ─── 8f. Search / filter ─────────────────────────────────────────────────────

describe('Restaurants page — search', () => {
  it('filters rows when typing in the search box', () => {
    stubRestaurants(FAKE_RESTAURANTS);
    visitAsAdmin();
    cy.wait('@getRestaurants');
    cy.get('#restaurantsTable tr').should('have.length', 2);
    // TODO: cy.get('#restaurantSearch').type('Pizza');
    //       cy.get('#restaurantsTable tr').should('have.length', 1);
    //       cy.get('#restaurantsTable').should('contain.text', 'Pizza Palace');
  });

  it('shows "No restaurants found" when search matches nothing', () => {
    stubRestaurants(FAKE_RESTAURANTS);
    visitAsAdmin();
    cy.wait('@getRestaurants');
    // TODO: cy.get('#restaurantSearch').type('xyzzy');
    //       cy.get('#restaurantsTable').should('contain.text', 'No restaurants found');
  });
});

// ─── 8g. API error handling ───────────────────────────────────────────────────

describe('Restaurants page — API errors', () => {
  it('shows an error message when GET /admin/restaurants returns 401', () => {
    cy.intercept('GET', '/api/admin/restaurants', {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('getRestaurants');
    visitAsAdmin();
    cy.wait('@getRestaurants');
    // TODO: cy.get('#restaurantsTable').should('contain.text', 'Unauthorized');
  });
});

// ─── 8h. Logout ───────────────────────────────────────────────────────────────

describe('Restaurants page — logout', () => {
  it('clears localStorage and redirects to login.html on logout', () => {
    stubRestaurants();
    visitAsAdmin();
    // TODO: cy.get('#logoutDropdownBtn').click({ force: true });
    //       cy.url().should('include', 'login.html');
    //       assert localStorage cleared
  });
});
