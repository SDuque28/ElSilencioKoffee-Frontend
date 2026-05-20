describe('Dashboard routes', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  function expectStablePageMarker(dataCy: string, heading: string): void {
    cy.get('body').then(($body) => {
      if ($body.find(`[data-cy="${dataCy}"]`).length > 0) {
        cy.getByCy(dataCy).should('be.visible');
        return;
      }

      cy.contains('h1', heading).should('be.visible');
    });
  }

  it('renders the dashboard overview', () => {
    cy.visit('/dashboard');

    cy.getByCy('dashboard-home-page').should('be.visible');
  });

  it('renders the analytics dashboard', () => {
    cy.visit('/dashboard/analytics');

    cy.location('pathname').should('eq', '/dashboard/analytics');
    expectStablePageMarker('dashboard-analytics-page', 'Detailed Analytics');
  });

  it('renders the top buyers dashboard', () => {
    cy.visit('/dashboard/users');

    expectStablePageMarker('dashboard-users-page', 'Users');
  });

  it('renders the products administration dashboard', () => {
    cy.visit('/dashboard/products');

    expectStablePageMarker('dashboard-products-page', 'Products');
  });

  it('renders the orders administration dashboard', () => {
    cy.visit('/dashboard/orders');

    expectStablePageMarker('dashboard-orders-page', 'Orders');
  });

  it('renders the monitoring dashboard', () => {
    cy.visit('/dashboard/monitoring');

    expectStablePageMarker('dashboard-monitoring-page', 'Monitoring');
  });
});
