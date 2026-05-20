describe('Authentication flows', () => {
  it('logs in with a regular user and shows authenticated navigation', () => {
    cy.loginAsUser();

    cy.getByCy('nav-logout-button').should('be.visible');
    cy.getByCy('toast-item').should('contain.text', 'Welcome back');
  });

  it('logs in as admin and opens the dashboard', () => {
    cy.loginAsAdmin();

    cy.getByCy('nav-dashboard-link').click();
    cy.location('pathname').should('eq', '/dashboard');
    cy.getByCy('dashboard-home-page').should('be.visible');
  });

  it('registers a new account and redirects to products', () => {
    cy.fixture('users').then(({ register }) => {
      cy.visit('/register');
      cy.getByCy('register-username').type(register.username);
      cy.getByCy('register-email').type(register.email);
      cy.getByCy('register-password').type(register.password);
      cy.getByCy('register-submit').click();

      cy.location('pathname').should('eq', '/products');
      cy.getByCy('toast-item').should('contain.text', 'Account created');
    });
  });

  it('logs out and returns to login', () => {
    cy.loginAsUser();

    cy.getByCy('nav-logout-button').click();
    cy.location('pathname').should('eq', '/login');
    cy.getByCy('login-form').should('be.visible');
  });
});
