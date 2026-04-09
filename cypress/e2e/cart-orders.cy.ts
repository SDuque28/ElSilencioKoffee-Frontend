describe('Cart and orders flows', () => {
  it('opens the cart drawer from the cart route and updates quantities', () => {
    cy.visit('/cart');

    cy.location('pathname').should('eq', '/');
    cy.getByCy('cart-drawer-item-ethiopian-yirgacheffe').should('be.visible');
    cy.getByCy('cart-drawer-quantity-ethiopian-yirgacheffe').should('contain.text', '1');
    cy.getByCy('cart-drawer-increase-ethiopian-yirgacheffe').click();
    cy.getByCy('cart-drawer-quantity-ethiopian-yirgacheffe').should('contain.text', '2');
    cy.getByCy('cart-drawer-decrease-ethiopian-yirgacheffe').click();
    cy.getByCy('cart-drawer-quantity-ethiopian-yirgacheffe').should('contain.text', '1');
    cy.getByCy('cart-drawer-remove-ethiopian-yirgacheffe').click();
    cy.getByCy('cart-drawer-item-ethiopian-yirgacheffe').should('not.exist');
  });

  it('creates a mock order and keeps it visible when navigating to orders', () => {
    cy.visit('/cart');

    cy.location('pathname').should('eq', '/');
    cy.getByCy('cart-drawer-checkout').click();
    cy.getByCy('toast-item').should('contain.text', 'Checkout complete');
    cy.getByCy('nav-orders-link').click();
    cy.location('pathname').should('eq', '/orders');
    cy.getByCy('orders-table').find('tbody tr').should('have.length', 4);
  });
});
