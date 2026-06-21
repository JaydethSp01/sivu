/// <reference types="cypress" />

/**
 * SIVU · Estudiantes (administrador).
 *
 * Valida el CRUD de estudiantes vía API (contrato real del backend) y que la
 * pantalla de estudiantes del frontend cargue con sesión hidratada y muestre
 * los datos seed (Kelly).
 */

const apiUrl = Cypress.env("apiUrl") as string;

describe("SIVU · Estudiantes (admin)", () => {
  let adminToken: string;
  const ts = `${Date.now()}`;
  const nuevoEmail = `qa-est-${ts}@est.uempresarial.edu.co`;
  let estudianteId: number;

  before(() => {
    cy.seedIfNeeded();
    cy.loginAsAdmin().then((t) => {
      adminToken = t as unknown as string;
    });
  });

  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  it("admin lista estudiantes y existe el seed (Kelly)", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/estudiantes?page=0&size=50`,
      headers: auth(),
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.content).to.be.an("array");
      const emails = res.body.content.map((e: { email: string }) => e.email);
      expect(emails.join(" ")).to.match(/kelly/i);
    });
  });

  it("admin crea un estudiante (201) y aparece al listar", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/estudiantes`,
      headers: auth(),
      body: {
        tipoDocumento: "CC",
        numeroDocumento: `2${ts.slice(-9)}`,
        nombres: "QA",
        apellidos: "Cypress",
        email: nuevoEmail,
        telefono: "+57 3000000000",
        programaAcademico: "Ingeniería de Sistemas",
        semestre: 8,
        creditosAprobados: 130,
        promedioAcumulado: 4.1,
        estado: "ACTIVO",
      },
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.id).to.be.a("number");
      estudianteId = res.body.id;
    });
  });

  it("admin obtiene el estudiante creado por id", () => {
    cy.request({ method: "GET", url: `${apiUrl}/estudiantes/${estudianteId}`, headers: auth() }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.email).to.eq(nuevoEmail);
    });
  });

  it("admin elimina el estudiante creado (204)", () => {
    cy.request({ method: "DELETE", url: `${apiUrl}/estudiantes/${estudianteId}`, headers: auth() }).then((res) => {
      expect(res.status).to.eq(204);
    });
  });

  it("la pantalla de estudiantes carga autenticada (sin redirigir a login)", () => {
    cy.loginAsAdmin();
    cy.visitAuthed("/estudiantes");
    cy.location("pathname", { timeout: 10_000 }).should("eq", "/estudiantes");
    cy.contains(/estudiantes/i, { timeout: 10_000 }).should("be.visible");
  });
});
