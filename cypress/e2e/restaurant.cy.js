/**
 * Restaurants Page E2E Tests
 *
 * Covers:
 *   1. frontend/pages/restaurants.html
 *   2. restaurant listing loaded from API
 *   3. search/filter behaviour
 *   4. empty state and API error handling
 */

const RESTAURANTS_URL = '/pages/restaurants.html';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loginAsAdmin() {
  cy.visit(RESTAURANTS_URL, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'fake.admin.jwt');
      win.localStorage.setItem('user', JSON.stringify({
        _id: 'admin1',
        name: 'Super Admin',
        email: 'admin@system.com',
        role: 'super_admin',
      }));
    },
  });
}

function stubRestaurants(restaurants = []) {
  cy.intercept('GET', '/api/admin/restaurants', {
    statusCode: 200,
    body: { success: true, restaurants },
  }).as('restaurants');
}

function visitRestaurants(restaurants = FAKE_RESTAURANTS) {
  stubRestaurants(restaurants);
  loginAsAdmin();
  cy.wait('@restaurants');
}

const FAKE_RESTAURANTS = [
  {
    _id: 'rest1',
    name: 'Pizza Palace',
    address: '1 Main Street',
    isActive: true,
    totalTables: 5,
  },
  {
    _id: 'rest2',
    name: 'Burger Barn',
    address: '2 High Street',
    isActive: false,
    totalTables: 3,
  },
];

// ─── Page structure ───────────────────────────────────────────────────────────

describe('Restaurants page — structure', () => {
  it('loads the restaurants page', () => {
    visitRestaurants();

    cy.title().should('include', 'Restaurants');
    cy.get('h4').should('contain.text', 'Restaurants');
  });

  it('shows navbar and main page elements', () => {
    visitRestaurants();

    cy.get('nav .brand-logo').should('contain.text', 'Admin');
    cy.get('#restaurantSearch').should('exist');
    cy.get('#restaurantCount').should('exist');
    cy.get('#restaurantsTable').should('exist');
  });
});

// ─── Restaurants loaded from API ──────────────────────────────────────────────

describe('Restaurants page — API data rendering', () => {
  it('renders restaurants from API', () => {
    visitRestaurants();

    cy.get('#restaurantsTable').should('contain.text', 'Pizza Palace');
    cy.get('#restaurantsTable').should('contain.text', '1 Main Street');
    cy.get('#restaurantsTable').should('contain.text', 'Burger Barn');
    cy.get('#restaurantsTable').should('contain.text', '2 High Street');
  });

  it('shows total restaurant count', () => {
    visitRestaurants();

    cy.get('#restaurantCount').should('contain.text', '2');
  });

  it('shows active status correctly', () => {
    visitRestaurants();

    cy.get('#restaurantsTable').should('contain.text', 'Yes');
    cy.get('#restaurantsTable').should('contain.text', 'No');
  });
});

// ─── Search/filter behaviour ─────────────────────────────────────────────────

describe('Restaurants page — search', () => {
  it('filters restaurants using search bar', () => {
    visitRestaurants();

    cy.get('#restaurantSearch').type('Pizza');

    cy.get('#restaurantsTable').should('contain.text', 'Pizza Palace');
    cy.get('#restaurantsTable').should('not.contain.text', 'Burger Barn');
  });

  it('updates restaurant count after search', () => {
    visitRestaurants();

    cy.get('#restaurantSearch').type('Pizza');

    cy.get('#restaurantCount').should('contain.text', '1');
  });
});

// ─── Empty state and error handling ───────────────────────────────────────────

describe('Restaurants page — empty and error states', () => {
  it('shows empty message when no restaurants exist', () => {
    visitRestaurants([]);

    cy.get('#restaurantsTable').should('contain.text', 'No restaurants found');
    cy.get('#restaurantCount').should('contain.text', '0');
  });

  it('handles restaurants API error', () => {
    cy.intercept('GET', '/api/admin/restaurants', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Failed to load restaurants',
      },
    }).as('restaurantsError');

    loginAsAdmin();

    cy.wait('@restaurantsError');
    cy.get('#restaurantsTable').should('contain.text', 'Failed to load restaurants');
  });
});