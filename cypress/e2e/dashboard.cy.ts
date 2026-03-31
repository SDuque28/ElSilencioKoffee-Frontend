describe('Dashboard routes', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('renders the dashboard overview', () => {
    cy.visit('/dashboard');

    cy.getByCy('dashboard-home-page').should('be.visible');
    cy.getByCy('dashboard-home-revenue-chart').find('canvas').should('exist');
  });

  it('renders the sales dashboard', () => {
    cy.visit('/dashboard/sales');

    cy.getByCy('dashboard-sales-page').should('be.visible');
    cy.getByCy('dashboard-sales-chart').find('canvas').should('exist');
  });

  it('renders the top buyers dashboard', () => {
    cy.visit('/dashboard/users');

    cy.getByCy('dashboard-users-page').should('be.visible');
    cy.getByCy('dashboard-users-table').should('contain.text', 'Camila Perez');
  });

  it('renders the environment monitoring dashboard', () => {
    cy.visit('/dashboard/environment');

    cy.getByCy('dashboard-environment-page').should('be.visible');
    cy.getByCy('dashboard-environment-temperature-chart').find('canvas').should('exist');
    cy.getByCy('dashboard-environment-humidity-chart').find('canvas').should('exist');
  });

  it('renders the production dashboard', () => {
    cy.visit('/dashboard/production');

    cy.getByCy('dashboard-production-page').should('be.visible');
    cy.getByCy('dashboard-production-chart').find('canvas').should('exist');
  });
});
