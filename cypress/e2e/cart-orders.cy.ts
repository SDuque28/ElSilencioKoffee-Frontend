describe('Cart flows', () => {
  beforeEach(() => {
    cy.loginAsUser();
  });

  it('loads the authenticated user cart from the backend cart page route', () => {
    cy.visit('/cart');

    cy.location('pathname').should('eq', '/cart');
    cy.getByCy('cart-page').should('be.visible');
    cy.getByCy('cart-page-item-6').should('be.visible');
    cy.getByCy('cart-page-quantity-6').should('contain.text', '1');
  });

  it('adds, updates, persists, and removes cart items through the backend', () => {
    cy.visit('/products');

    cy.getByCy('product-card-add-1').click();
    cy.getByCy('toast-item').should('contain.text', 'Added to cart');
    cy.getByCy('cart-drawer-item-1').should('be.visible');
    cy.getByCy('cart-drawer-quantity-1').should('contain.text', '1');

    cy.getByCy('cart-drawer-increase-1').click();
    cy.getByCy('cart-drawer-quantity-1').should('contain.text', '2');

    cy.reload();
    cy.visit('/cart');
    cy.location('pathname').should('eq', '/cart');
    cy.getByCy('cart-page-item-1').should('be.visible');
    cy.getByCy('cart-page-quantity-1').should('contain.text', '2');

    cy.getByCy('cart-page-decrease-1').click();
    cy.getByCy('cart-page-quantity-1').should('contain.text', '1');
  });
});
