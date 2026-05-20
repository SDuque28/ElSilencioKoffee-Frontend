describe('Products flows', () => {
  it('renders the catalog and opens the product modal', () => {
    cy.visit('/products');

    cy.getByCy('product-card-5').click();
    cy.getByCy('product-modal').should('be.visible');
    cy.getByCy('product-modal').should('contain.text', 'Barista Pro Grinder');
    cy.getByCy('product-modal-close').click();
  });

  it('opens a product route and resolves it through the modal flow', () => {
    cy.visit('/product/1');

    cy.location('pathname').should('eq', '/products');
    cy.getByCy('product-modal').should('be.visible');
    cy.getByCy('product-modal').should('contain.text', 'Ethiopian Yirgacheffe');
  });
});
