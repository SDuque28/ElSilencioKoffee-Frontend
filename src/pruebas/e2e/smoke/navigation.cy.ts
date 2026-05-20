describe('Smoke navigation', () => {
  it('loads the home page', () => {
    cy.visit('/');

    cy.getByCy('nav-home-link').should('be.visible');
    cy.contains('El Silencio Koffee').should('be.visible');
  });

  it('loads the login page', () => {
    cy.visit('/login');

    cy.getByCy('login-form').should('be.visible');
    cy.getByCy('login-submit').should('be.visible');
  });

  it('loads the products catalog', () => {
    cy.visit('/products');

    cy.getByCy('products-grid')
      .find('article[data-cy^="product-card-"]')
      .its('length')
      .should('be.greaterThan', 0);
  });

  it('redirects invalid routes back to home', () => {
    cy.visit('/ruta-invalida', { failOnStatusCode: false });

    cy.location('pathname').should('eq', '/');
  });

  it('keeps primary navigation usable on mobile viewport', () => {
    cy.viewport(390, 844);
    cy.visit('/');

    cy.get('button[aria-label="Toggle navigation"]').click();
    cy.getByCy('mobile-nav-products-link').should('be.visible').click();
    cy.location('pathname').should('eq', '/products');
  });
});
