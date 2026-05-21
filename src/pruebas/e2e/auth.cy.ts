describe('Authentication flows', () => {
  it('creates or reuses the single controlled test user', () => {
    cy.ensureSingleTestUser();

    cy.getByCy('nav-logout-button').should('be.visible');
  });

  it('logs in with the controlled test user and shows authenticated navigation', () => {
    cy.ensureSingleTestUser();
    cy.loginAsTestUser();

    cy.getByCy('nav-logout-button').should('be.visible');
    cy.getByCy('nav-orders-link').should('be.visible');
  });

  it('logs out and returns to login', () => {
    cy.ensureSingleTestUser();
    cy.loginAsTestUser();

    cy.getByCy('nav-logout-button').click();
    cy.location('pathname').should('eq', '/login');
    cy.getByCy('login-form').should('be.visible');
  });
});
