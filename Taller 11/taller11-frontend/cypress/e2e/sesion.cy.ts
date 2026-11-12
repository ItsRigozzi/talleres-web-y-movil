// Pruebas de interfaz del inicio de sesión.
// Requiere el backend (npm run dev) y el frontend (ionic serve) en ejecución.

describe('Inicio de sesión', () => {
  it('inicia sesión con un usuario de prueba', () => {
    cy.visit('/login')
    cy.get('input[autocomplete="username"]').type('ana')
    cy.get('input[type="password"]').type('ana-12345')
    cy.get('ion-button[type="submit"]').click()

    cy.url().should('include', '/publicaciones')
    cy.get('.usuario').should('have.text', 'ana')
  })

  it('no inicia sesión si la contraseña es incorrecta', () => {
    cy.intercept('POST', 'http://localhost:3000/api/login').as('login')
    cy.visit('/login')
    cy.get('input[autocomplete="username"]').type('ana')
    cy.get('input[type="password"]').type('incorrecta')
    cy.get('ion-button[type="submit"]').click()

    cy.wait('@login').its('response.statusCode').should('eq', 401)
    cy.url().should('include', '/login')
    cy.window().its('localStorage').invoke('getItem', 'taller9-sesion').should('be.null')
  })

  it('cierra la sesión con el botón Salir', () => {
    cy.visitarConSesion('/publicaciones', 'ana', 'ana-12345')
    cy.contains('ion-button', 'Salir').click()

    cy.url().should('include', '/login')
    cy.window().its('localStorage').invoke('getItem', 'taller9-sesion').should('be.null')
  })
})
