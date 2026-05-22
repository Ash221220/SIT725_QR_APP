/**
 * Individual Restaurant Page E2E Tests
 *
 * Covers:
 *   1. frontend/pages/ind_restaurant.html
 *   2. restaurant table listing loaded from API
 *   3. QR code rendering
 *   4. empty state and API error handling
 */

const IND_RESTAURANT_URL = '/pages/ind_restaurant.html?restaurantId=rest1&id=rest1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loginAsAdmin() {
  cy.visit(IND_RESTAURANT_URL, {
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

function stubRestaurantTables(tables = []) {
  cy.intercept('GET', '**/api/admin/restaurants/*/tables', {
    statusCode: 200,
    body: {
      success: true,
      restaurant: {
        _id: 'rest1',
        name: 'Pizza Palace',
      },
      tables,
    },
  }).as('restaurantTables');
}

function visitIndividualRestaurant(tables = FAKE_TABLES) {
  stubRestaurantTables(tables);
  loginAsAdmin();
  cy.wait('@restaurantTables');
}

const FAKE_TABLES = [
  {
    _id: 'table1',
    tableNumber: 1,
    qrCodeUrl: '/uploads/qr/table1.png',
  },
  {
    _id: 'table2',
    tableNumber: 2,
    qrCodeUrl: '/uploads/qr/table2.png',
  },
];

// ─── Page structure ───────────────────────────────────────────────────────────

describe('Individual restaurant page — structure', () => {
  it('loads the restaurant tables page', () => {
    visitIndividualRestaurant();

    cy.title().should('include', 'Restaurant');
    cy.get('#restaurantTablesContainer').should('exist');
  });

  it('shows navbar and back button', () => {
    visitIndividualRestaurant();

    cy.get('nav .brand-logo').should('contain.text', 'Admin');
    cy.contains('Back to Restaurants').should('be.visible');
  });

  it('back button links to restaurants page', () => {
    visitIndividualRestaurant();

    cy.contains('Back to Restaurants')
      .should('have.attr', 'href')
      .and('include', 'restaurants.html');
  });
});

// ─── Tables loaded from API ───────────────────────────────────────────────────

describe('Individual restaurant page — API data rendering', () => {
  it('renders restaurant tables from API', () => {
    visitIndividualRestaurant();

    cy.get('#restaurantTablesContainer').should('contain.text', 'Table');
    cy.get('#restaurantTablesContainer').should('contain.text', '1');
    cy.get('#restaurantTablesContainer').should('contain.text', '2');
  });

  it('displays QR code images for tables', () => {
    visitIndividualRestaurant();

    cy.get('#restaurantTablesContainer img').should('have.length', 2);

    cy.get('#restaurantTablesContainer img')
      .eq(0)
      .should('have.attr', 'src')
      .and('include', 'table1.png');
  });
});

// ─── Empty state and error handling ───────────────────────────────────────────

describe('Individual restaurant page — empty and error states', () => {
  it('shows empty message when no tables exist', () => {
    visitIndividualRestaurant([]);

    cy.get('#restaurantTablesContainer').should('contain.text', 'No tables found');
  });

  it('handles tables API error', () => {
    cy.intercept('GET', '**/api/admin/restaurants/*/tables', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Failed to load tables',
      },
    }).as('tablesError');

    loginAsAdmin();

    cy.wait('@tablesError');
    cy.get('#restaurantTablesContainer').should('contain.text', 'Failed to load tables');
  });
});