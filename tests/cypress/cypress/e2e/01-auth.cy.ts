/// <reference types="cypress" />

/**
 * SIVU - Autenticación
 *
 * Cubre el flujo de inicio de sesión, registro y cierre de sesión desde el
 * frontend React/Vite. Los selectores priorizan `data-testid`, pero caen a
 * textos en español que el frontend debería exponer.
 *
 * data-testid esperados (documentados aquí para el equipo de frontend):
 *   - data-testid="login-email"
 *   - data-testid="login-password"
 *   - data-testid="login-submit"
 *   - data-testid="login-error"
 *   - data-testid="dashboard-root"
 *   - data-testid="user-menu"
 *   - data-testid="logout-button"
 *   - data-testid="register-link"
 *   - data-testid="register-nombres"
 *   - data-testid="register-apellidos"
 *   - data-testid="register-email"
 *   - data-testid="register-password"
 *   - data-testid="register-submit"
 */

import usuarios from "../fixtures/usuarios.json";

describe("SIVU · Autenticación", () => {
  before(() => {
    cy.seedIfNeeded();
  });

  it("permite iniciar sesión como administrador y muestra el dashboard", () => {
    cy.visit("/");
    cy.contains(/iniciar sesi[oó]n/i, { matchCase: false }).should("be.visible");

    cy.get('[data-testid="login-email"], input[name="email"], input[type="email"]')
      .first()
      .clear()
      .type(usuarios.admin.email);
    cy.get('[data-testid="login-password"], input[name="password"], input[type="password"]')
      .first()
      .clear()
      .type(usuarios.admin.password, { log: false });

    cy.get('[data-testid="login-submit"], button[type="submit"]').first().click();

    // Espera redirección al dashboard
    cy.url({ timeout: 10_000 }).should("not.match", /\/login\/?$/);
    cy.get('[data-testid="dashboard-root"], main, [role="main"]', { timeout: 10_000 })
      .should("be.visible");
    cy.contains(/dashboard|panel|inicio|bienvenid/i).should("exist");
  });

  it("rechaza credenciales inválidas y muestra mensaje de error", () => {
    cy.visit("/");
    cy.get('[data-testid="login-email"], input[name="email"], input[type="email"]')
      .first()
      .clear()
      .type(usuarios.admin.email);
    cy.get('[data-testid="login-password"], input[name="password"], input[type="password"]')
      .first()
      .clear()
      .type("contrasena-incorrecta", { log: false });

    cy.get('[data-testid="login-submit"], button[type="submit"]').first().click();

    // El frontend debe seguir en /login y mostrar un error
    cy.url().should("match", /\/(login)?\/?$/);
    cy.contains(/(credenciales|invalid|incorrect|err)/i, { timeout: 8000 }).should("be.visible");
  });

  it("permite cerrar sesión desde el menú de usuario", () => {
    cy.loginAsAdmin();
    cy.visit("/");

    cy.get('[data-testid="user-menu"], button[aria-label*="usuario"], button:contains("Admin")', {
      timeout: 10_000,
    })
      .first()
      .click({ force: true });

    cy.get('[data-testid="logout-button"]')
      .then(($el) => {
        if ($el.length) {
          cy.wrap($el.first()).click({ force: true });
        } else {
          cy.contains(/cerrar sesi[oó]n|salir|logout/i).click({ force: true });
        }
      });

    cy.url({ timeout: 8000 }).should("match", /\/(login)?\/?$/);
    cy.window().its("localStorage").invoke("getItem", "sivu.accessToken").should("not.exist");
  });

  it("registra un nuevo estudiante desde el formulario público", () => {
    const sufijo = Date.now();
    const email = `${usuarios.registroNuevo.emailPrefix}${sufijo}${usuarios.registroNuevo.emailDomain}`;

    cy.visit("/");
    cy.get('[data-testid="register-link"]')
      .then(($el) => {
        if ($el.length) cy.wrap($el.first()).click({ force: true });
        else cy.contains(/registr/i).first().click({ force: true });
      });

    cy.get('[data-testid="register-nombres"], input[name="nombres"]').first().type(usuarios.registroNuevo.nombres);
    cy.get('[data-testid="register-apellidos"], input[name="apellidos"]').first().type(usuarios.registroNuevo.apellidos);
    cy.get('[data-testid="register-email"], input[name="email"], input[type="email"]').first().type(email);
    cy.get('[data-testid="register-password"], input[name="password"], input[type="password"]').first().type(usuarios.registroNuevo.password, { log: false });
    cy.get('[data-testid="register-submit"], button[type="submit"]').first().click();

    cy.url({ timeout: 10_000 }).should("not.match", /\/register\/?$/);
    cy.window().its("localStorage").invoke("getItem", "sivu.accessToken").should("exist");
  });

  it("muestra el dashboard tras login programático (visita autenticada)", () => {
    cy.loginAsAdmin();
    cy.visit("/");
    cy.get('[data-testid="dashboard-root"], main, [role="main"]').should("be.visible");
  });
});
