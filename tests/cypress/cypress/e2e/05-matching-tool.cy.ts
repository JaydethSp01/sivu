/// <reference types="cypress" />

/**
 * SIVU · Matching tool (admin / coordinador).
 *
 * Verifica el endpoint de matching estudiante↔vacante (score, recomendado,
 * justificación) y que la herramienta de automatización del frontend cargue.
 */

const apiUrl = Cypress.env("apiUrl") as string;

describe("SIVU · Matching tool", () => {
  let adminToken: string;

  before(() => {
    cy.seedIfNeeded();
    cy.loginAsAdmin().then((t) => {
      adminToken = t as unknown as string;
    });
  });

  it("el algoritmo de matching retorna info descriptiva", () => {
    cy.request({ method: "GET", url: `${apiUrl}/automatizacion/info`, headers: { Authorization: `Bearer ${adminToken}` } }).then(
      (res) => {
        expect(res.status).to.eq(200);
      }
    );
  });

  it("calcula score, recomendado y justificación entre estudiante y vacante seed", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/automatizacion/matching?estudianteId=1&vacanteId=1`,
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(parseFloat(res.body.score)).to.be.within(0, 100);
      expect(res.body.recomendado).to.be.a("boolean");
      expect(res.body.justificacion).to.be.a("string").and.to.have.length.greaterThan(0);
    });
  });

  it("smoke UI: la herramienta de matching carga autenticada", () => {
    cy.loginAsAdmin();
    cy.visitAuthed("/matching");
    cy.location("pathname", { timeout: 10_000 }).should("eq", "/matching");
  });
});
