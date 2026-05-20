describe('Cart flows', () => {
  beforeEach(() => {
    cy.ensureSingleTestUser();
    cy.loginAsTestUser();
  });

  it('loads the authenticated user cart page route', () => {
    cy.visit('/cart');

    cy.location('pathname').should('eq', '/cart');
    cy.getByCy('cart-page').should('be.visible');
  });

  it('adds a catalog item and keeps the cart drawer usable', () => {
    cy.visit('/products');

    cy.get('[data-cy^="product-card-add-"]:not([disabled])').first().click();
    cy.getByCy('cart-drawer').should('be.visible');

    cy.get('[data-cy^="cart-drawer-increase-"]').first().click();
    cy.get('[data-cy^="cart-drawer-quantity-"]').first().should('be.visible');

    cy.visit('/cart');
    cy.location('pathname').should('eq', '/cart');
    cy.getByCy('cart-page').should('be.visible');
  });
});
