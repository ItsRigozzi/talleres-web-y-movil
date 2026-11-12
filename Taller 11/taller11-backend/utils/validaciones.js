// Funciones de validación (ya está listo).
// Son funciones "puras": no dependen de Express ni de los datos guardados,
// por lo que se pueden probar de forma aislada (pruebas unitarias).

// Devuelve un mensaje de error si faltan datos, o null si la publicación es válida.
const validarPublicacion = (datos) => {
  if (!datos || !datos.title || !datos.body) {
    return "Debes enviar title y body";
  }
  return null;
};

module.exports = { validarPublicacion };
