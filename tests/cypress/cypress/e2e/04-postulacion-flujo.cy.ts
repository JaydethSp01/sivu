/// <reference types="cypress" />

/**
 * SIVU - Flujo completo de postulación, transiciones de estado, formalización
 * y descarga de PDF del convenio.
 *
 * Estrategia híbrida:
 *  - El UI ejecuta postulación y transiciones para validar UX.
 *  - La descarga del PDF se valida vía cy.request() porque el frontend solo
 *    abre el archivo (no se puede assert sobre binarios directamente).
 *
 * data-testid esperados:
 *   - data-testid="vacante-card-{id}"
 *   - data-testid="postular-btn"
 *   - data-testid="postular-mensaje"
 *   - data-testid="postular-submit"
 *   - data-testid="mis-postulaciones-list"
 *   - data-testid="postulacion-score"
 *   - data-testid="postulacion-estado"
 *   - data-testid="cambiar-estado-btn"
 *   - data-testid="cambiar-estado-select"
 *   - data-testid="cambiar-estado-submit"
 *   - data-testid="formalizar-btn"
 *   - data-testid="descargar-pdf-btn"
 */

describe("SIVU · Flujo de postulación end-to-end", () => {
  const apiUrl = Cypress.env("apiUrl") as string;
  let estudianteToken: string;
  let coordToken: string;
  let estudianteId: number;
  let vacanteId: number;
  let postulacionId: number;
  let convenioId: number;

  before(() => {
    cy.seedIfNeeded();

    // Obtiene tokens y referencias vía API para tener un estado conocido
    cy.request("POST", `${apiUrl}/auth/login`, {
      email: "coord@uempresarial.edu.co",
      password: "Coord123*",
    }).then((res) => {
      coordToken = res.body.accessToken;
    });

    cy.request("POST", `${apiUrl}/auth/login`, {
      email: "kelly@est.uempresarial.edu.co",
      password: "Estudiante123*",
    }).then((res) => {
      estudianteToken = res.body.accessToken;
      estudianteId = res.body.usuario.estudianteId ?? 1;
    });

    // Crea una vacante PUBLICADA dedicada a este spec para evitar duplicados
    cy.then(() => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/vacantes`,
        headers: { Authorization: `Bearer ${coordToken}` },
        body: {
          empresaId: 1,
          titulo: `QA Cypress flujo ${Date.now()}`,
          descripcion: "Vacante creada para 04-postulacion-flujo.cy.ts",
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
          estado: "PUBLICADA",
        },
      }).then((res) => {
        vacanteId = res.body.id;
      });
    });
  });

  it("estudiante se postula desde el UI y ve la postulación con score", () => {
    cy.loginAsEstudiante();
    cy.visit(`/vacantes/${vacanteId}`);

    cy.get('[data-testid="postular-btn"], button:contains("Postular")', { timeout: 10_000 })
      .first()
      .click({ force: true });

    cy.get('[data-testid="postular-mensaje"], textarea[name="mensajeEstudiante"]', { timeout: 8000 })
      .first()
      .type("Me postulo desde Cypress E2E.");
    cy.get('[data-testid="postular-submit"], button[type="submit"]').first().click({ force: true });

    cy.visit("/mis-postulaciones");
    cy.get('[data-testid="mis-postulaciones-list"], main', { timeout: 10_000 }).should("be.visible");
    cy.get('[data-testid="postulacion-score"]', { timeout: 10_000 })
      .first()
      .should("be.visible")
      .invoke("text")
      .should("match", /\d/);

    // Capturamos el id de postulación para los pasos siguientes
    cy.request({
      method: "GET",
      url: `${apiUrl}/postulaciones?estudianteId=${estudianteId}&vacanteId=${vacanteId}`,
      headers: { Authorization: `Bearer ${estudianteToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.content.length).to.be.greaterThan(0);
      postulacionId = res.body.content[0].id;
    });
  });

  it("coordinador transiciona la postulación EN_REVISION → PRESELECCIONADA → ACEPTADA", () => {
    const estados = ["EN_REVISION", "PRESELECCIONADA", "ACEPTADA"] as const;
    cy.then(() => {
      estados.forEach((estado) => {
        cy.request({
          method: "PATCH",
          url: `${apiUrl}/postulaciones/${postulacionId}/estado`,
          headers: { Authorization: `Bearer ${coordToken}` },
          body: { nuevoEstado: estado, observaciones: `Transición a ${estado} desde Cypress.` },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.estado).to.eq(estado);
        });
      });
    });

    // Confirma en UI que el estado final ACEPTADA es visible
    cy.loginAsCoordinador();
    cy.visit(`/postulaciones/${postulacionId}`);
    cy.contains(/ACEPTADA/i, { timeout: 10_000 }).should("be.visible");
  });

  it("coordinador formaliza la postulación y se genera el convenio", () => {
    cy.then(() => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/automatizacion/formalizar/${postulacionId}`,
        headers: { Authorization: `Bearer ${coordToken}` },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.convenioId).to.be.a("number");
        convenioId = res.body.convenioId;
      });
    });
  });

  it("descarga el PDF del convenio (200 + application/pdf)", () => {
    cy.then(() => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/automatizacion/convenios/${convenioId}/pdf`,
        headers: { Authorization: `Bearer ${coordToken}` },
        encoding: "binary",
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"] as string).to.include("application/pdf");
        // Un PDF válido empieza con %PDF-
        expect((res.body as string).slice(0, 5)).to.eq("%PDF-");
      });
    });
  });
});
