/**
 * Guest Menu Page Tests
 *
 * Prerequisites: cd backend && npm start
 * Uses mocked public menu API so no database seed is required.
 *
 * Run: npm run test:e2e -- --spec cypress/e2e/guest-menu.cy.js
 */

const RESTAURANT_ID = '507f1f77bcf86cd799439011';

const mockMenuResponse = {
  success: true,
  menu: [
    {
      _id: '1',
      name: 'Margherita Pizza',
      category: 'Mains',
      description: 'Tomato, mozzarella, basil',
      price: 16.5,
      dietaryType: 'veg',
      isAvailable: true,
    },
    {
      _id: '2',
      name: 'Iced Latte',
      category: 'Beverages',
      description: 'Cold brew with milk',
      price: 5.5,
      isAvailable: true,
    },
  ],
};

describe('Guest menu — QR route /menu/:restaurantId', () => {
  beforeEach(() => {
    cy.intercept('GET', `**/api/menu/public/${RESTAURANT_ID}`, {
      statusCode: 200,
      body: mockMenuResponse,
    }).as('getPublicMenu');
  });

  it('serves menu.html at /menu/:restaurantId', () => {
    cy.request(`/menu/${RESTAURANT_ID}?table=2`).its('status').should('equal', 200);
  });

  it('displays table number and menu items', () => {
    cy.visit(`/menu/${RESTAURANT_ID}?table=2`);
    cy.wait('@getPublicMenu');

    cy.get('#tableLabel').should('contain', 'Table 2').and('not.have.class', 'hide');
    cy.get('#menuStatus').should('have.class', 'hide');
    cy.contains('Margherita Pizza');
    cy.contains('$16.50');
    cy.contains('Iced Latte');
    cy.contains('.dietary-badge.veg', 'Veg');
    cy.contains('Beverages');
  });

  it('stores guest context in sessionStorage', () => {
    cy.visit(`/menu/${RESTAURANT_ID}?table=5`);
    cy.wait('@getPublicMenu');

    cy.window().then((win) => {
      const ctx = JSON.parse(win.sessionStorage.getItem('guestContext'));
      expect(ctx.restaurantId).to.equal(RESTAURANT_ID);
      expect(ctx.tableNumber).to.equal('5');
    });
  });

  it('shows error when menu API fails', () => {
    cy.intercept('GET', `**/api/menu/public/${RESTAURANT_ID}`, {
      statusCode: 404,
      body: { success: false, message: 'Restaurant not found' },
    });

    cy.visit(`/menu/${RESTAURANT_ID}?table=1`);
    cy.get('#menuError').should('not.have.class', 'hide');
    cy.contains('Restaurant not found');
  });

  it('shows message when menu is empty', () => {
    cy.intercept('GET', `**/api/menu/public/${RESTAURANT_ID}`, {
      statusCode: 200,
      body: { success: true, menu: [] },
    });

    cy.visit(`/menu/${RESTAURANT_ID}?table=1`);
    cy.contains('No menu items are available');
  });
});

describe('Guest menu — static /pages/menu.html fallback', () => {
  it('loads with restaurantId query param', () => {
    cy.intercept('GET', `**/api/menu/public/${RESTAURANT_ID}`, {
      statusCode: 200,
      body: mockMenuResponse,
    }).as('getPublicMenu');

    cy.visit(`/pages/menu.html?restaurantId=${RESTAURANT_ID}&table=3`);
    cy.wait('@getPublicMenu');
    cy.contains('Margherita Pizza');
    cy.get('#tableLabel').should('contain', 'Table 3');
  });
});
