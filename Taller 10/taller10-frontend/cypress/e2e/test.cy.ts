describe('Taller 10', () => {
  it('Muestra la página de publicaciones', () => {
    cy.visit('/')
    cy.contains('Publicaciones')
  })
})
