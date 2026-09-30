describe('Taller 7', () => {
  it('Muestra la página de pruebas', () => {
    cy.visit('/')
    cy.contains('Pruebas de la API')
  })
})
