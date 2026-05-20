describe('Products flows', () => {
  it('renders the catalog and opens the product modal', () => {
    cy.visit('/products');

    cy.get('[data-cy^="product-card-"]').first().click();
    cy.getByCy('product-modal').should('be.visible');
    cy.getByCy('product-modal-close').click();
  });

  it('keeps the catalog route stable after closing a product modal', () => {
    cy.visit('/products');

    cy.location('pathname').should('eq', '/products');
    cy.get('[data-cy^="product-card-"]').first().click();
    cy.getByCy('product-modal').should('be.visible');
    cy.getByCy('product-modal-close').click();
    cy.getByCy('product-modal').should('not.exist');
    cy.location('pathname').should('eq', '/products');
  });
});
