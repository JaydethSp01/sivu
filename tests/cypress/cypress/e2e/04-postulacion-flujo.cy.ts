/// <reference types="cypress" />

/**
 * SIVU · Flujo completo de postulación.
 *
 * Recorre el ciclo real end-to-end vía API: aprobación de Hoja de Vida
 * (precondición de negocio), postulación con score, transiciones de estado,
 * formalización del convenio y descarga del PDF. Incluye un smoke de UI sobre
 * el detalle de la vacante.
 */

const apiUrl = Cypress.env("apiUrl") as string;

const HV_COMPLETA = {
  direccion: "Calle 1 # 2-3",
  telefonoContacto: "+57 3000000000",
  ciudad: "Bogotá",
  perfilSaber: "Fundamentos de ingeniería de software, testing y aseguramiento de calidad.",
  perfilHacer: "Automatiza pruebas de API y E2E con Cypress, Newman y k6.",
  perfilSer: "Responsable, proactiva y orientada al detalle.",
  habilidades: [{ categoria: "TECNICA", descripcion: "Automatización de pruebas", orden: 1 }],
  idiomas: [{ idioma: "Inglés", nivel: "B2", orden: 1 }],
  educacion: [{ programa: "Ingeniería de Sistemas", institucion: "Uniempresarial", enCurso: true, orden: 1 }],
};

describe("SIVU · Flujo de postulación end-to-end", () => {
  let adminToken: string;
  let estudianteId: number;
  let vacanteId: number;
  let postulacionId: number;
  let convenioId: number;

  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  before(() => {
    cy.seedIfNeeded();

    cy.loginAsAdmin().then((t) => {
      adminToken = t as unknown as string;
    });

    cy.request("POST", `${apiUrl}/auth/login`, {
      email: "kelly@est.uempresarial.edu.co",
      password: "Estudiante123*",
    }).then((res) => {
      estudianteId = res.body.usuario.estudianteId ?? 1;
    });

    // Precondición: la HV del estudiante debe estar APROBADA para postular.
    cy.then(() => {
      cy.request({ method: "PUT", url: `${apiUrl}/hoja-vida/${estudianteId}`, headers: auth(), body: HV_COMPLETA, failOnStatusCode: false });
      cy.request({ method: "GET", url: `${apiUrl}/hoja-vida/${estudianteId}`, headers: auth(), failOnStatusCode: false }).then((g) => {
        const hv = g.body || {};
        if (hv.estado !== "APROBADA") {
          cy.request({ method: "POST", url: `${apiUrl}/hoja-vida/${estudianteId}/enviar-a-coformacion`, headers: auth(), failOnStatusCode: false });
          cy.request({ method: "POST", url: `${apiUrl}/hoja-vida/${hv.id}/aprobar`, headers: auth(), failOnStatusCode: false });
        }
      });
    });

    // Vacante PUBLICADA dedicada a este spec (evita duplicados).
    cy.then(() => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/vacantes`,
        headers: auth(),
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

  it("el estudiante se postula y la postulación trae score y estado POSTULADA", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/postulaciones`,
      headers: auth(),
      body: { estudianteId, vacanteId, mensajeEstudiante: "Me postulo desde Cypress E2E." },
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.id).to.be.a("number");
      expect(res.body.estado).to.eq("POSTULADA");
      expect(parseFloat(res.body.scoreMatching)).to.be.within(0, 100);
      postulacionId = res.body.id;
    });
  });

  it("smoke UI: el detalle de la vacante carga autenticado", () => {
    cy.loginAsEstudiante();
    cy.visitAuthed(`/vacantes/${vacanteId}`);
    cy.location("pathname", { timeout: 10_000 }).should("include", `/vacantes/${vacanteId}`);
  });

  it("transiciona EN_REVISION → PRESELECCIONADA → ACEPTADA", () => {
    const estados = ["EN_REVISION", "PRESELECCIONADA", "ACEPTADA"];
    cy.wrap(estados).each((estado) => {
      cy.request({
        method: "PATCH",
        url: `${apiUrl}/postulaciones/${postulacionId}/estado`,
        headers: auth(),
        body: { nuevoEstado: estado, observaciones: `Transición a ${estado} desde Cypress.` },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.estado).to.eq(estado);
      });
    });
  });

  it("formaliza la postulación y genera el convenio", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/automatizacion/formalizar/${postulacionId}`,
      headers: auth(),
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.convenioId).to.be.a("number");
      convenioId = res.body.convenioId;
    });
  });

  it("descarga el PDF del convenio (200 + application/pdf)", () => {
    cy.then(() => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/automatizacion/convenios/${convenioId}/pdf`,
        headers: auth(),
        encoding: "binary",
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"] as string).to.include("application/pdf");
        expect((res.body as string).slice(0, 5)).to.eq("%PDF-");
      });
    });
  });
});
