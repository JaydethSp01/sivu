// Punto de entrada para todos los specs E2E de SIVU.
// Importa los custom commands y aplica configuraciones globales.
import "./commands";

// Evita que excepciones del runtime de la app rompan los specs;
// el frontend académico puede tirar warnings de React/HMR.
Cypress.on("uncaught:exception", (err) => {
  // eslint-disable-next-line no-console
  console.warn("[cypress] uncaught exception:", err.message);
  return false;
});

beforeEach(() => {
  // Limpia storage entre tests para evitar sesiones cruzadas
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});
