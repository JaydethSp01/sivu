// Custom commands de Cypress para SIVU.
// Convención: cada comando que toca API usa cy.request contra Cypress.env('apiUrl')
// para evitar acoplarse a un endpoint específico del frontend.

/// <reference types="cypress" />

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Login vía API; guarda la sesión para hidratar visitas autenticadas. */
      apiLogin(email: string, password: string): Chainable<string>;
      loginAsAdmin(): Chainable<string>;
      loginAsCoordinador(): Chainable<string>;
      loginAsEstudiante(): Chainable<string>;
      loginAsEmpresa(): Chainable<string>;
      /** POST /admin/seed autenticado como admin; idempotente. */
      seedIfNeeded(): Chainable<void>;
      /** Visita una ruta del frontend con la sesión del último apiLogin ya hidratada. */
      visitAuthed(path: string): Chainable<Cypress.AUTWindow>;
    }
  }
}

// La app persiste la sesión con zustand/persist bajo esta clave y forma.
const AUTH_STORAGE_KEY = "sivu-auth";

interface Session {
  accessToken: string;
  refreshToken: string;
  usuario: unknown;
}

// Vive a nivel de módulo: persiste entre tests del mismo spec.
let lastSession: Session | null = null;

function writeAuthStorage(win: Window, s: Session): void {
  win.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      state: { accessToken: s.accessToken, refreshToken: s.refreshToken, usuario: s.usuario },
      version: 0,
    })
  );
}

Cypress.Commands.add("apiLogin", (email: string, password: string) => {
  const apiUrl = Cypress.env("apiUrl");
  return cy
    .request<{ accessToken: string; refreshToken: string; usuario: unknown }>({
      method: "POST",
      url: `${apiUrl}/auth/login`,
      body: { email, password },
      failOnStatusCode: true,
    })
    .then((res) => {
      expect(res.status).to.eq(200);
      const { accessToken, refreshToken, usuario } = res.body;
      lastSession = { accessToken, refreshToken, usuario };
      return accessToken;
    });
});

Cypress.Commands.add("loginAsAdmin", () => cy.apiLogin("admin@uempresarial.edu.co", "Admin123*"));
Cypress.Commands.add("loginAsCoordinador", () => cy.apiLogin("coord@uempresarial.edu.co", "Coord123*"));
Cypress.Commands.add("loginAsEstudiante", () => cy.apiLogin("kelly@est.uempresarial.edu.co", "Estudiante123*"));
Cypress.Commands.add("loginAsEmpresa", () => cy.apiLogin("rrhh@coally.com", "Empresa123*"));

Cypress.Commands.add("seedIfNeeded", () => {
  const apiUrl = Cypress.env("apiUrl");
  // /admin/seed exige rol ADMIN; autenticamos primero. El backend además
  // auto-siembra al arrancar (SeedBootstrap), así que esto es un refuerzo.
  cy.request({
    method: "POST",
    url: `${apiUrl}/auth/login`,
    body: { email: "admin@uempresarial.edu.co", password: "Admin123*" },
    failOnStatusCode: false,
  }).then((login) => {
    const token = login.status === 200 ? login.body.accessToken : null;
    cy.request({
      method: "POST",
      url: `${apiUrl}/admin/seed`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 400, 409]).to.include(res.status);
    });
  });
});

Cypress.Commands.add("visitAuthed", (path: string) => {
  return cy.visit(path, {
    onBeforeLoad(win) {
      if (lastSession) writeAuthStorage(win, lastSession);
    },
  });
});
