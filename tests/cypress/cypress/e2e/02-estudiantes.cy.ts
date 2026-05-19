/// <reference types="cypress" />

/**
 * SIVU - Gestión de estudiantes (perspectiva administrador).
 *
 * data-testid esperados:
 *   - data-testid="nav-estudiantes"
 *   - data-testid="estudiantes-table"
 *   - data-testid="estudiantes-search"
 *   - data-testid="estudiantes-create-btn"
 *   - data-testid="estudiante-form-tipoDocumento"
 *   - data-testid="estudiante-form-numeroDocumento"
 *   - data-testid="estudiante-form-nombres"
 *   - data-testid="estudiante-form-apellidos"
 *   - data-testid="estudiante-form-email"
 *   - data-testid="estudiante-form-programa"
 *   - data-testid="estudiante-form-semestre"
 *   - data-testid="estudiante-form-creditos"
 *   - data-testid="estudiante-form-promedio"
 *   - data-testid="estudiante-form-submit"
 *   - data-testid="estudiante-row-{id}"
 *   - data-testid="estudiante-delete-{id}"
 *   - data-testid="confirm-delete-yes"
 */

describe("SIVU · Estudiantes (admin)", () => {
  const sufijo = `cy${Date.now()}`;
  const nuevoEmail = `qa-est-${sufijo}@est.uempresarial.edu.co`;
  const nuevoDoc = `99${Date.now().toString().slice(-8)}`;

  before(() => {
    cy.seedIfNeeded();
  });

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it("admin ve el listado de estudiantes con datos seed", () => {
    cy.visit("/estudiantes");
    cy.get('[data-testid="estudiantes-table"], table', { timeout: 10_000 }).should("be.visible");
    cy.contains(/kelly/i, { timeout: 10_000 }).should("be.visible");
  });

  it("admin crea un estudiante y aparece en el listado", () => {
    cy.visit("/estudiantes");
    cy.get('[data-testid="estudiantes-create-btn"]')
      .then(($el) => {
        if ($el.length) cy.wrap($el.first()).click({ force: true });
        else cy.contains(/crear estudiante|nuevo estudiante|\+\s*estudiante/i).click({ force: true });
      });

    cy.get('[data-testid="estudiante-form-tipoDocumento"], select[name="tipoDocumento"]')
      .first()
      .select("CC");
    cy.get('[data-testid="estudiante-form-numeroDocumento"], input[name="numeroDocumento"]')
      .first()
      .type(nuevoDoc);
    cy.get('[data-testid="estudiante-form-nombres"], input[name="nombres"]').first().type("QA");
    cy.get('[data-testid="estudiante-form-apellidos"], input[name="apellidos"]').first().type("Cypress");
    cy.get('[data-testid="estudiante-form-email"], input[name="email"], input[type="email"]')
      .first()
      .type(nuevoEmail);
    cy.get('[data-testid="estudiante-form-programa"], input[name="programaAcademico"]')
      .first()
      .type("Ingeniería de Sistemas");
    cy.get('[data-testid="estudiante-form-semestre"], input[name="semestre"]').first().clear().type("8");
    cy.get('[data-testid="estudiante-form-creditos"], input[name="creditosAprobados"]')
      .first()
      .clear()
      .type("130");
    cy.get('[data-testid="estudiante-form-promedio"], input[name="promedioAcumulado"]')
      .first()
      .clear()
      .type("4.10");

    cy.get('[data-testid="estudiante-form-submit"], button[type="submit"]').first().click();

    // Confirma que el nuevo estudiante aparece en el listado
    cy.contains(nuevoEmail, { timeout: 10_000 }).should("be.visible");
  });

  it("admin busca un estudiante por email y lo encuentra", () => {
    cy.visit("/estudiantes");
    cy.get('[data-testid="estudiantes-search"], input[type="search"], input[placeholder*="buscar" i]')
      .first()
      .clear()
      .type(nuevoEmail);

    cy.contains(nuevoEmail, { timeout: 10_000 }).should("be.visible");
  });

  it("admin elimina el estudiante creado y desaparece del listado", () => {
    cy.visit("/estudiantes");
    cy.get('[data-testid="estudiantes-search"], input[type="search"], input[placeholder*="buscar" i]')
      .first()
      .clear()
      .type(nuevoEmail);

    cy.contains("tr", nuevoEmail, { timeout: 10_000 })
      .within(() => {
        cy.get('[data-testid^="estudiante-delete-"], button[aria-label*="elimin" i], button:contains("Eliminar")')
          .first()
          .click({ force: true });
      });

    cy.get('[data-testid="confirm-delete-yes"]')
      .then(($el) => {
        if ($el.length) cy.wrap($el.first()).click({ force: true });
        else cy.contains(/confirmar|sí|si,/i).first().click({ force: true });
      });

    cy.contains(nuevoEmail).should("not.exist");
  });
});
