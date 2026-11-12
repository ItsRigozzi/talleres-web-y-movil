describe('Taller 11', () => {
  it('Redirige al inicio de sesión si no hay sesión', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
    cy.contains('Iniciar sesión').should('be.visible')
  })
})
