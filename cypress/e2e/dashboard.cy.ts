describe('Dashboard routes', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  function expectDataOrState(
    chartCy: string,
    emptyCy: string,
    errorCy: string,
    loadingCy?: string,
  ) {
    cy.get('body').then(($body) => {
      if (loadingCy && $body.find(`[data-cy="${loadingCy}"]`).length > 0) {
        cy.getByCy(loadingCy).should('be.visible');
        return;
      }

      if ($body.find(`[data-cy="${errorCy}"]`).length > 0) {
        cy.getByCy(errorCy).should('be.visible');
        return;
      }

      if ($body.find(`[data-cy="${emptyCy}"]`).length > 0) {
        cy.getByCy(emptyCy).should('be.visible');
        return;
      }

      cy.getByCy(chartCy).find('canvas').should('exist');
    });
  }

  it('renders the dashboard overview', () => {
    cy.visit('/dashboard');

    cy.getByCy('dashboard-home-page').should('be.visible');
    expectDataOrState(
      'dashboard-home-revenue-chart',
      'dashboard-home-empty',
      'dashboard-home-error',
      'dashboard-home-loading',
    );
  });

  it('renders the sales dashboard', () => {
    cy.visit('/dashboard/sales');

    cy.getByCy('dashboard-sales-page').should('be.visible');
    expectDataOrState(
      'dashboard-sales-chart',
      'dashboard-sales-empty',
      'dashboard-sales-error',
      'dashboard-sales-loading',
    );
  });

  it('renders the top buyers dashboard', () => {
    cy.visit('/dashboard/users');

    cy.getByCy('dashboard-users-page').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="dashboard-users-error"]').length > 0) {
        cy.getByCy('dashboard-users-error').should('be.visible');
        return;
      }

      if ($body.find('[data-cy="dashboard-users-empty"]').length > 0) {
        cy.getByCy('dashboard-users-empty').should('be.visible');
        return;
      }

      cy.getByCy('dashboard-users-table').should('be.visible');
    });
  });

  it('renders the environment monitoring dashboard', () => {
    cy.visit('/dashboard/environment');

    cy.getByCy('dashboard-environment-page').should('be.visible');
    expectDataOrState(
      'dashboard-environment-temperature-chart',
      'dashboard-environment-empty',
      'dashboard-environment-error',
      'dashboard-environment-loading',
    );
  });

  it('renders the production dashboard', () => {
    cy.visit('/dashboard/production');

    cy.getByCy('dashboard-production-page').should('be.visible');
    expectDataOrState(
      'dashboard-production-chart',
      'dashboard-production-empty',
      'dashboard-production-error',
      'dashboard-production-loading',
    );
  });
});
