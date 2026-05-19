// Custom commands de Cypress para SIVU.
// Convención: cada comando que toca API usa cy.request contra Cypress.env('apiUrl')
// para evitar acoplarse a un endpoint específico del frontend.

/// <reference types="cypress" />

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Login vía API y guarda el access token en localStorage bajo la clave
       * convenida por el frontend ("sivu.accessToken"). El frontend debería
       * leerla en el bootstrap para hidratar la sesión.
       */
      apiLogin(email: string, password: string): Chainable<string>;
      loginAsAdmin(): Chainable<string>;
      loginAsCoordinador(): Chainable<string>;
      loginAsEstudiante(): Chainable<string>;
      loginAsEmpresa(): Chainable<string>;
      /**
       * Llama POST /admin/seed; es idempotente. Útil para asegurar datos demo
       * antes de un spec sin importar cuántas veces se ejecute.
       */
      seedIfNeeded(): Chainable<void>;
      /**
       * Visita una ruta del frontend con sesión ya hidratada (token en storage).
       */
      visitAuthed(path: string): Chainable<Cypress.AUTWindow>;
    }
  }
}

const STORAGE_KEY = "sivu.accessToken";
const STORAGE_REFRESH = "sivu.refreshToken";
const STORAGE_USER = "sivu.user";

Cypress.Commands.add("apiLogin", (email: string, password: string) => {
  const apiUrl = Cypress.env("apiUrl");
  return cy
    .request({
      method: "POST",
      url: `${apiUrl}/auth/login`,
      body: { email, password },
      failOnStatusCode: true,
    })
    .then((res) => {
      expect(res.status).to.eq(200);
      const { accessToken, refreshToken, usuario } = res.body;
      cy.window().then((win) => {
        win.localStorage.setItem(STORAGE_KEY, accessToken);
        win.localStorage.setItem(STORAGE_REFRESH, refreshToken);
        win.localStorage.setItem(STORAGE_USER, JSON.stringify(usuario));
      });
      return cy.wrap(accessToken);
    });
});

Cypress.Commands.add("loginAsAdmin", () => {
  return cy.apiLogin("admin@uempresarial.edu.co", "Admin123*");
});

Cypress.Commands.add("loginAsCoordinador", () => {
  return cy.apiLogin("coord@uempresarial.edu.co", "Coord123*");
});

Cypress.Commands.add("loginAsEstudiante", () => {
  return cy.apiLogin("kelly@est.uempresarial.edu.co", "Estudiante123*");
});

Cypress.Commands.add("loginAsEmpresa", () => {
  return cy.apiLogin("rrhh@coally.com", "Empresa123*");
});

Cypress.Commands.add("seedIfNeeded", () => {
  const apiUrl = Cypress.env("apiUrl");
  cy.request({
    method: "POST",
    url: `${apiUrl}/admin/seed`,
    failOnStatusCode: false,
  }).then((res) => {
    // /admin/seed es idempotente; aceptamos 200 o 4xx si ya está semillado
    expect([200, 400, 409]).to.include(res.status);
  });
});

Cypress.Commands.add("visitAuthed", (path: string) => {
  return cy.visit(path, {
    onBeforeLoad(win) {
      // Asume que el frontend ya tiene el token en localStorage; si no, este
      // hook se puede ampliar para inyectar headers en interceptores.
    },
  });
});
