/// <reference types="cypress" />

// Comando personalizado del Taller 11 (ya está listo).
// Inicia sesión directamente con la API (sin usar el formulario) y abre la ruta indicada
// con la sesión ya guardada en localStorage. Así, las pruebas que no prueban el inicio
// de sesión no necesitan repetir el formulario cada vez.
//
// Uso: cy.visitarConSesion("/publicaciones", "ana", "ana-12345")

const API_URL = "http://localhost:3000";

Cypress.Commands.add("visitarConSesion", (ruta: string, username: string, password: string) => {
  cy.request("POST", `${API_URL}/api/login`, { username, password }).then(({ body }) => {
    cy.visit(ruta, {
      onBeforeLoad(ventana) {
        ventana.localStorage.setItem("taller9-sesion", JSON.stringify(body));
      }
    });
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitarConSesion(ruta: string, username: string, password: string): Chainable<void>;
    }
  }
}

export {};
