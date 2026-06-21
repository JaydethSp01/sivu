/// <reference types="cypress" />

/**
 * SIVU · Vacantes (coordinador crea/publica, estudiante visualiza).
 *
 * Crea y publica una vacante vía API (contrato real) y verifica que la lista
 * pública de vacantes del frontend cargue para el estudiante.
 */

const apiUrl = Cypress.env("apiUrl") as string;

describe("SIVU · Vacantes (coordinador → estudiante)", () => {
  let coordToken: string;
  let vacanteId: number;
  const titulo = `QA Cypress Vacante ${Date.now()}`;

  const baseVacante = (estado: string) => ({
    empresaId: 1,
    titulo,
    descripcion: "Vacante creada por Cypress para validar el flujo end-to-end.",
    areaPractica: "DESARROLLO_SW",
    modalidad: "REMOTO",
    ciudad: "Bogotá",
    requisitosKeywords: ["cypress", "qa", "sistemas"],
    creditosMinimos: 100,
    promedioMinimo: 3.5,
    programasDirigidos: ["Ingeniería de Sistemas"],
    duracionMeses: 6,
    cuposDisponibles: 2,
    fechaInicio: "2026-09-01",
    fechaCierrePostulaciones: "2026-08-15",
    estado,
  });

  before(() => {
    cy.seedIfNeeded();
    cy.loginAsCoordinador().then((t) => {
      coordToken = t as unknown as string;
    });
  });

  const auth = () => ({ Authorization: `Bearer ${coordToken}` });

  it("coordinador crea una vacante en BORRADOR (201)", () => {
    cy.request({ method: "POST", url: `${apiUrl}/vacantes`, headers: auth(), body: baseVacante("BORRADOR") }).then(
      (res) => {
        expect(res.status).to.eq(201);
        expect(res.body.estado).to.eq("BORRADOR");
        vacanteId = res.body.id;
      }
    );
  });

  it("coordinador publica la vacante (PUBLICADA)", () => {
    cy.request({
      method: "PUT",
      url: `${apiUrl}/vacantes/${vacanteId}`,
      headers: auth(),
      body: baseVacante("PUBLICADA"),
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.estado).to.eq("PUBLICADA");
    });
  });

  it("la vacante publicada aparece al listar PUBLICADA", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/vacantes?estado=PUBLICADA&page=0&size=50`,
      headers: auth(),
    }).then((res) => {
      expect(res.status).to.eq(200);
      const titulos = res.body.content.map((v: { titulo: string }) => v.titulo);
      expect(titulos).to.include(titulo);
    });
  });

  it("el estudiante ve la lista de vacantes en el frontend", () => {
    cy.loginAsEstudiante();
    cy.visitAuthed("/vacantes");
    cy.location("pathname", { timeout: 10_000 }).should("eq", "/vacantes");
    cy.contains(/vacante/i, { timeout: 12_000 }).should("be.visible");
  });
});
