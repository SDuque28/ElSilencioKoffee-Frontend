describe('Products flows', () => {
  it('renders the catalog and opens the product modal', () => {
    cy.visit('/products');

    cy.getByCy('product-card-barista-pro-grinder').click();
    cy.getByCy('product-modal').should('be.visible');
    cy.getByCy('product-modal').should('contain.text', 'Barista Pro Grinder');
    cy.getByCy('product-modal-close').click();
  });

  it('adds a product to the cart from the catalog card', () => {
    cy.visit('/products');

    cy.getByCy('product-card-add-barista-pro-grinder').click();
    cy.getByCy('cart-drawer').should('be.visible');
    cy.getByCy('cart-drawer-item-barista-pro-grinder').should('be.visible');
    cy.getByCy('toast-item').should('contain.text', 'Added to cart');
  });

  it('opens a product route and resolves it through the modal flow', () => {
    cy.visit('/product/ethiopian-yirgacheffe');

    cy.location('pathname').should('eq', '/products');
    cy.getByCy('product-modal').should('be.visible');
    cy.getByCy('product-modal').should('contain.text', 'Ethiopian Yirgacheffe');
    cy.getByCy('product-modal-add-to-cart').click();
    cy.getByCy('toast-item').should('contain.text', 'Added to cart');
  });
});
