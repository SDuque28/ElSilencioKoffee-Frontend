describe('Admin authentication flows', () => {
  it('logs in as admin and opens the dashboard', () => {
    cy.loginAsAdmin();

    cy.location('pathname').should('eq', '/dashboard');
    cy.getByCy('dashboard-home-page').should('be.visible');
  });
});
