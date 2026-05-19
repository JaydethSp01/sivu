/// <reference types="cypress" />

/**
 * SIVU - Matching tool (admin / coordinador).
 *
 * Verifica que la herramienta de matching del frontend (panel "Automatización")
 * permita seleccionar un estudiante y una vacante y mostrar el score y la
 * justificación devueltos por GET /automatizacion/matching.
 *
 * data-testid esperados:
 *   - data-testid="nav-automatizacion"
 *   - data-testid="matching-tool"
 *   - data-testid="matching-estudiante-select"
 *   - data-testid="matching-vacante-select"
 *   - data-testid="matching-calcular-btn"
 *   - data-testid="matching-score"
 *   - data-testid="matching-justificacion"
 *   - data-testid="matching-recomendado"
 */

describe("SIVU · Matching tool", () => {
  before(() => {
    cy.seedIfNeeded();
  });

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it("admin abre la herramienta de matching", () => {
    cy.visit("/automatizacion/matching");
    cy.get('[data-testid="matching-tool"], main', { timeout: 10_000 }).should("be.visible");
    cy.contains(/matching|emparejamiento/i).should("exist");
  });

  it("calcula el score entre un estudiante y una vacante y muestra justificación", () => {
    cy.visit("/automatizacion/matching");

    cy.get('[data-testid="matching-estudiante-select"], select[name="estudianteId"]')
      .first()
      .select(0);
    cy.get('[data-testid="matching-vacante-select"], select[name="vacanteId"]').first().select(0);

    cy.get('[data-testid="matching-calcular-btn"], button:contains("Calcular")', { timeout: 8000 })
      .first()
      .click({ force: true });

    cy.get('[data-testid="matching-score"]', { timeout: 10_000 })
      .should("be.visible")
      .invoke("text")
      .should("match", /\d/);

    cy.get('[data-testid="matching-justificacion"]', { timeout: 10_000 })
      .should("be.visible")
      .invoke("text")
      .then((txt) => expect(txt.trim().length).to.be.greaterThan(0));
  });

  it("el endpoint backend retorna score y recomendado consistentes", () => {
    const apiUrl = Cypress.env("apiUrl") as string;
    cy.loginAsAdmin().then((token) => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/automatizacion/matching?estudianteId=1&vacanteId=1`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(parseFloat(res.body.score)).to.be.within(0, 100);
        expect(res.body.recomendado).to.be.a("boolean");
        expect(res.body.justificacion).to.be.a("string");
      });
    });
  });
});
