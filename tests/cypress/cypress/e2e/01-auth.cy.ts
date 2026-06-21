/// <reference types="cypress" />

/**
 * SIVU · Autenticación
 *
 * Valida el flujo real de login del frontend React/Vite (página /login con
 * inputs estándar) y el contrato de autenticación del backend (401 con
 * credenciales inválidas, registro público que emite token).
 */

import usuarios from "../fixtures/usuarios.json";

const apiUrl = Cypress.env("apiUrl") as string;

describe("SIVU · Autenticación", () => {
  before(() => {
    cy.seedIfNeeded();
  });

  it("muestra la página de login con sus campos", () => {
    cy.visit("/login");
    cy.contains(/iniciar sesi[oó]n|bienvenid|sivu/i).should("be.visible");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
    cy.get('button[type="submit"]').should("exist");
  });

  it("permite iniciar sesión como administrador y sale de /login", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').first().clear().type(usuarios.admin.email);
    cy.get('input[type="password"]').first().clear().type(usuarios.admin.password, { log: false });
    cy.get('button[type="submit"]').first().click();

    // Tras autenticarse, el frontend navega fuera de /login (a la raíz protegida).
    cy.location("pathname", { timeout: 10_000 }).should("not.match", /\/login\/?$/);
  });

  it("rechaza credenciales inválidas (401) y permanece en /login", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/auth/login`,
      body: { email: usuarios.admin.email, password: "contrasena-incorrecta" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.accessToken).to.be.undefined;
    });

    cy.visit("/login");
    cy.get('input[type="email"]').first().clear().type(usuarios.admin.email);
    cy.get('input[type="password"]').first().clear().type("contrasena-incorrecta", { log: false });
    cy.get('button[type="submit"]').first().click();
    cy.location("pathname", { timeout: 8000 }).should("match", /\/login\/?$/);
  });

  it("una ruta protegida sin sesión redirige a /login", () => {
    cy.visit("/estudiantes");
    cy.location("pathname", { timeout: 8000 }).should("match", /\/login\/?$/);
  });

  it("el registro público emite un accessToken para el nuevo estudiante", () => {
    const email = `${usuarios.registroNuevo.emailPrefix}${Date.now()}${usuarios.registroNuevo.emailDomain}`;
    cy.request({
      method: "POST",
      url: `${apiUrl}/auth/register`,
      body: {
        nombres: usuarios.registroNuevo.nombres,
        apellidos: usuarios.registroNuevo.apellidos,
        email,
        password: usuarios.registroNuevo.password,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
      expect(res.body.accessToken).to.be.a("string");
    });
  });

  it("hidrata la sesión y entra a una ruta protegida (visita autenticada)", () => {
    cy.loginAsAdmin();
    cy.visitAuthed("/estudiantes");
    cy.location("pathname", { timeout: 10_000 }).should("eq", "/estudiantes");
  });
});
