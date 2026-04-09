declare global {
  namespace Cypress {
    interface Chainable {
      getByCy(value: string): Chainable<JQuery<HTMLElement>>;
      loginAsUser(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getByCy', (value: string) => cy.get(`[data-cy="${value}"]`));

Cypress.Commands.add('loginAsUser', () => {
  cy.fixture('users').then(({ user }) => {
    cy.visit('/login');
    cy.getByCy('login-username').type(user.username);
    cy.getByCy('login-password').type(user.password);
    cy.getByCy('login-submit').click();
    cy.location('pathname').should('eq', '/products');
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('users').then(({ admin }) => {
    cy.visit('/login');
    cy.getByCy('login-username').type(admin.username);
    cy.getByCy('login-password').type(admin.password);
    cy.getByCy('login-submit').click();
    cy.location('pathname').should('eq', '/products');
  });
});

export {};
