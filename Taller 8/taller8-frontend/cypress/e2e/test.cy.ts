describe('Taller 8', () => {
  it('Muestra la página de publicaciones', () => {
    cy.visit('/')
    cy.contains('Publicaciones')
  })
})
