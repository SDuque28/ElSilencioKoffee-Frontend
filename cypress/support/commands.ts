declare global {
  namespace Cypress {
    interface Chainable {
      getByCy(value: string): Chainable<JQuery<HTMLElement>>;
      ensureSingleTestUser(): Chainable<void>;
      loginAsTestUser(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getByCy', (value: string) => cy.get(`[data-cy="${value}"]`));

function readRequiredEnv(name: string): string {
  const value = Cypress.env(name);

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing Cypress env var: ${name}`);
  }

  return value.trim();
}

function loginWithCredentials(username: string, password: string, expectedPath: string): void {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit('/login');
  cy.getByCy('login-username').clear().type(username);
  cy.getByCy('login-password').clear().type(password, { log: false });
  cy.getByCy('login-submit').click();
  cy.location('pathname', { timeout: 15000 }).should('eq', expectedPath);
}

Cypress.Commands.add('ensureSingleTestUser', () => {
  cy.fixture('users').then(({ testUser }) => {
    cy.visit('/register');
    cy.getByCy('register-username').clear().type(testUser.username);
    cy.getByCy('register-email').clear().type(testUser.email);
    cy.getByCy('register-password').clear().type(testUser.password, { log: false });
    cy.getByCy('register-submit').click();

    cy.location('pathname', { timeout: 15000 }).then((pathname) => {
      if (pathname === '/products') {
        return;
      }

      loginWithCredentials(testUser.username, testUser.password, '/products');
    });
  });
});

Cypress.Commands.add('loginAsTestUser', () => {
  cy.fixture('users').then(({ testUser }) => {
    loginWithCredentials(testUser.username, testUser.password, '/products');
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  loginWithCredentials(
    readRequiredEnv('ADMIN_USERNAME'),
    readRequiredEnv('ADMIN_PASSWORD'),
    '/dashboard',
  );
});

export {};
