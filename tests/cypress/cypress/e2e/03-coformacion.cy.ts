/// <reference types="cypress" />

export {};

/**
 * SIVU · Coformación v2 (contrato de API).
 *
 * Valida vía cy.request el flujo núcleo del backend re-scopeado: la Oficina de
 * Coformación crea la práctica directa (POST /convenios, sin vacante ni
 * postulación), consulta el expediente del estudiante y lista las
 * disponibilidades de agendamiento. Todo con la sesión del admin seed.
 */

const apiUrl = Cypress.env("apiUrl") as string;

describe("SIVU · Coformación v2 (API)", () => {
  let adminToken: string;

  before(() => {
    cy.seedIfNeeded();
    cy.loginAsAdmin().then((t) => {
      adminToken = t as unknown as string;
    });
  });

  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  it("admin crea una práctica directa (convenio) con estudiante, empresa y tutores", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/convenios`,
      headers: auth(),
      body: {
        estudianteId: 1,
        empresaId: 1,
        tutorAcademicoId: 1,
        tutorEmpresarialId: 3,
        fechaInicio: "2026-08-01",
        fechaFin: "2027-05-01",
      },
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.id).to.be.a("number");
      expect(String(res.body.estudianteId)).to.eq("1");
      expect(String(res.body.empresaId)).to.eq("1");
      expect(res.body.numeroConvenio).to.be.a("string").and.have.length.greaterThan(0);
      expect(res.body.estado).to.eq("BORRADOR");
    });
  });

  it("admin lista convenios (respuesta paginada)", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/convenios?page=0&size=10`,
      headers: auth(),
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.content).to.be.an("array");
    });
  });

  it("admin consulta el expediente del estudiante seed", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/expedientes/1`,
      headers: auth(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 404]);
    });
  });

  it("admin lista las disponibilidades de agendamiento", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/agendamiento/disponibilidades`,
      headers: auth(),
    }).then((res) => {
      expect(res.status).to.eq(200);
      const body = res.body;
      expect(Array.isArray(body) || Array.isArray(body.content)).to.be.true;
    });
  });
});
