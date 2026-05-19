/// <reference types="cypress" />

/**
 * SIVU - Vacantes (coordinador crea/publica, estudiante visualiza).
 *
 * data-testid esperados:
 *   - data-testid="nav-vacantes"
 *   - data-testid="vacantes-list"
 *   - data-testid="vacantes-create-btn"
 *   - data-testid="vacante-form-empresa"
 *   - data-testid="vacante-form-titulo"
 *   - data-testid="vacante-form-descripcion"
 *   - data-testid="vacante-form-area"
 *   - data-testid="vacante-form-modalidad"
 *   - data-testid="vacante-form-ciudad"
 *   - data-testid="vacante-form-keywords"
 *   - data-testid="vacante-form-creditos"
 *   - data-testid="vacante-form-promedio"
 *   - data-testid="vacante-form-programas"
 *   - data-testid="vacante-form-duracion"
 *   - data-testid="vacante-form-cupos"
 *   - data-testid="vacante-form-inicio"
 *   - data-testid="vacante-form-cierre"
 *   - data-testid="vacante-form-estado"
 *   - data-testid="vacante-form-submit"
 *   - data-testid="vacante-card-{id}"
 *   - data-testid="vacante-publicar-{id}"
 */

describe("SIVU · Vacantes (coordinador → estudiante)", () => {
  const titulo = `QA Cypress Vacante ${Date.now()}`;

  before(() => {
    cy.seedIfNeeded();
  });

  it("coordinador crea una vacante en estado BORRADOR", () => {
    cy.loginAsCoordinador();
    cy.visit("/vacantes");

    cy.get('[data-testid="vacantes-create-btn"]')
      .then(($el) => {
        if ($el.length) cy.wrap($el.first()).click({ force: true });
        else cy.contains(/crear vacante|nueva vacante/i).first().click({ force: true });
      });

    cy.get('[data-testid="vacante-form-empresa"], select[name="empresaId"]').first().select(0);
    cy.get('[data-testid="vacante-form-titulo"], input[name="titulo"]').first().type(titulo);
    cy.get('[data-testid="vacante-form-descripcion"], textarea[name="descripcion"]')
      .first()
      .type("Vacante creada por Cypress para validar el flujo completo end-to-end.");
    cy.get('[data-testid="vacante-form-area"], select[name="areaPractica"]').first().select("DESARROLLO_SW");
    cy.get('[data-testid="vacante-form-modalidad"], select[name="modalidad"]').first().select("REMOTO");
    cy.get('[data-testid="vacante-form-ciudad"], input[name="ciudad"]').first().type("Bogotá");
    cy.get('[data-testid="vacante-form-keywords"], input[name="requisitosKeywords"]')
      .first()
      .type("cypress, qa, sistemas");
    cy.get('[data-testid="vacante-form-creditos"], input[name="creditosMinimos"]').first().clear().type("100");
    cy.get('[data-testid="vacante-form-promedio"], input[name="promedioMinimo"]').first().clear().type("3.5");
    cy.get('[data-testid="vacante-form-programas"], input[name="programasDirigidos"]')
      .first()
      .type("Ingeniería de Sistemas");
    cy.get('[data-testid="vacante-form-duracion"], input[name="duracionMeses"]').first().clear().type("6");
    cy.get('[data-testid="vacante-form-cupos"], input[name="cuposDisponibles"]').first().clear().type("2");
    cy.get('[data-testid="vacante-form-inicio"], input[name="fechaInicio"]').first().type("2026-09-01");
    cy.get('[data-testid="vacante-form-cierre"], input[name="fechaCierrePostulaciones"]')
      .first()
      .type("2026-08-15");
    cy.get('[data-testid="vacante-form-estado"], select[name="estado"]')
      .then(($el) => {
        if ($el.length) cy.wrap($el).select("BORRADOR");
      });

    cy.get('[data-testid="vacante-form-submit"], button[type="submit"]').first().click();

    cy.contains(titulo, { timeout: 10_000 }).should("be.visible");
  });

  it("coordinador publica la vacante", () => {
    cy.loginAsCoordinador();
    cy.visit("/vacantes");

    cy.contains(titulo, { timeout: 10_000 }).click({ force: true });

    cy.get('[data-testid^="vacante-publicar-"], button:contains("Publicar")')
      .first()
      .click({ force: true });

    cy.contains(/PUBLICADA|Publicada/i, { timeout: 10_000 }).should("be.visible");
  });

  it("estudiante ve la vacante publicada en el listado público", () => {
    cy.loginAsEstudiante();
    cy.visit("/vacantes");

    cy.get('[data-testid="vacantes-list"], main', { timeout: 10_000 }).should("be.visible");
    cy.contains(titulo, { timeout: 10_000 }).should("be.visible");
  });
});
